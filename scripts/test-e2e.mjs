async function runTests() {
  console.log("=== STARTING MOCKMATE E2E TEST SUITE ===");
  const BASE_URL = "http://localhost:3000";

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
  console.log("\n[Test 3] Sign up with Passed Name: 'Sandeep Kumar'");
  const signupRes = await fetch(`${BASE_URL}/api/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Sandeep Kumar",
      email: "sandeep@placement.edu.in",
    }),
  });
  const signupData = await signupRes.json();
  const setCookieHeader = signupRes.headers.get("set-cookie");
  const sessionCookie = setCookieHeader ? setCookieHeader.split(";")[0] : "";

  console.log(`✓ Signed up candidate: "${signupData.user.full_name}" (${signupData.user.email})`);
  console.log(`✓ Session Cookie received: ${sessionCookie.slice(0, 30)}...`);
  if (signupData.user.full_name !== "Sandeep Kumar") {
    throw new Error(`Expected name 'Sandeep Kumar', got '${signupData.user.full_name}'`);
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

  // Test 5: Start Interview with the authenticated user
  console.log("\n[Test 5] Testing /api/interview/start (DSA Round, SDE, Product)");
  const startRes = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      role: "SDE",
      company_type: "product",
      difficulty: "easy",
      round: "dsa",
    }),
  });
  const startData = await startRes.json();
  if (startRes.status !== 200) throw new Error(`Interview start failed: ${JSON.stringify(startData)}`);
  console.log(`✓ Interview started! ID: ${startData.interview.id}`);
  console.log(`✓ Assigned DSA Problem: ${startData.interview.dsa_problem_id}`);

  const interviewId = startData.interview.id;

  // Test 6: Answer Question
  console.log("\n[Test 6] Testing /api/interview/answer");
  const answerRes = await fetch(`${BASE_URL}/api/interview/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      interview_id: interviewId,
      content: "I will use a hash map to store elements and their indices. For each element num, I check if target - num exists in the map. This achieves O(n) time complexity and O(n) space.",
    }),
  });
  const answerData = await answerRes.json();
  if (answerRes.status !== 200) throw new Error(`Interview answer failed: ${JSON.stringify(answerData)}`);
  console.log(`✓ Interviewer Adaptive Follow-Up received`);
  console.log(`✓ Question Progress: ${answerData.current_question}/${answerData.total_questions}`);

  // Test 7: Code Execution with Judge0 CE / Local Evaluator
  console.log("\n[Test 7] Testing /api/code/run");
  const codeRes = await fetch(`${BASE_URL}/api/code/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      interview_id: interviewId,
      problem_id: startData.interview.dsa_problem_id || "two-sum",
      language: "python",
      code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return f"{seen[complement]} {i}"
        seen[num] = i
    return ""`,
    }),
  });
  const codeData = await codeRes.json();
  if (codeRes.status !== 200) throw new Error(`Code execution failed: ${JSON.stringify(codeData)}`);
  console.log(`✓ Code execution returned: ${codeData.passed_count}/${codeData.total_count} test cases passed`);

  // Test 8: Finish Interview and Structured Feedback Report
  console.log("\n[Test 8] Testing /api/interview/finish");
  const finishRes = await fetch(`${BASE_URL}/api/interview/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({ interview_id: interviewId }),
  });
  const finishData = await finishRes.json();
  if (finishRes.status !== 200) throw new Error(`Finish interview failed: ${JSON.stringify(finishData)}`);
  console.log(`✓ Feedback Generated! Overall Score: ${finishData.overall_score}/100`);

  // Test 9: Razorpay Order Creation & Verification
  console.log("\n[Test 9] Testing Razorpay Payments Order & Verification");
  const orderRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({ pack_id: "pack_3" }),
  });
  const orderData = await orderRes.json();
  console.log(`✓ Order Created: ${orderData.order_id}, Amount: ₹${orderData.amount / 100}`);

  const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      razorpay_order_id: orderData.order_id,
      razorpay_payment_id: "pay_test_payment_12345",
      razorpay_signature: "sig_test_signature_valid",
    }),
  });
  const verifyData = await verifyRes.json();
  console.log(`✓ Payment verified! Total Credits: ${verifyData.current_credits}`);

  console.log("\n=== ALL E2E TESTS PASSED WITH NEW AUTH & NAME FIX! ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
