// scripts/verify-integrity.mjs
// Test script to verify anti-cheating and integrity tracking with real auth

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("=============================================================");
  console.log("   TESTING ANTI-CHEATING & INTEGRITY TRACKING SYSTEM");
  console.log("=============================================================\n");
  console.log(`Target URL: ${BASE_URL}`);

  // Step 1: Create and authenticate a test user
  const testEmail = `candidate.integrity.${Date.now()}@gmail.com`;
  const testPassword = "IntegrityPass2026!#";
  const testFullName = "Proctoring Test Candidate";

  console.log(`\n1. Creating test candidate: ${testEmail}...`);
  const { data: adminUser, error: adminCreateErr } = await adminSupabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: testFullName },
  });
  if (adminCreateErr) throw adminCreateErr;
  console.log(`   Candidate created with confirmed email! User ID: ${adminUser.user.id}`);

  // Ensure profile has at least 1 credit
  await adminSupabase.from("profiles").upsert({
    id: adminUser.user.id,
    email: testEmail,
    credits: 5,
  });

  // Step 2: Log in to obtain session cookies
  console.log("\n2. Logging in to obtain session cookies...");
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
  const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
  console.log(`   Logged in successfully as "${loginData.user.full_name}"!`);

  // Step 3: Start an interview session
  console.log("\n3. Starting interview session (/api/interview/start)...");
  const startRes = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      role: "SDE",
      company_type: "product",
      difficulty: "medium",
      round: "cs_fundamentals",
    }),
  });

  const startData = await startRes.json();
  const interviewId = startData.interview?.id || startData.interview_id;
  if (!startRes.ok || !interviewId) {
    throw new Error(`Failed to start interview: ${JSON.stringify(startData)}`);
  }
  console.log(`   Interview started successfully! Interview ID: ${interviewId}`);

  // Step 4: Simulate and record integrity events
  console.log("\n4. Simulating integrity violations via /api/interview/integrity...");
  const testEvents = [
    { event_type: "tab_switch", details: { reason: "Switched to tab with external documentation" } },
    { event_type: "window_blur", details: { reason: "Browser window lost focus" } },
    { event_type: "fullscreen_exit", details: { reason: "Exited fullscreen via ESC" } },
    { event_type: "paste_attempt", details: { target: "answer_input", length: 154 } },
    { event_type: "paste_attempt", details: { target: "monaco_editor", length: 320 } },
  ];

  for (const evt of testEvents) {
    const postRes = await fetch(`${BASE_URL}/api/interview/integrity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        interview_id: interviewId,
        event_type: evt.event_type,
        details: evt.details,
      }),
    });
    const postData = await postRes.json();
    if (!postRes.ok) {
      throw new Error(`Failed to log ${evt.event_type}: ${JSON.stringify(postData)}`);
    }
    console.log(`   ✓ Logged event [${evt.event_type}]`);
  }

  // Step 5: Query integrity summary via GET /api/interview/integrity
  console.log("\n5. Querying integrity summary (/api/interview/integrity?interview_id=...)...");
  const getIntegrityRes = await fetch(`${BASE_URL}/api/interview/integrity?interview_id=${interviewId}`, {
    headers: { Cookie: cookieHeader },
  });
  const integrityData = await getIntegrityRes.json();
  console.log("   Summary received:", JSON.stringify(integrityData.summary));

  if (integrityData.summary.tab_switches !== 1) {
    throw new Error(`Expected tab_switches=1, got ${integrityData.summary.tab_switches}`);
  }
  if (integrityData.summary.fullscreen_exits !== 1) {
    throw new Error(`Expected fullscreen_exits=1, got ${integrityData.summary.fullscreen_exits}`);
  }
  if (integrityData.summary.paste_attempts !== 2) {
    throw new Error(`Expected paste_attempts=2, got ${integrityData.summary.paste_attempts}`);
  }
  if (integrityData.summary.risk_level !== "High") {
    throw new Error(`Expected risk_level='High', got ${integrityData.summary.risk_level}`);
  }
  console.log(`   ✓ Correctly categorized risk level as: ${integrityData.summary.risk_level}`);

  // Step 6: Verify /api/interview/[id] returns integrity data
  console.log("\n6. Verifying /api/interview/[id] includes integrity_events and integrity_summary...");
  const getInterviewRes = await fetch(`${BASE_URL}/api/interview/${interviewId}`, {
    headers: { Cookie: cookieHeader },
  });
  const fullInterviewData = await getInterviewRes.json();
  if (!fullInterviewData.integrity_events || !fullInterviewData.integrity_summary) {
    throw new Error("Missing integrity_events or integrity_summary in /api/interview/[id]");
  }
  console.log(`   ✓ Found ${fullInterviewData.integrity_events.length} integrity records and risk_level='${fullInterviewData.integrity_summary.risk_level}'`);

  // Step 7: Finish the interview
  console.log("\n7. Finishing interview to generate evaluation report...");
  const finishRes = await fetch(`${BASE_URL}/api/interview/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ interview_id: interviewId }),
  });
  const finishData = await finishRes.json();
  console.log(`   ✓ Finish status: ${finishData.status} | Feedback Overall: ${finishData.feedback?.overall}/100`);

  // Step 8: Fetch and verify report page HTML
  console.log("\n8. Verifying Integrity & Proctoring section renders in /interview/[id]/report...");
  const reportRes = await fetch(`${BASE_URL}/interview/${interviewId}/report`, {
    headers: { Cookie: cookieHeader },
  });
  const reportHtml = await reportRes.text();

  const secIdx = reportHtml.indexOf("Assessment Integrity");
  if (secIdx !== -1) {
    console.log("   --- RENDERED INTEGRITY SECTION SNIPPET ---");
    console.log(reportHtml.slice(secIdx - 50, secIdx + 600));
    console.log("   -------------------------------------------");
  }

  const checks = [
    { label: "Integrity Section Heading", passed: reportHtml.includes("Assessment Integrity") },
    { label: "High Risk Badge", passed: reportHtml.includes("High<!-- --> Risk") || reportHtml.includes("High Risk") },
    { label: "Tab Switches Metric", passed: reportHtml.includes("Tab Switches") },
    { label: "Fullscreen Exits Metric", passed: reportHtml.includes("Fullscreen Exits") },
    { label: "Camera Absences Metric", passed: reportHtml.includes("Camera Absences") },
    { label: "Multiple Faces Metric", passed: reportHtml.includes("Multiple Faces") },
    { label: "Paste Blocked Metric", passed: reportHtml.includes("Paste Blocked") },
    { label: "Total Strikes Metric", passed: reportHtml.includes("Total Strikes") },
    { label: "Client-Side Presence Disclosure", passed: reportHtml.includes("Video frames are processed entirely on-device") || reportHtml.includes("Client-side Presence") },
  ];

  for (const check of checks) {
    if (check.passed) {
      console.log(`   ✓ PASSED: ${check.label} found in report HTML`);
    } else {
      throw new Error(`FAILED: ${check.label} missing in report HTML!`);
    }
  }

  // Cleanup test user
  await adminSupabase.auth.admin.deleteUser(adminUser.user.id);
  console.log(`\nCleaned up test candidate user (${adminUser.user.id})`);

  console.log("\n=============================================================");
  console.log("   ALL INTEGRITY & ANTI-CHEATING VERIFICATIONS PASSED! ");
  console.log("=============================================================");
}

run().catch((err) => {
  console.error("Integrity test failed:", err);
  process.exit(1);
});
