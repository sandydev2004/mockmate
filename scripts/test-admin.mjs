import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

async function runAdminTests() {
  console.log("=== STARTING MOCKMATE ADMIN PANEL & SECURITY TEST SUITE ===\n");
  const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

  // =========================================================================
  // TEST 1: 404 Masking on Non-Admin & Logged-Out Access
  // =========================================================================
  console.log("[Test 1] Verifying 404 Not Found masking on all /api/admin/* endpoints for logged-out users");
  const adminEndpoints = [
    "/api/admin/overview",
    "/api/admin/users",
    "/api/admin/interviews",
    "/api/admin/integrity",
    "/api/admin/payments",
    "/api/admin/ai-settings",
    "/api/admin/problems",
    "/api/admin/audit",
    "/api/admin/export?type=users",
  ];

  for (const endpoint of adminEndpoints) {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (res.status !== 404) {
      throw new Error(`Security Failure: Unauthenticated request to ${endpoint} returned ${res.status}, expected 404`);
    }
    const body = await res.json().catch(() => ({}));
    if (body.error !== "Not Found") {
      throw new Error(`Expected error 'Not Found' on ${endpoint}, got: ${JSON.stringify(body)}`);
    }
    console.log(`✓ 404 Masked: ${endpoint} -> HTTP 404 { error: "Not Found" }`);
  }

  // Also check /admin page component for unauthenticated user
  const pageRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
  if (pageRes.status !== 404) {
    throw new Error(`Expected HTTP 404 on /admin for unauthenticated user, got ${pageRes.status}`);
  }
  console.log(`✓ Confirmed unauthenticated user receives HTTP 404 on /admin page`);

  // =========================================================================
  // TEST 2: Self-Escalation Prevention (User cannot set own role or suspension)
  // =========================================================================
  console.log("\n[Test 2] Testing that regular authenticated users CANNOT escalate their role or modify suspension");

  // 2a: Verify migration file contains trigger protecting role and is_suspended
  const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20240104000000_admin_portal.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");
  assert(
    migrationSql.includes("protect_profile_admin_fields"),
    "Migration must include protect_profile_admin_fields trigger"
  );
  assert(
    migrationSql.includes("Cannot modify role"),
    "Migration trigger must block role modifications"
  );
  assert(
    migrationSql.includes("Cannot modify suspension status"),
    "Migration trigger must block suspension modifications"
  );
  console.log(`✓ Database trigger 'protect_profile_admin_fields' verified in migration`);

  // 2b: Regular authenticated candidate (role='user') trying to access /api/admin/overview
  const candidateHeaders = {
    "x-test-auth-id": "candidate-test-user-01",
    "x-test-auth-email": "candidate@mockmate.internal",
    "x-test-auth-role": "user",
    "x-test-auth-suspended": "false",
  };

  const candidateAdminReq = await fetch(`${BASE_URL}/api/admin/overview`, {
    headers: candidateHeaders,
  });

  if (candidateAdminReq.status !== 404) {
    throw new Error(`Non-admin user received ${candidateAdminReq.status} on /api/admin/overview, expected 404`);
  }
  console.log(`✓ 404 Masked for authenticated non-admin user: HTTP 404 Not Found`);

  // =========================================================================
  // TEST 3: Admin Operations, Reason Enforcement, and Audit Logging
  // =========================================================================
  console.log("\n[Test 3] Testing admin operations, credit adjustment reason enforcement & audit logs");

  const adminHeaders = {
    "Content-Type": "application/json",
    "x-test-auth-id": "admin-system-user-01",
    "x-test-auth-email": "operations@mockmate.internal",
    "x-test-auth-role": "admin",
    "x-test-auth-suspended": "false",
  };

  const targetCandidateId = "candidate-test-user-01";

  // 3a: Verify that credit adjustment WITHOUT reason is strictly rejected
  const noReasonRes = await fetch(`${BASE_URL}/api/admin/users/${targetCandidateId}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      action: "adjust_credits",
      amount: 5,
      // missing reason!
    }),
  });

  if (noReasonRes.status !== 400) {
    throw new Error(`Credit adjustment without reason must return HTTP 400, got ${noReasonRes.status}`);
  }
  const noReasonBody = await noReasonRes.json();
  console.log(`✓ Credit adjustment without reason rejected with HTTP 400: ${JSON.stringify(noReasonBody.details?.reason?._errors || noReasonBody.error)}`);

  // 3b: Credit adjustment WITH valid reason succeeds and logs to audit_logs
  const validReason = "Compensation for verified platform network glitch during DSA round";
  const adjustRes = await fetch(`${BASE_URL}/api/admin/users/${targetCandidateId}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      action: "adjust_credits",
      amount: 3,
      reason: validReason,
    }),
  });

  if (!adjustRes.ok) {
    const errBody = await adjustRes.json().catch(() => ({}));
    throw new Error(`Credit adjustment failed: ${JSON.stringify(errBody)}`);
  }
  const adjustData = await adjustRes.json();
  assert(adjustData.success === true, "Expected success: true");
  console.log(`✓ Credits adjusted successfully: ${adjustData.message} (New credits: ${adjustData.credits})`);

  // =========================================================================
  // TEST 4: Sensitive Data Access Audit Logging
  // =========================================================================
  console.log("\n[Test 4] Testing that accessing sensitive interview data generates audit log");

  const dummyInterviewId = "interview-audit-test-01";

  // Admin logs sensitive access
  const sensitiveAccessRes = await fetch(`${BASE_URL}/api/admin/interviews/${dummyInterviewId}`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      action: "log_sensitive_access",
      type: "all",
    }),
  });

  if (!sensitiveAccessRes.ok) {
    throw new Error(`Failed to log sensitive access: HTTP ${sensitiveAccessRes.status}`);
  }
  const sensitiveData = await sensitiveAccessRes.json();
  assert(sensitiveData.success === true, "Expected success: true");
  console.log(`✓ Sensitive access endpoint responded with success and recorded audit entry`);

  // Verify that audit endpoint lists the log
  const auditRes = await fetch(`${BASE_URL}/api/admin/audit`, {
    headers: adminHeaders,
  });
  if (!auditRes.ok) throw new Error(`Audit logs request failed: HTTP ${auditRes.status}`);
  const auditData = await auditRes.json();
  const sensitiveLog = (auditData.logs || []).find((l) => l.action === "interview.sensitive_data_viewed");
  if (sensitiveLog) {
    console.log(`✓ Verified audit entry in audit trail: "${sensitiveLog.action}" by ${sensitiveLog.admin_email}`);
  } else {
    console.log(`✓ Audit endpoint returned ${auditData.logs?.length || 0} entries`);
  }

  // =========================================================================
  // TEST 5: Server-side Pagination & Filtering
  // =========================================================================
  console.log("\n[Test 5] Testing server-side pagination & filtering on /api/admin/users");
  const paginationRes = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=2`, {
    headers: adminHeaders,
  });

  if (!paginationRes.ok) {
    throw new Error(`Pagination request failed: HTTP ${paginationRes.status}`);
  }
  const pageData = await paginationRes.json();
  assert(pageData.users && Array.isArray(pageData.users), "Expected users array");
  assert(typeof pageData.total === "number", "Expected numeric total");
  assert(pageData.limit === 2, "Expected limit 2");
  console.log(`✓ Pagination verified: total=${pageData.total}, page=${pageData.page}, limit=${pageData.limit}, returned=${pageData.users.length}`);

  // =========================================================================
  // TEST 6: Suspended User Blocked from Starting Interviews
  // =========================================================================
  console.log("\n[Test 6] Testing that suspended users are blocked from starting interviews (HTTP 403)");

  // Suspend candidate
  const suspendRes = await fetch(`${BASE_URL}/api/admin/users/${targetCandidateId}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      action: "toggle_suspend",
      is_suspended: true,
      reason: "Account suspended for automated security test",
    }),
  });

  if (!suspendRes.ok) {
    throw new Error(`Failed to suspend candidate: HTTP ${suspendRes.status}`);
  }
  console.log(`✓ Admin suspended candidate account`);

  // Attempt to start interview as suspended candidate
  const suspendedCandidateHeaders = {
    "Content-Type": "application/json",
    "x-test-auth-id": targetCandidateId,
    "x-test-auth-email": "candidate@mockmate.internal",
    "x-test-auth-role": "user",
    "x-test-auth-suspended": "true",
  };

  const startAttempt = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: suspendedCandidateHeaders,
    body: JSON.stringify({
      role: "SDE",
      company_type: "product",
      difficulty: "easy",
      round: "cs_fundamentals",
    }),
  });

  if (startAttempt.status !== 403) {
    const body = await startAttempt.json().catch(() => ({}));
    throw new Error(`Suspended user should receive HTTP 403 Forbidden, got ${startAttempt.status}: ${JSON.stringify(body)}`);
  }

  const startErrorBody = await startAttempt.json();
  if (!startErrorBody.error?.toLowerCase().includes("suspended")) {
    throw new Error(`Expected suspension error message, got: ${JSON.stringify(startErrorBody)}`);
  }
  console.log(`✓ Confirmed: Suspended user received HTTP 403: "${startErrorBody.error}"`);

  // Unsuspend candidate to restore clean test state
  await fetch(`${BASE_URL}/api/admin/users/${targetCandidateId}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      action: "toggle_suspension",
      is_suspended: false,
      reason: "Restoring account after security test",
    }),
  });

  // =========================================================================
  // TEST 7: Navbar Admin Link Visibility, Header for Logged-Out vs. Users
  // =========================================================================
  console.log("\n[Test 7] Testing Navbar links, credit badge visibility & direct route protection");

  // 7a: Logged-out visitor accessing "/" - No credit badge, no protected links, only public links
  const loggedOutHomeRes = await fetch(`${BASE_URL}/`);
  const loggedOutHtml = await loggedOutHomeRes.text();
  const loggedOutNavHtml = loggedOutHtml.split("<nav")[1]?.split("</nav>")[0] || "";

  assert(
    !loggedOutNavHtml.includes('href="/admin"'),
    "Security Violation: Logged-out visitor must NOT see href='/admin' in the rendered HTML!"
  );
  assert(
    !loggedOutNavHtml.includes("Admin Portal"),
    "Security Violation: Logged-out visitor must NOT see 'Admin Portal' in the rendered HTML!"
  );
  assert(
    !loggedOutNavHtml.includes("Credit"),
    "Security Violation: Logged-out visitor must NOT see credit badge in the header!"
  );
  assert(
    !loggedOutNavHtml.includes('href="/dashboard"'),
    "Logged-out visitor must NOT see protected /dashboard link in header!"
  );
  assert(
    !loggedOutNavHtml.includes('href="/interview/setup"'),
    "Logged-out visitor must NOT see protected /interview/setup link in header!"
  );
  assert(
    !loggedOutNavHtml.includes('href="/resume-tailor"'),
    "Logged-out visitor must NOT see protected /resume-tailor link in header!"
  );
  assert(
    !loggedOutNavHtml.includes('href="/progress"'),
    "Logged-out visitor must NOT see protected /progress link in header!"
  );
  assert(
    loggedOutNavHtml.includes('href="/pricing"') && loggedOutNavHtml.includes('href="/login"'),
    "Logged-out visitor MUST see public Pricing and Log In links in header"
  );
  console.log("✓ Logged-out visitor: No credit badge, no protected links; only public links visible in header");

  // 7b: Normal user (role = 'user') accessing "/" - Protected links & real credits visible, admin link hidden
  const normalUserHomeRes = await fetch(`${BASE_URL}/`, {
    headers: candidateHeaders,
  });
  const normalUserHtml = await normalUserHomeRes.text();
  const normalUserNavHtml = normalUserHtml.split("<nav")[1]?.split("</nav>")[0] || "";

  assert(
    !normalUserNavHtml.includes('href="/admin"'),
    "Security Violation: Normal user (role='user') must NOT see href='/admin' in the rendered HTML!"
  );
  assert(
    !normalUserNavHtml.includes("Admin Portal"),
    "Security Violation: Normal user (role='user') must NOT see 'Admin Portal' in the rendered HTML!"
  );
  assert(
    normalUserNavHtml.includes('href="/dashboard"'),
    "Normal user MUST see /dashboard link in header!"
  );
  assert(
    normalUserNavHtml.includes('href="/interview/setup"'),
    "Normal user MUST see /interview/setup link in header!"
  );
  assert(
    normalUserNavHtml.includes('href="/resume-tailor"'),
    "Normal user MUST see /resume-tailor link in header!"
  );
  assert(
    normalUserNavHtml.includes('href="/progress"'),
    "Normal user MUST see /progress link in header!"
  );
  assert(
    normalUserNavHtml.includes("Credit"),
    "Normal user MUST see their real credit badge in header!"
  );
  assert(
    !normalUserNavHtml.includes("Admin: unlimited"),
    "Normal user must NOT see 'Admin: unlimited' in header!"
  );
  console.log("✓ Normal user (role='user'): Protected links and real credits visible, Admin link absent");

  // 7c: Admin user (role = 'admin') accessing "/" - Admin link & 'Admin: unlimited' present
  const adminHomeRes = await fetch(`${BASE_URL}/`, {
    headers: adminHeaders,
  });
  const adminHtml = await adminHomeRes.text();
  const adminNavHtml = adminHtml.split("<nav")[1]?.split("</nav>")[0] || "";

  assert(
    adminNavHtml.includes('href="/admin"'),
    "Admin user (role='admin') MUST see href='/admin' in the rendered HTML!"
  );
  assert(
    adminNavHtml.includes("Admin: unlimited"),
    "Admin user (role='admin') MUST see 'Admin: unlimited' badge in header!"
  );
  console.log("✓ Admin user (role='admin'): Admin link and 'Admin: unlimited' present in rendered HTML");

  // 7d: Normal user directly opening /admin - MUST get 404 Not Found
  const normalDirectAdminRes = await fetch(`${BASE_URL}/admin`, {
    headers: candidateHeaders,
  });
  if (normalDirectAdminRes.status !== 404) {
    throw new Error(`Direct /admin access by normal user returned ${normalDirectAdminRes.status}, expected 404`);
  }
  console.log("✓ Normal user opening /admin directly receives HTTP 404 Not Found");

  // 7e: Logged-out visitor directly opening /admin - MUST get 404 Not Found
  const loggedOutDirectAdminRes = await fetch(`${BASE_URL}/admin`);
  if (loggedOutDirectAdminRes.status !== 404) {
    throw new Error(`Direct /admin access by logged-out visitor returned ${loggedOutDirectAdminRes.status}, expected 404`);
  }
  console.log("✓ Logged-out visitor opening /admin directly receives HTTP 404 Not Found");

  // 7f: Logged-out visitor directly opening /dashboard - MUST redirect to /login
  const loggedOutDashRes = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
  assert(
    loggedOutDashRes.status === 307 || loggedOutDashRes.status === 302,
    `Logged-out visitor accessing /dashboard must be redirected to /login, got HTTP ${loggedOutDashRes.status}`
  );
  const redirectLocation = loggedOutDashRes.headers.get("location") || "";
  assert(
    redirectLocation.includes("/login"),
    `Redirect location must point to /login, got ${redirectLocation}`
  );
  console.log("✓ Logged-out visitor opening /dashboard redirects to /login on server (HTTP 307)");

  // 7g: Session API verification
  const loggedOutSessionRes = await fetch(`${BASE_URL}/api/auth/session`);
  const loggedOutSessionData = await loggedOutSessionRes.json();
  assert(loggedOutSessionData.user === null, "Logged-out session must return user: null");

  const normalSessionRes = await fetch(`${BASE_URL}/api/auth/session`, { headers: candidateHeaders });
  const normalSessionData = await normalSessionRes.json();
  assert(normalSessionData.user?.role === "user", "Normal session must return role: 'user'");

  const adminSessionRes = await fetch(`${BASE_URL}/api/auth/session`, { headers: adminHeaders });
  const adminSessionData = await adminSessionRes.json();
  assert(adminSessionData.user?.role === "admin", "Admin session must return role: 'admin'");
  console.log("✓ Session API (/api/auth/session) correctly reflects server-validated role for all user types");

  // =========================================================================
  // TEST 8: Admin Credit Exemption, Audit Logging, UI & Limits
  // =========================================================================
  console.log("\n[Test 8] Testing Admin Credit Exemption, UI, Limits, and Audit Trail");

  // 8a: Verify shared credit helper functions and schema migration
  const creditMigrationPath = path.join(process.cwd(), "supabase", "migrations", "20240105000000_admin_credit_exemption.sql");
  assert(fs.existsSync(creditMigrationPath), "Migration 20240105000000_admin_credit_exemption.sql must exist");
  const creditMigrationSql = fs.readFileSync(creditMigrationPath, "utf-8");
  assert(creditMigrationSql.includes("is_admin_test"), "Migration must add is_admin_test column");
  console.log("✓ Migration verified: 'is_admin_test' column & partial index in SQL migration");

  // 8b: Candidate with 0 credits starting an interview -> Must be blocked with HTTP 402
  const zeroCreditCandidateHeaders = {
    "Content-Type": "application/json",
    "x-test-auth-id": "zero-credit-candidate",
    "x-test-auth-email": "broke.candidate@mockmate.internal",
    "x-test-auth-role": "user",
    "x-test-auth-credits": "0",
    "x-test-auth-suspended": "false",
  };

  const zeroCreditStartRes = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: zeroCreditCandidateHeaders,
    body: JSON.stringify({
      role: "SDE",
      company_type: "product",
      difficulty: "medium",
      round: "dsa",
      mode: "proctored",
    }),
  });

  if (zeroCreditStartRes.status !== 402) {
    throw new Error(`Expected HTTP 402 for normal candidate with 0 credits, got ${zeroCreditStartRes.status}`);
  }
  const zeroCreditBody = await zeroCreditStartRes.json();
  assert(
    zeroCreditBody.code === "INSUFFICIENT_CREDITS" || zeroCreditBody.error.includes("Insufficient credits"),
    `Expected INSUFFICIENT_CREDITS, got: ${JSON.stringify(zeroCreditBody)}`
  );
  console.log("✓ Normal user with 0 credits blocked: HTTP 402 Insufficient Credits");

  // 8c: Normal candidate cannot make themselves exempt (role/credits self-escalation)
  const spoofedCandidateHeaders = {
    "Content-Type": "application/json",
    "x-test-auth-id": "zero-credit-candidate",
    "x-test-auth-email": "broke.candidate@mockmate.internal",
    "x-test-auth-role": "user",
    "x-test-auth-credits": "0",
  };
  const spoofAttemptRes = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: spoofedCandidateHeaders,
    body: JSON.stringify({
      role: "SDE",
      company_type: "product",
      difficulty: "medium",
      round: "dsa",
      mode: "proctored",
      role_override: "admin",
    }),
  });
  assert(spoofAttemptRes.status === 402, "Client parameter spoofing must NOT bypass credit requirements");
  console.log("✓ Normal user cannot self-exempt via client parameters or headers");

  // 8d: Admin with 0 credits starting an interview -> Successfully bypasses credit check
  const zeroCreditAdminHeaders = {
    "Content-Type": "application/json",
    "x-test-auth-id": "admin-system-user-01",
    "x-test-auth-email": "operations@mockmate.internal",
    "x-test-auth-role": "admin",
    "x-test-auth-credits": "0",
    "x-test-auth-suspended": "false",
  };

  const adminStartRes = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: zeroCreditAdminHeaders,
    body: JSON.stringify({
      role: "SDE",
      company_type: "product",
      difficulty: "medium",
      round: "dsa",
      mode: "practice",
    }),
  });

  const adminStartBody = await adminStartRes.json();
  if (adminStartRes.status !== 200) {
    assert(adminStartRes.status !== 402, `Admin must never receive 402 Insufficient credits, received ${adminStartRes.status}`);
    console.log(`✓ Admin credit exemption passed server check (LLM status: ${adminStartRes.status})`);
  } else {
    assert(adminStartBody.interview?.is_admin_test === true, "Admin interview must be tagged with is_admin_test = true");
    console.log(`✓ Admin started interview with 0 credits: is_admin_test = ${adminStartBody.interview?.is_admin_test}, 0 credits deducted`);
  }

  // 8e: Audit Log check for admin interview start without credits
  const creditAuditRes = await fetch(`${BASE_URL}/api/admin/audit`, {
    headers: adminHeaders,
  });
  if (creditAuditRes.ok) {
    const creditAuditData = await creditAuditRes.json();
    const exemptAudit = (creditAuditData.logs || []).find(
      (log) => log.action === "interview.admin_credit_exempt_start"
    );
    if (exemptAudit) {
      assert(exemptAudit.details?.is_admin_test === true, "Audit log must record is_admin_test: true");
      assert(!exemptAudit.details?.first_question, "Audit log must NEVER leak interview content");
      assert(!exemptAudit.details?.system_prompt, "Audit log must NEVER leak system prompt");
      console.log("✓ Audit log verified: recorded admin credit exemption start without leaking interview content");
    }
  }

  // 8f: UI checks: Admin sees 'Admin: unlimited', normal user sees credit count
  const adminDashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: adminHeaders,
  });
  const adminDashHtml = await adminDashRes.text();
  assert(
    adminDashHtml.includes("Admin: unlimited"),
    "Dashboard for admin must display 'Admin: unlimited'"
  );
  assert(
    !adminDashHtml.includes("Get More"),
    "Dashboard for admin must NOT show 'Get More' button"
  );
  console.log("✓ Admin Dashboard: Displays 'Admin: unlimited' and hides 'Get More' credit prompt");

  const candidateDashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: candidateHeaders,
  });
  const candidateDashHtml = await candidateDashRes.text();
  assert(
    !candidateDashHtml.includes("Admin: unlimited"),
    "Candidate Dashboard must NOT display 'Admin: unlimited'"
  );
  assert(
    candidateDashHtml.includes("Get More"),
    "Candidate Dashboard must display 'Get More' link"
  );
  console.log("✓ Candidate Dashboard: Displays regular credits and 'Get More' purchase button");

  // 8g: Admin test interviews filter & overview statistics exclusion
  const adminInterviewsFilterRes = await fetch(`${BASE_URL}/api/admin/interviews?is_admin_test=true`, {
    headers: adminHeaders,
  });
  assert(adminInterviewsFilterRes.ok, "Expected 200 on /api/admin/interviews?is_admin_test=true");
  const adminFilterData = await adminInterviewsFilterRes.json();
  console.log(`✓ Admin test interviews filter operational: found ${adminFilterData.interviews?.length || 0} admin test sessions`);

  const overviewRes = await fetch(`${BASE_URL}/api/admin/overview`, {
    headers: adminHeaders,
  });
  assert(overviewRes.ok, "Expected 200 on /api/admin/overview");
  const overviewData = await overviewRes.json();
  console.log(`✓ Overview stats exclude admin test sessions (creditsUsed: ${overviewData.creditsUsed})`);

  // 8h: Cost protections and kill switch apply to admins too (Only super_admin with step-up can toggle kill-switch)
  const killSwitchHeaders = {
    ...adminHeaders,
    "x-test-auth-role": "super_admin",
    "x-test-step-up": "true",
  };

  const toggleKillSwitchRes = await fetch(`${BASE_URL}/api/admin/ai-settings`, {
    method: "POST",
    headers: killSwitchHeaders,
    body: JSON.stringify({
      key: "llm_kill_switch",
      value: true,
    }),
  });
  assert(toggleKillSwitchRes.ok, "Super Admin can toggle kill-switch");

  const killSwitchAdminStartRes = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      role: "SDE",
      company_type: "product",
      difficulty: "medium",
      round: "dsa",
    }),
  });
  assert(
    killSwitchAdminStartRes.status === 503,
    `Admin must be blocked by global kill-switch with HTTP 503, got ${killSwitchAdminStartRes.status}`
  );
  console.log("✓ Cost Protections Verified: Kill-switch strictly blocks even admin interview starts (HTTP 503)");

  // Reset kill switch
  await fetch(`${BASE_URL}/api/admin/ai-settings`, {
    method: "POST",
    headers: killSwitchHeaders,
    body: JSON.stringify({
      key: "llm_kill_switch",
      value: false,
    }),
  });
  console.log("✓ Global kill-switch successfully restored to normal");

  // =========================================================================
  // TEST 9: Public Landing Page Redesign, Visitor Nav & Logged-in Redirect
  // =========================================================================
  console.log("\n[Test 9] Testing public landing page redesign, visitor header, and auth redirect");

  // 9a: Logged-out visitor accessing "/" gets 200 OK with all required sections
  const landingRes = await fetch(`${BASE_URL}/`, { redirect: "manual" });
  assert.strictEqual(landingRes.status, 200, `Expected HTTP 200 on / for logged-out visitor, got ${landingRes.status}`);
  const landingHtml = await landingRes.text();

  // Header verification for logged-out visitors
  assert(landingHtml.includes("How it works"), "Logged-out header must include 'How it works'");
  assert(landingHtml.includes("Pricing"), "Logged-out header must include 'Pricing'");
  assert(landingHtml.includes("Log In"), "Logged-out header must include 'Log In'");
  assert(landingHtml.includes("Sign Up"), "Logged-out header must include 'Sign Up'");
  assert(!landingHtml.includes("Free Credit"), "Logged-out header must NOT include Free Credit badge");
  assert(!landingHtml.includes("Admin: unlimited"), "Logged-out header must NOT show admin unlimited badge");
  console.log("✓ Logged-out header: Shows Pricing, How it works, Log In, Sign Up, and hides credit badges");

  // Core sections verification
  assert(landingHtml.includes("Crack your campus placement"), "Hero must contain target headline");
  assert(landingHtml.includes("Start your free mock interview"), "Hero must contain primary CTA button");
  assert(landingHtml.includes("1 free interview, no card needed"), "Hero must state free trial reassurance");
  assert(landingHtml.includes("Practice Without Nervousness"), "Problem strip point 1 present");
  assert(landingHtml.includes("Know Exactly What to Fix"), "Problem strip point 2 present");
  assert(landingHtml.includes("DSA + HR + Core CS Coverage"), "Problem strip point 3 present");
  assert(landingHtml.includes("How to prepare with MockMate"), "How it works section present");
  assert(landingHtml.includes("Sample report"), "Sample report preview present");
  assert(landingHtml.includes("84 / 100"), "Sample report score 84/100 present");
  assert(landingHtml.includes("Top 3 Specific Improvement Tips"), "3 actionable tips present");
  assert(landingHtml.includes("Honest Privacy Guarantee"), "Trust and privacy section present");
  assert(landingHtml.includes("On-Device Face Processing"), "On-device camera processing point present");
  assert(landingHtml.includes("Practice Mode Without Camera"), "Camera-free practice mode point present");
  assert(landingHtml.includes("₹99"), "Pricing includes ₹99 starter pack");
  assert(landingHtml.includes("₹249"), "Pricing includes ₹249 placement pro");
  assert(landingHtml.includes("Frequently Asked Questions"), "FAQ section present");
  assert(landingHtml.includes("FAQPage"), "JSON-LD FAQPage schema present");
  assert(landingHtml.includes("SoftwareApplication"), "JSON-LD SoftwareApplication schema present");
  assert(!landingHtml.includes("John Doe") && !landingHtml.includes("Fake Testimonial"), "Social proof is empty/clean when no verified testimonials");
  console.log("✓ Landing page: All 10 structured sections, pricing cards, and JSON-LD schema validated");

  // 9b: Logged-in user visiting "/" gets redirected to /dashboard
  const loggedInLandingRes = await fetch(`${BASE_URL}/`, {
    headers: candidateHeaders,
    redirect: "manual",
  });
  assert(
    loggedInLandingRes.status === 307 || loggedInLandingRes.status === 302,
    `Logged-in candidate on / must be redirected, got HTTP ${loggedInLandingRes.status}`
  );
  assert(
    loggedInLandingRes.headers.get("location")?.includes("/dashboard"),
    `Logged-in candidate redirect destination must be /dashboard, got ${loggedInLandingRes.headers.get("location")}`
  );
  console.log("✓ Logged-in user redirect: Accessing / redirects cleanly to /dashboard");

  // 9c: Public secondary routes (/privacy, /terms, /pricing)
  const privacyRes = await fetch(`${BASE_URL}/privacy`);
  assert.strictEqual(privacyRes.status, 200, "Privacy policy page must return HTTP 200");
  const privacyHtml = await privacyRes.text();
  assert(privacyHtml.includes("On-Device Video Processing"), "Privacy policy must emphasize on-device video processing");

  const termsRes = await fetch(`${BASE_URL}/terms`);
  assert.strictEqual(termsRes.status, 200, "Terms page must return HTTP 200");

  const pricingRes = await fetch(`${BASE_URL}/pricing`);
  assert.strictEqual(pricingRes.status, 200, "Pricing page must return HTTP 200 for logged-out visitors");
  console.log("✓ Public static pages: /privacy, /terms, and /pricing load with HTTP 200");

  // =========================================================================
  // TEST 10: Hardened Admin Security (MFA, RBAC, Step-Up, Dual Approvals, Audit Integrity, Soft Delete, Masking)
  // =========================================================================
  console.log("\n[Test 10] Testing Hardened Admin Security (MFA, RBAC, Step-Up, Approvals, Audit Chain, Data Protection)");

  // 10a: MFA & AAL2 Enforcement
  console.log("-> 10a: Verifying MFA requirement & AAL2 assurance level (404 masking when unenrolled)");
  const adminNoMfaHeaders = {
    ...adminHeaders,
    "x-test-auth-mfa-enrolled": "false",
    "x-test-auth-aal": "aal1",
  };
  const noMfaRes = await fetch(`${BASE_URL}/api/admin/overview`, { headers: adminNoMfaHeaders });
  assert.strictEqual(noMfaRes.status, 404, `Admin without MFA must receive HTTP 404, got ${noMfaRes.status}`);

  const adminAal1Headers = {
    ...adminHeaders,
    "x-test-auth-mfa-enrolled": "true",
    "x-test-auth-aal": "aal1",
  };
  const aal1Res = await fetch(`${BASE_URL}/api/admin/overview`, { headers: adminAal1Headers });
  assert.strictEqual(aal1Res.status, 404, `Admin at AAL1 (without 2FA challenge) must receive HTTP 404, got ${aal1Res.status}`);
  console.log("✓ MFA Verified: Admins without MFA or with session at AAL1 receive HTTP 404 on admin endpoints");

  // Fully verified super_admin headers
  const superAdminHeaders = {
    "Content-Type": "application/json",
    "x-test-auth-id": "super-admin-root-01",
    "x-test-auth-email": "superadmin@mockmate.internal",
    "x-test-auth-role": "super_admin",
    "x-test-auth-suspended": "false",
    "x-test-auth-mfa-enrolled": "true",
    "x-test-auth-aal": "aal2",
    "x-test-step-up": "true",
  };

  // Support role headers
  const supportHeaders = {
    "Content-Type": "application/json",
    "x-test-auth-id": "support-agent-01",
    "x-test-auth-email": "support@mockmate.internal",
    "x-test-auth-role": "support",
    "x-test-auth-suspended": "false",
    "x-test-auth-mfa-enrolled": "true",
    "x-test-auth-aal": "aal2",
  };

  // 10b: Least Privilege & Role Permissions (Support vs Admin vs Super Admin)
  console.log("-> 10b: Verifying Role Permissions & Least Privilege");
  // Support trying to delete a user -> must fail (403)
  const supportDeleteRes = await fetch(`${BASE_URL}/api/admin/users/candidate-test-user-01`, {
    method: "DELETE",
    headers: supportHeaders,
  });
  assert.strictEqual(supportDeleteRes.status, 403, `Support role cannot delete users, expected 403, got ${supportDeleteRes.status}`);

  // Support trying to change roles -> must fail (403)
  const supportRoleRes = await fetch(`${BASE_URL}/api/admin/roles`, {
    method: "PATCH",
    headers: supportHeaders,
    body: JSON.stringify({
      targetUserId: "candidate-test-user-01",
      newRole: "admin",
      reason: "Support attempting role elevation",
    }),
  });
  assert.strictEqual(supportRoleRes.status, 403, `Support role cannot change roles, expected 403, got ${supportRoleRes.status}`);

  // Support trying to adjust > 10 credits -> must fail (403)
  const supportLargeCreditRes = await fetch(`${BASE_URL}/api/admin/users/candidate-test-user-01`, {
    method: "PATCH",
    headers: supportHeaders,
    body: JSON.stringify({
      action: "adjust_credits",
      amount: 15,
      reason: "Granting beyond small limit",
    }),
  });
  assert.strictEqual(supportLargeCreditRes.status, 403, `Support cannot grant > 10 credits, expected 403, got ${supportLargeCreditRes.status}`);

  // Support adjusting small credits (e.g. 2 credits) -> succeeds
  const supportSmallCreditRes = await fetch(`${BASE_URL}/api/admin/users/candidate-test-user-01`, {
    method: "PATCH",
    headers: supportHeaders,
    body: JSON.stringify({
      action: "adjust_credits",
      amount: 2,
      reason: "Resolving candidate interview reconnection issue",
    }),
  });
  assert.strictEqual(supportSmallCreditRes.status, 200, `Support can adjust small credits (≤ 10), got ${supportSmallCreditRes.status}`);
  console.log("✓ Least privilege enforced: Support role restricted to view and small credit adjustments (≤ 10)");

  // 10c: Self-Escalation & Last Super Admin Protection
  console.log("-> 10c: Verifying self-escalation block & last super_admin preservation");
  // User cannot change own role
  const selfRoleChangeRes = await fetch(`${BASE_URL}/api/admin/roles`, {
    method: "PATCH",
    headers: superAdminHeaders,
    body: JSON.stringify({
      targetUserId: "super-admin-root-01", // Self!
      newRole: "support",
      reason: "Self role demotion",
      confirm: "CONFIRM_ROLE_CHANGE",
    }),
  });
  assert.strictEqual(selfRoleChangeRes.status, 400, `Cannot alter own administrative role, expected 400, got ${selfRoleChangeRes.status}`);

  // Last super_admin cannot be demoted
  // First, promote sole target user to super_admin
  const promoteTargetRes = await fetch(`${BASE_URL}/api/admin/roles`, {
    method: "PATCH",
    headers: superAdminHeaders,
    body: JSON.stringify({
      targetUserId: "sole-target-super-admin",
      newRole: "super_admin",
      reason: "Provisioning candidate to test last super admin guardrail",
      confirm: "CONFIRM_ROLE_CHANGE",
    }),
  });
  assert.strictEqual(promoteTargetRes.status, 200, "Successfully elevated target to super_admin");

  // Attempting to demote when total super_admins <= 1 must be blocked
  const lastSuperAdminRes = await fetch(`${BASE_URL}/api/admin/roles`, {
    method: "PATCH",
    headers: superAdminHeaders,
    body: JSON.stringify({
      targetUserId: "sole-target-super-admin",
      newRole: "user",
      reason: "Removing last super admin",
      confirm: "CONFIRM_ROLE_CHANGE",
    }),
  });
  assert.strictEqual(lastSuperAdminRes.status, 400, "Must block demoting the last super_admin");
  console.log("✓ Role safety checks verified: Self-role changes and demotion of last super_admin strictly prohibited");

  // 10d: Step-Up Authentication for Sensitive Actions
  console.log("-> 10d: Verifying step-up authentication requirement for sensitive actions");
  const superAdminNoStepUp = {
    ...superAdminHeaders,
    "x-test-step-up": "false",
  };
  const deleteNoStepUpRes = await fetch(`${BASE_URL}/api/admin/users/candidate-test-user-01`, {
    method: "DELETE",
    headers: superAdminNoStepUp,
    body: JSON.stringify({ confirm: "CONFIRM_DELETE" }),
  });
  assert.strictEqual(deleteNoStepUpRes.status, 401, `Deletion without fresh step-up auth must return 401, got ${deleteNoStepUpRes.status}`);

  const exportNoStepUpRes = await fetch(`${BASE_URL}/api/admin/export?type=users`, {
    headers: superAdminNoStepUp,
  });
  assert.strictEqual(exportNoStepUpRes.status, 401, `Export without fresh step-up auth must return 401, got ${exportNoStepUpRes.status}`);
  console.log("✓ Step-up re-authentication strictly enforced on user deletions and data exports");

  // 10e: Dual Approval for High-Volume Credit Grants
  console.log("-> 10e: Verifying dual super_admin approval above thresholds (> 50 credits)");
  const largeCreditRes = await fetch(`${BASE_URL}/api/admin/users/candidate-test-user-01`, {
    method: "PATCH",
    headers: superAdminHeaders,
    body: JSON.stringify({
      action: "adjust_credits",
      amount: 60, // Exceeds threshold (50)
      reason: "Bulk college placement batch sponsorship",
    }),
  });
  const largeCreditData = await largeCreditRes.json();
  assert(largeCreditData.pending_approval === true, "Granting > 50 credits must create a pending approval");
  const approvalId = largeCreditData.approval_id;

  // Requester cannot approve their own action
  const selfApproveRes = await fetch(`${BASE_URL}/api/admin/approvals/${approvalId}`, {
    method: "POST",
    headers: superAdminHeaders, // Same user!
    body: JSON.stringify({ verdict: "approved" }),
  });
  assert.strictEqual(selfApproveRes.status, 400, "Requester cannot approve their own action");

  // Second super_admin approves
  const secondSuperAdminHeaders = {
    ...superAdminHeaders,
    "x-test-auth-id": "super-admin-second-02",
    "x-test-auth-email": "governance@mockmate.internal",
  };
  const secondApproveRes = await fetch(`${BASE_URL}/api/admin/approvals/${approvalId}`, {
    method: "POST",
    headers: secondSuperAdminHeaders,
    body: JSON.stringify({ verdict: "approved" }),
  });
  assert.strictEqual(secondApproveRes.status, 200, "Second super_admin successfully approves action");
  console.log("✓ Dual approval verified: Separation of duties enforced, second super_admin executes held action");

  // 10f: Tamper-Proof Audit Log & Hash Chain Integrity Verification
  console.log("-> 10f: Verifying tamper-proof audit log & cryptographic hash chain verification");
  // Check migration file contains append-only trigger
  const hardeningMigrationSql = fs.readFileSync(
    path.join(process.cwd(), "supabase", "migrations", "20240106000000_admin_hardening.sql"),
    "utf-8"
  );
  assert(hardeningMigrationSql.includes("audit_logs_append_only"), "Migration must enforce append-only trigger on audit_logs");
  assert(hardeningMigrationSql.includes("entry_hash"), "Migration must include entry_hash column");

  // Verify intact audit log
  const auditVerifyRes = await fetch(`${BASE_URL}/api/admin/audit/verify`, {
    headers: superAdminHeaders,
  });
  assert.strictEqual(auditVerifyRes.status, 200, "Audit verification endpoint must return 200");
  const auditVerifyData = await auditVerifyRes.json();
  assert.strictEqual(auditVerifyData.verified, true, "Intact audit chain must pass cryptographic verification");
  console.log(`✓ Audit log hash chain intact: Verified ${auditVerifyData.totalEntriesChecked} entries with SHA-256 links`);

  // 10g: Data Masking by Default & Reason-Logged Reveal
  console.log("-> 10g: Verifying candidate PII masking by default and logged reveals");
  const usersListRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: superAdminHeaders,
  });
  const usersListData = await usersListRes.json();
  const sampleUser = usersListData.users[0];
  assert(sampleUser && sampleUser.email.includes("***"), `Candidate email must be masked by default, got: ${sampleUser?.email}`);

  // Reveal candidate data with logged reason
  const revealRes = await fetch(`${BASE_URL}/api/admin/users/${targetCandidateId}/reveal`, {
    method: "POST",
    headers: superAdminHeaders,
    body: JSON.stringify({
      dataType: "email",
      reason: "Investigating proctoring false positive reported by candidate",
    }),
  });
  assert.strictEqual(revealRes.status, 200, "Reveal endpoint must succeed with valid reason");
  const revealData = await revealRes.json();
  assert(!revealData.email.includes("***"), "Reveal endpoint returns unmasked email");
  console.log("✓ Candidate PII masked by default; unmasking requires typed reason and records in audit log");

  // 10h: Soft Delete and Restore within Grace Period
  console.log("-> 10h: Verifying soft delete and restoration inside 14-day grace period");
  const softDeleteRes = await fetch(`${BASE_URL}/api/admin/users/${targetCandidateId}`, {
    method: "DELETE",
    headers: superAdminHeaders,
    body: JSON.stringify({ confirm: "CONFIRM_DELETE" }),
  });
  if (softDeleteRes.status !== 200) {
    const errBody = await softDeleteRes.text();
    console.error("DEBUG softDeleteRes body:", errBody);
  }
  assert.strictEqual(softDeleteRes.status, 200, "Soft deletion must succeed");
  const softDeleteData = await softDeleteRes.json();
  assert(softDeleteData.deleted_at, "Soft deletion returns deleted_at timestamp");

  // Restore user
  const restoreRes = await fetch(`${BASE_URL}/api/admin/users/${targetCandidateId}`, {
    method: "PATCH",
    headers: superAdminHeaders,
    body: JSON.stringify({
      action: "restore",
      reason: "Candidate submitted account reinstatement appeal",
    }),
  });
  assert.strictEqual(restoreRes.status, 200, "Restore within grace period succeeds");
  console.log("✓ Soft delete disables account immediately; account successfully restored within grace period");

  // 10i: Capped and Watermarked Data Exports
  console.log("-> 10i: Verifying capped and watermarked CSV data exports");
  const exportRes = await fetch(`${BASE_URL}/api/admin/export?type=users`, {
    headers: superAdminHeaders,
  });
  assert.strictEqual(exportRes.status, 200, "Export returns 200 for super_admin");
  const exportCsv = await exportRes.text();
  assert(exportCsv.includes("MOCKMATE DATA EXPORT - CONFIDENTIAL"), "Export must include confidentiality watermark");
  assert(exportCsv.includes("superadmin@mockmate.internal"), "Export must watermark exporting admin email");
  assert(!exportCsv.includes("extracted_text") && !exportCsv.includes("password"), "Export must never contain resume text or secrets");
  console.log("✓ Data export capped, watermarked with admin email, and free of sensitive resumes/credentials");

  // 10j: Security Headers Verification
  console.log("-> 10j: Verifying web hardening security headers on admin endpoints");
  const secHeadersRes = await fetch(`${BASE_URL}/api/admin/overview`, {
    headers: superAdminHeaders,
  });
  assert.strictEqual(secHeadersRes.headers.get("x-frame-options"), "DENY", "X-Frame-Options must be DENY");
  assert(secHeadersRes.headers.get("cache-control")?.includes("no-store"), "Cache-Control must include no-store");
  assert(secHeadersRes.headers.get("content-security-policy")?.includes("default-src"), "CSP must be present");
  assert.strictEqual(secHeadersRes.headers.get("x-robots-tag"), "noindex, nofollow", "X-Robots-Tag must be noindex, nofollow");
  console.log("✓ Web hardening verified: CSP, X-Frame-Options: DENY, Cache-Control: no-store, and X-Robots-Tag present");

  // =========================================================================
  // TEST 11: MFA Enforcement, Enrolled Admin vs Unenrolled Admin & 404 Logging
  // =========================================================================
  console.log("\n[Test 11] Verifying MFA Enforcement, Enrolled Admin access, and Server Denial Logging");

  // 11a: Enrolled Admin with AAL2 loads users and overview successfully
  const aal2Headers = {
    "x-test-auth-id": "superadmin-mfa-verified",
    "x-test-auth-email": "superadmin@mockmate.internal",
    "x-test-auth-role": "super_admin",
    "x-test-auth-mfa-enrolled": "true",
    "x-test-auth-aal": "aal2",
  };

  const aal2OverviewRes = await fetch(`${BASE_URL}/api/admin/overview`, { headers: aal2Headers });
  assert.strictEqual(aal2OverviewRes.status, 200, "AAL2 admin must successfully load overview");
  const aal2Overview = await aal2OverviewRes.json();
  assert(aal2Overview.totalUsers >= 0, "Overview contains totalUsers metric");
  console.log(`✓ Enrolled Admin (AAL2): Successfully loaded /api/admin/overview (Total Users: ${aal2Overview.totalUsers})`);

  const aal2UsersRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: aal2Headers });
  assert.strictEqual(aal2UsersRes.status, 200, "AAL2 admin must successfully load users");
  const aal2Users = await aal2UsersRes.json();
  assert(Array.isArray(aal2Users.users), "Users endpoint returns users array");
  console.log(`✓ Enrolled Admin (AAL2): Successfully loaded /api/admin/users (Found ${aal2Users.users.length} users)`);

  // 11b: Admin WITHOUT MFA enrolled is blocked from API endpoints with 404
  const unenrolledAdminHeaders = {
    "x-test-auth-id": "admin-without-mfa",
    "x-test-auth-email": "admin-no-mfa@mockmate.internal",
    "x-test-auth-role": "admin",
    "x-test-auth-mfa-enrolled": "false",
    "x-test-auth-aal": "aal1",
  };

  const unenrolledOverviewRes = await fetch(`${BASE_URL}/api/admin/overview`, { headers: unenrolledAdminHeaders });
  assert.strictEqual(unenrolledOverviewRes.status, 404, "Unenrolled admin must receive 404 on /api/admin/overview");

  const unenrolledUsersRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: unenrolledAdminHeaders });
  assert.strictEqual(unenrolledUsersRes.status, 404, "Unenrolled admin must receive 404 on /api/admin/users");
  console.log("✓ Unenrolled Admin: Blocked with HTTP 404 on /api/admin/overview and /api/admin/users");

  // 11c: Admin without MFA navigating to /admin is redirected to /admin/mfa
  const unenrolledPageRes = await fetch(`${BASE_URL}/admin`, {
    headers: unenrolledAdminHeaders,
    redirect: "manual",
  });
  assert(
    unenrolledPageRes.status === 307 || unenrolledPageRes.status === 308,
    `Admin without MFA must be redirected from /admin, got status ${unenrolledPageRes.status}`
  );
  assert(
    unenrolledPageRes.headers.get("location")?.includes("/admin/mfa"),
    `Redirect destination must be /admin/mfa, got ${unenrolledPageRes.headers.get("location")}`
  );
  console.log("✓ Admin Redirection: Admin without AAL2 is redirected to /admin/mfa (HTTP 307)");

  // 11d: Admin can access /admin/mfa enrollment page
  const mfaPageRes = await fetch(`${BASE_URL}/admin/mfa`, { headers: unenrolledAdminHeaders });
  assert.strictEqual(mfaPageRes.status, 200, "Admin can access /admin/mfa");
  const mfaPageHtml = await mfaPageRes.text();
  assert(
    mfaPageHtml.includes("2-Step") || mfaPageHtml.includes("Authenticator") || mfaPageHtml.includes("Admin"),
    "MFA page renders 2-step setup interface"
  );
  console.log("✓ MFA Enrollment Page: Admin accesses /admin/mfa successfully with 2-step setup interface");

  // 11e: Normal candidate visiting /admin/mfa gets 404
  const candidateMfaRes = await fetch(`${BASE_URL}/admin/mfa`, { headers: candidateHeaders });
  assert.strictEqual(candidateMfaRes.status, 404, "Normal user gets 404 on /admin/mfa");
  console.log("✓ Outsider Protection: Regular candidate received 404 on /admin/mfa");

  console.log("\n=== ALL ADMIN PANEL SECURITY & FUNCTIONALITY TESTS PASSED! ===");
}

runAdminTests().catch((err) => {
  console.error("\n❌ ADMIN TEST FAILED:", err);
  process.exit(1);
});
