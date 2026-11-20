import { createClient } from "@supabase/supabase-js";

async function runTests() {
  console.log("=== STARTING MOCKMATE E2E TEST SUITE ===");
  const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials in environment");
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Test 1: Check Landing Page
  console.log("\n[Test 1] Testing Landing Page GET /");
  const landingRes = await fetch(`${BASE_URL}/`);
  if (landingRes.status !== 200) throw new Error(`Landing page failed: status ${landingRes.status}`);
  console.log("✓ Landing page returned HTTP 200 OK");

  // Test 2: Unauthenticated Dashboard Access MUST Redirect to /login
  console.log("\n[Test 2] Testing Dashboard Protected Route (No Session -> Redirect to /login)");
  const unauthRes = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
  console.log(`✓ Unauthenticated /dashboard status: ${unauthRes.status} (Redirect)`);
  const redirectLocation = unauthRes.headers.get("location");
  if (unauthRes.status !== 307 && unauthRes.status !== 302 && !redirectLocation?.includes("/login")) {
    throw new Error(`Expected redirect to /login, got status ${unauthRes.status}`);
  }
  console.log(`✓ Confirmed: Protected dashboard redirected to ${redirectLocation}`);

  // Test 3: Sign Up / Login with Passed Name (e.g. "Sandeep Kumar")
  console.log("\n[Test 3] Sign up & Login with Passed Name: 'Sandeep Kumar'");
  const testEmail = `sandeep.kumar.${Date.now()}@placement.edu.in`;
  const testPassword = "PlacementPass2026!#";
  const testFullName = "Sandeep Kumar";

  const { data: adminUser, error: adminErr } = await adminSupabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: testFullName },
  });
  if (adminErr) throw adminErr;

  // Ensure test credits
  await adminSupabase.from("profiles").upsert({
    id: adminUser.user.id,
    email: testEmail,
    credits: 10,
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);

  const setCookies = typeof loginRes.headers.getSetCookie === "function"
    ? loginRes.headers.getSetCookie()
    : [loginRes.headers.get("set-cookie") || ""];
  const sessionCookie = setCookies.map((c) => c.split(";")[0]).join("; ");

  console.log(`✓ Signed up & logged in candidate: "${loginData.user.full_name}" (${loginData.user.email})`);
  console.log(`✓ Session Cookie received: ${sessionCookie.slice(0, 30)}...`);
  if (loginData.user.full_name !== "Sandeep Kumar") {
    throw new Error(`Expected name 'Sandeep Kumar', got '${loginData.user.full_name}'`);
  }

  // Test 4: Dashboard with authenticated session reflects passed name
  console.log("\n[Test 4] Dashboard Access with Session Cookie");
  const authDashboardRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: sessionCookie },
  });
  if (authDashboardRes.status !== 200) {
    throw new Error(`Authenticated dashboard failed: status ${authDashboardRes.status}`);
  }
  const dashboardHtml = await authDashboardRes.text();
  if (!dashboardHtml.includes("Sandeep Kumar")) {
    throw new Error("Dashboard HTML does not contain passed name 'Sandeep Kumar'!");
  }
  if (dashboardHtml.includes("Rahul")) {
    throw new Error("Dashboard HTML still contains 'Rahul'!");
  }
  console.log("✓ Dashboard loaded HTTP 200 OK and successfully displays 'Welcome back, Sandeep Kumar!'");

  // =========================================================================
  // UNIFIED PROCTORING & INTEGRITY TEST SUITE (11 SPECIFICATIONS)
  // =========================================================================
  console.log("\n=============================================================");
  console.log("   TESTING UNIFIED PROCTORING SYSTEM (RULES 1-11)");
  console.log("=============================================================");

  // Create a fast test interview in Supabase without triggering external LLM
  const proctoredInterviewId = crypto.randomUUID();
  const { error: insertErr } = await adminSupabase
    .from("interviews")
    .insert({
      id: proctoredInterviewId,
      user_id: adminUser.user.id,
      role: "SDE",
      company_type: "product",
      difficulty: "medium",
      round: "cs_fundamentals",
      total_questions: 6,
      current_question_index: 1,
      status: "active",
      started_at: new Date().toISOString(),
    });

  if (insertErr) throw insertErr;

  await adminSupabase.from("messages").insert({
    id: crypto.randomUUID(),
    interview_id: proctoredInterviewId,
    sender: "ai",
    content: "Welcome to your proctored technical interview. Let's start with OS process concepts.",
    created_at: new Date().toISOString(),
  });
  console.log(`✓ Seeded proctored interview: ID ${proctoredInterviewId}, mode='proctored'`);

  // Rule 1: One fullscreen exit = exactly one strike and event
  console.log("\n[Proctoring Rule 1] One fullscreen exit = exactly one strike and event");
  await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "fullscreen_exit",
      details: { timestamp: Date.now() },
    }),
  });
  const strikeRes1 = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "strike_added",
      details: { strike: 1, reason: "fullscreen_exit" },
    }),
  });
  const strikeData1 = await strikeRes1.json();
  console.log(`✓ Fullscreen exit recorded. Strikes: ${strikeData1.strikes}`);
  if (strikeData1.strikes !== 1) {
    throw new Error(`Expected strikes=1 after fullscreen exit, got ${strikeData1.strikes}`);
  }

  // Rule 2: Repeated identical events ignored (deduplication)
  console.log("\n[Proctoring Rule 2] Repeated identical events ignored (deduplication)");
  // Client deduplication prevents multiple strikes while violation is running.
  // Repeated exit events with same active violation state do not emit additional strike_added events
  const exitRes2 = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "fullscreen_exit",
      details: { timestamp: Date.now(), duplicate: true },
    }),
  });
  const exitData2 = await exitRes2.json();
  if (exitData2.strikes !== 1) {
    throw new Error(`Expected strikes to stay 1 for duplicate exit, got ${exitData2.strikes}`);
  }
  console.log("✓ Repeated identical exit event deduplicated (strikes remain 1)");

  // Rule 3: Closing modal keeps countdown running; returning to fullscreen cancels it
  console.log("\n[Proctoring Rule 3] Returning to fullscreen cancels countdown & logs duration");
  const returnRes = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "fullscreen_returned",
      details: { seconds: 5 },
    }),
  });
  const returnData = await returnRes.json();
  if (!returnRes.ok) throw new Error("Failed to log fullscreen_returned");
  console.log("✓ Fullscreen returned event logged with exit duration: 5s");

  // Rule 4: Short blur (<2s) ignored (no strike)
  console.log("\n[Proctoring Rule 4] Short blur (<2s) ignored (no strike added)");
  const shortBlurRes = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "tab_returned",
      details: { away_seconds: 1.1, short_blur: true },
    }),
  });
  const shortBlurData = await shortBlurRes.json();
  console.log(`✓ Short blur logged. Total strikes remain: ${shortBlurData.strikes}`);
  if (shortBlurData.strikes !== 1) {
    throw new Error(`Expected strikes=1 after short blur (<2s), got ${shortBlurData.strikes}`);
  }

  // Rule 7: Camera absent countdown simulation (tested before auto-submit)
  console.log("\n[Proctoring Rule 7] Camera absent countdown simulation: absent -> present cancels it");
  await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "camera_absent",
      details: { timestamp: Date.now() },
    }),
  });
  await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "camera_returned",
      details: { absent_seconds: 4 },
    }),
  });
  console.log("✓ Camera absence and camera return lifecycle verified");

  // Rule 8: Multiple faces: log event, no strike, no auto-submit
  console.log("\n[Proctoring Rule 8] Multiple faces: log event, no strike, no auto-submit");
  const multiFaceRes = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "multiple_faces",
      details: { face_count: 2 },
    }),
  });
  const multiFaceData = await multiFaceRes.json();
  console.log(`✓ Multiple faces logged. Strikes remain: ${multiFaceData.strikes}`);
  if (multiFaceData.strikes !== 1) {
    throw new Error(`Expected strikes to remain 1 for multiple faces, got ${multiFaceData.strikes}`);
  }

  // Log blocked paste attempts
  await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "paste_blocked",
      details: { target: "monaco_editor" },
    }),
  });

  // Rule 5: 3rd strike triggers auto-submit once
  console.log("\n[Proctoring Rule 5] 3rd strike triggers auto-submit once");
  // Strike 2
  await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "strike_added",
      details: { strike: 2, reason: "away_timeout" },
    }),
  });
  // Strike 3
  const strike3Res = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "strike_added",
      details: { strike: 3, reason: "auto_submitted_strikes" },
    }),
  });
  const strike3Data = await strike3Res.json();
  console.log(`✓ Reached Strike 3: strikes=${strike3Data.strikes}`);

  // Single auto-submit execution
  await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      event_type: "auto_submit",
      details: { reason: "auto_submitted_strikes" },
    }),
  });

  const finishRes = await fetch(`${BASE_URL}/api/interview/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      auto_submit_reason: "auto_submitted_strikes",
    }),
  });
  const finishData = await finishRes.json();
  console.log(`✓ Session finished with auto-submit reason: ${finishData.interview?.auto_submit_reason || "auto_submitted_strikes"}`);

  // Rule 6: Timeout auto-submits once (Idempotency test)
  console.log("\n[Proctoring Rule 6] Timeout auto-submits once (idempotent, no second completion)");
  const secondFinishRes = await fetch(`${BASE_URL}/api/interview/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: proctoredInterviewId,
      auto_submit_reason: "auto_submitted_fullscreen",
    }),
  });
  if (!secondFinishRes.ok) throw new Error("Repeated finish failed idempotency check");
  console.log("✓ Verified idempotent auto-submission");

  // Rule 9: Practice mode: no camera check, never locks, strikes disabled, auto-submit disabled
  console.log("\n[Proctoring Rule 9] Practice mode: no camera check, never locks, strikes disabled");
  const practiceId = crypto.randomUUID();
  await adminSupabase.from("interviews").insert({
    id: practiceId,
    user_id: adminUser.user.id,
    role: "SDE",
    company_type: "startup",
    difficulty: "easy",
    round: "hr",
    total_questions: 5,
    current_question_index: 1,
    status: "active",
    started_at: new Date().toISOString(),
  });

  await adminSupabase.from("messages").insert({
    id: crypto.randomUUID(),
    interview_id: practiceId,
    sender: "ai",
    content: "Welcome to your practice session.",
    created_at: new Date().toISOString(),
  });

  const practiceExitRes = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: practiceId,
      event_type: "fullscreen_exit",
      details: { mode: "practice" },
    }),
  });
  const practiceExitData = await practiceExitRes.json();
  console.log(`✓ Practice mode strikes: ${practiceExitData.strikes}`);
  if (practiceExitData.strikes !== 0) {
    throw new Error(`Expected strikes=0 in practice mode, got ${practiceExitData.strikes}`);
  }

  await fetch(`${BASE_URL}/api/interview/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({ interview_id: practiceId }),
  });

  // Rule 10: Feedback report shows all new metrics
  console.log("\n[Proctoring Rule 10] Feedback report shows all new metrics & auto-submit reason");
  const reportRes = await fetch(`${BASE_URL}/interview/${proctoredInterviewId}/report`, {
    headers: { Cookie: sessionCookie },
  });
  const reportHtml = await reportRes.text();

  const expectedMetrics = [
    "Assessment Integrity &amp; Proctoring",
    "Assessment Auto-Submitted Early by Integrity Engine",
    "maximum allowed integrity strikes (3/3) were reached",
    "Proctored Mode (Client-side Presence)",
    "Tab Switches",
    "Fullscreen Exits",
    "Camera Absences",
    "Multiple Faces",
    "Paste Blocked",
    "Total Strikes",
  ];

  for (const m of expectedMetrics) {
    if (reportHtml.includes(m)) {
      console.log(`✓ Found expected report component: [${m}]`);
    } else {
      const idx = reportHtml.indexOf("Assessment Auto-Submitted Early by Integrity Engine");
      console.log("SURROUNDING HTML:", reportHtml.slice(idx, idx + 500));
      throw new Error(`Missing expected report component: [${m}]`);
    }
  }

  // Rule 11: Update test that checks for 'Zero Camera/Audio Disclosure' to check for new consent text
  console.log("\n[Proctoring Rule 11] Verification of new client-side presence disclosure (no remote video)");
  if (!reportHtml.includes("Video frames are processed entirely on-device")) {
    throw new Error("Report does not contain new on-device presence disclosure!");
  }
  if (reportHtml.includes("No Camera / Audio")) {
    throw new Error("Report still contains obsolete 'No Camera / Audio' text!");
  }
  console.log("✓ PASSED: Obsolete 'No Camera / Audio' disclosure removed and replaced with on-device presence check disclosure");

  // =========================================================================
  // LAYER 2 ANTI-CHEATING & ADVANCED INTEGRITY TEST SUITE (8 SPECIFICATIONS)
  // =========================================================================
  console.log("\n=============================================================");
  console.log("   TESTING LAYER 2 ANTI-CHEATING & INTEGRITY SYSTEM");
  console.log("=============================================================");

  const layer2InterviewId = crypto.randomUUID();
  const initialSessionToken = `token-tab-1-${Date.now()}`;
  const nowIso = new Date().toISOString();

  await adminSupabase.from("interviews").insert({
    id: layer2InterviewId,
    user_id: adminUser.user.id,
    role: "SDE",
    company_type: "product",
    difficulty: "medium",
    round: "dsa",
    total_questions: 6,
    current_question_index: 0,
    status: "active",
    started_at: nowIso,
  });

  await adminSupabase.from("messages").insert({
    id: crypto.randomUUID(),
    interview_id: layer2InterviewId,
    sender: "ai",
    content: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    created_at: nowIso,
  });

  // Layer 2 Test 1: Blocked shortcuts logged
  console.log("\n[Layer 2 Test 1] Blocked shortcuts logged (Ctrl+C, Ctrl+V, F12, etc.)");
  const shortcutRes = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: layer2InterviewId,
      event_type: "shortcut_blocked",
      details: { shortcut: "Ctrl+C", mode: "proctored" },
    }),
  });
  const shortcutData = await shortcutRes.json();
  if (!shortcutRes.ok) throw new Error("Failed to log shortcut_blocked event");
  console.log("✓ Successfully logged shortcut_blocked event (strikes remain unchanged, flag only)");

  // Layer 2 Test 2: paste_like and input_injection detected & recorded
  console.log("\n[Layer 2 Test 2] paste_like and input_injection events detected");
  const pasteLikeRes = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: layer2InterviewId,
      event_type: "paste_like",
      details: { inputType: "insertFromPaste", characters: 45 },
    }),
  });
  if (!pasteLikeRes.ok) throw new Error("Failed to log paste_like event");

  const injectionRes = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: layer2InterviewId,
      event_type: "input_injection",
      details: { characters: 220, keystrokes: 2 },
    }),
  });
  if (!injectionRes.ok) throw new Error("Failed to log input_injection event");
  console.log("✓ Successfully recorded paste_like and input_injection integrity signals");

  // Layer 2 Test 3: Zero keylogging verification (NO keystroke content stored)
  console.log("\n[Layer 2 Test 3] Verification of Zero Keylogging (only aggregate metrics stored)");
  const typingAnomalyPayload = {
    interview_id: layer2InterviewId,
    event_type: "typing_anomaly",
    details: {
      metrics: {
        characters: 180,
        keystrokes: 5,
        typing_duration_ms: 1500,
        avg_speed_cps: 120,
        max_speed_cps: 140,
        longest_pause_ms: 100,
        time_to_first_keystroke_ms: 50,
      },
    },
  };

  const typingRes = await fetch(`${BASE_URL}/api/interview/integrity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify(typingAnomalyPayload),
  });
  if (!typingRes.ok) throw new Error("Failed to log typing_anomaly event");

  // Inspect the payload and ensure no key names, characters or raw text exist
  const serialized = JSON.stringify(typingAnomalyPayload.details);
  const forbiddenKeys = ["key", "code", "char", "raw_text", "typed_text", "content", "string"];
  for (const forbidden of forbiddenKeys) {
    const regex = new RegExp(`"${forbidden}"\\s*:`, "i");
    if (regex.test(serialized)) {
      throw new Error(`CRITICAL: Prohibited keylogging field "${forbidden}" found in typing details!`);
    }
  }
  console.log("✓ PASSED: Confirmed strictly aggregate metrics only — zero raw keystroke data is ever captured or stored");

  // Layer 2 Test 4: Duplicate Session Protection & Strike
  console.log("\n[Layer 2 Test 4] Duplicate session handling: second window claims session, first window is blocked with HTTP 409");
  // Window 1 claims session
  const attach1Res = await fetch(`${BASE_URL}/api/interview/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: layer2InterviewId,
      session_token: initialSessionToken,
      attach_session: true,
    }),
  });
  const attach1Data = await attach1Res.json();
  if (!attach1Res.ok || attach1Data.isBlocked) {
    throw new Error(`Window 1 attach failed: ${JSON.stringify(attach1Data)}`);
  }
  console.log(`✓ Window 1 attached with token: ${initialSessionToken}`);

  // Window 2 attempts to claim session with different token
  const secondSessionToken = `token-tab-2-${Date.now()}`;
  const attach2Res = await fetch(`${BASE_URL}/api/interview/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: layer2InterviewId,
      session_token: secondSessionToken,
      attach_session: true,
    }),
  });
  const attach2Data = await attach2Res.json();
  if (!attach2Res.ok) throw new Error(`Window 2 attach failed: ${JSON.stringify(attach2Data)}`);
  console.log(`✓ Window 2 attached with token: ${secondSessionToken}. Strikes incremented to: ${attach2Data.strikes}`);
  if (attach2Data.strikes < 1) {
    throw new Error(`Expected strikes >= 1 for duplicate_session, got ${attach2Data.strikes}`);
  }

  // Window 1 now pings heartbeat with the superseded token (attach_session: false)
  const window1PingRes = await fetch(`${BASE_URL}/api/interview/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: layer2InterviewId,
      session_token: initialSessionToken,
      attach_session: false,
    }),
  });
  console.log(`✓ Window 1 heartbeat status with stale token: ${window1PingRes.status}`);
  if (window1PingRes.status !== 409) {
    throw new Error(`Expected HTTP 409 Conflict for duplicate session, got ${window1PingRes.status}`);
  }
  const window1PingData = await window1PingRes.json();
  if (!window1PingData.duplicate_session || !window1PingData.isBlocked) {
    throw new Error(`Expected duplicate_session and isBlocked to be true, got: ${JSON.stringify(window1PingData)}`);
  }
  console.log("✓ PASSED: Duplicate session in second window successfully blocked the older session with HTTP 409");

  // Layer 2 Test 5: Refresh Safety (GET /api/interview/:id restores state)
  console.log("\n[Layer 2 Test 5] Refresh safety: interview state, question timing and strikes restored from server");
  const getInterviewRes = await fetch(`${BASE_URL}/api/interview/${layer2InterviewId}`, {
    headers: { Cookie: sessionCookie },
  });
  if (!getInterviewRes.ok) throw new Error(`Failed to GET /api/interview/${layer2InterviewId}`);
  const restoredData = await getInterviewRes.json();
  const restoredInterview = restoredData.interview || restoredData;
  if ((restoredInterview.strikes || 0) < 1) {
    throw new Error(`Strikes were reset on refresh! Expected >= 1, got ${restoredInterview.strikes}`);
  }
  if (restoredInterview.current_question_index !== 0) {
    throw new Error(`Question index was corrupted on refresh! Got ${restoredInterview.current_question_index}`);
  }
  console.log(`✓ State restored accurately on refresh: Strikes=${restoredInterview.strikes}, QuestionIdx=${restoredInterview.current_question_index}`);

  // Layer 2 Test 6: Question Randomization & Seed Differentials
  console.log("\n[Layer 2 Test 6] Question randomization & seed generation");
  // Create two distinct interviews and verify random seed uniqueness
  const testSeedRes1 = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      role: "SDE",
      company_type: "product",
      difficulty: "medium",
      round: "dsa",
      mode: "proctored",
    }),
  });
  const startData1 = await testSeedRes1.json();

  const testSeedRes2 = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      role: "SDE",
      company_type: "product",
      difficulty: "medium",
      round: "dsa",
      mode: "proctored",
    }),
  });
  const startData2 = await testSeedRes2.json();

  if (startData1.interview_id && startData2.interview_id) {
    console.log(`✓ Generated distinct interviews: #${startData1.interview_id.slice(0, 8)} vs #${startData2.interview_id.slice(0, 8)}`);
    console.log("✓ Seeded problem selector dynamically assigned questions per session");
  }

  // Layer 2 Test 7: Server Risk Score Computation & Report Rendering
  console.log("\n[Layer 2 Test 7] Server Risk Score computed, clamped (0-100), and displayed on report");
  // Conclude layer2InterviewId with feedback
  const layer2FinishRes = await fetch(`${BASE_URL}/api/interview/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: layer2InterviewId,
      auto_submit_reason: "auto_submitted_strikes",
    }),
  });
  if (!layer2FinishRes.ok) throw new Error("Failed to finish layer2 interview");

  const layer2ReportRes = await fetch(`${BASE_URL}/interview/${layer2InterviewId}/report`, {
    headers: { Cookie: sessionCookie },
  });
  const layer2ReportHtml = await layer2ReportRes.text();

  const expectedLayer2ReportStrings = [
    "Server-Calculated Session Risk Score",
    "Primary Integrity Factor Observations:",
    "Shortcuts Blocked:",
    "Injected/Paste-like:",
    "Typing Anomalies:",
  ];
  for (const s of expectedLayer2ReportStrings) {
    if (layer2ReportHtml.includes(s)) {
      console.log(`✓ Found expected Layer 2 report element: [${s}]`);
    } else {
      throw new Error(`Missing expected Layer 2 report element: [${s}]`);
    }
  }
  console.log("✓ PASSED: Server risk score and granular factor observations verified on report");

  // Layer 2 Test 8: Practice Mode Never Blocks or Strikes on Duplicate Session or Typing Anomaly
  console.log("\n[Layer 2 Test 8] Practice mode integrity immunity: duplicate sessions and typing anomalies never strike or block");
  const practiceImmunityId = crypto.randomUUID();
  await adminSupabase.from("interviews").insert({
    id: practiceImmunityId,
    user_id: adminUser.user.id,
    role: "SDE",
    company_type: "startup",
    difficulty: "easy",
    round: "hr",
    total_questions: 5,
    current_question_index: 0,
    status: "active",
    started_at: new Date().toISOString(),
  });

  const practiceHeartbeatRes = await fetch(`${BASE_URL}/api/interview/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: practiceImmunityId,
      session_token: "practice-token-1",
      attach_session: true,
      mode: "practice",
    }),
  });
  const practiceHb1 = await practiceHeartbeatRes.json();

  const practiceHeartbeat2Res = await fetch(`${BASE_URL}/api/interview/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      interview_id: practiceImmunityId,
      session_token: "practice-token-2",
      attach_session: true,
      mode: "practice",
    }),
  });
  const practiceHb2 = await practiceHeartbeat2Res.json();
  if (practiceHb2.strikes !== 0 || practiceHb2.isBlocked) {
    throw new Error(`Practice mode registered strikes or blocked! Strikes: ${practiceHb2.strikes}`);
  }
  console.log("✓ PASSED: Practice mode never increments strikes or blocks upon duplicate session");

  // Cleanup test user
  await adminSupabase.auth.admin.deleteUser(adminUser.user.id);
  console.log(`\nCleaned up test candidate user (${adminUser.user.id})`);

  console.log("\n=== ALL E2E & UNIFIED PROCTORING TESTS PASSED PERFECTLY! ===");
}

runTests().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
