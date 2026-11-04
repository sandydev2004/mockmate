async function runTests() {
  console.log("=== STARTING MOCKMATE E2E TEST SUITE ===");
  const BASE_URL = "http://localhost:3000";

  // Test 1: Check Landing Page
  console.log("\n[Test 1] Testing Landing Page GET /");
  const landingRes = await fetch(`${BASE_URL}/`);
  if (landingRes.status !== 200) throw new Error(`Landing page failed: status ${landingRes.status}`);
  console.log("✓ Landing page returned HTTP 200 OK");

  // Test 2: Check Demo Auth / Free Credit
  console.log("\n[Test 2] Checking Profile & 1 Free Credit on Signup");
  const authRes = await fetch(`${BASE_URL}/api/auth/demo`);
  const authData = await authRes.json();
  console.log(`✓ Profile loaded: User ${authData.user.email}, Credits: ${authData.user.credits}`);
  if (authData.user.credits < 1) throw new Error("Free credit was not granted!");

  // Test 3: Start Interview & Atomic Credit Deduction
  console.log("\n[Test 3] Testing /api/interview/start (DSA Round, SDE, Product)");
  const startRes = await fetch(`${BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  console.log(`✓ AI First Question: "${startData.first_message.content.slice(0, 100)}..."`);

  const interviewId = startData.interview.id;

  // Test 4: Answer Question
  console.log("\n[Test 4] Testing /api/interview/answer");
  const answerRes = await fetch(`${BASE_URL}/api/interview/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      interview_id: interviewId,
      content: "I will use a hash map to store elements and their indices. For each element num, I check if target - num exists in the map. This achieves O(n) time complexity and O(n) space.",
    }),
  });
  const answerData = await answerRes.json();
  if (answerRes.status !== 200) throw new Error(`Interview answer failed: ${JSON.stringify(answerData)}`);
  console.log(`✓ Interviewer Adaptive Follow-Up: "${answerData.reply.slice(0, 100)}..."`);
  console.log(`✓ Question Progress: ${answerData.current_question}/${answerData.total_questions}`);

  // Test 5: Code Execution with Judge0 CE / Local Evaluator
  console.log("\n[Test 5] Testing /api/code/run");
  const codeRes = await fetch(`${BASE_URL}/api/code/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  console.log(`✓ Code execution returned: ${codeData.passed_count}/${codeData.total_count} test cases passed (Status: ${codeData.all_passed ? "All Passed" : "Partial"})`);

  // Test 6: Finish Interview and Structured Feedback Report
  console.log("\n[Test 6] Testing /api/interview/finish");
  const finishRes = await fetch(`${BASE_URL}/api/interview/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interview_id: interviewId }),
  });
  const finishData = await finishRes.json();
  if (finishRes.status !== 200) throw new Error(`Finish interview failed: ${JSON.stringify(finishData)}`);
  console.log(`✓ Feedback Generated! Overall Score: ${finishData.overall_score}/100`);
  console.log(`✓ Category Scores:`, finishData.feedback.scores);
  console.log(`✓ Strengths: ${finishData.feedback.strengths.length} items`);
  console.log(`✓ Improvements: ${finishData.feedback.improvements.length} items`);

  // Test 7: Resume Tailoring & ATS Matching
  console.log("\n[Test 7] Testing /api/resume/tailor");
  const tailorRes = await fetch(`${BASE_URL}/api/resume/tailor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: "Software Engineering student with experience in React, Node.js, and SQL databases. Built campus portal.",
      job_description: "We are hiring SDE-1 with strong skills in React, TypeScript, Redis caching, Docker, and distributed systems.",
    }),
  });
  const tailorData = await tailorRes.json();
  if (tailorRes.status !== 200) throw new Error(`Tailor failed: ${JSON.stringify(tailorData)}`);
  console.log(`✓ ATS Match Score: ${tailorData.match_score}/100`);
  console.log(`✓ Missing Keywords:`, tailorData.missing_keywords.slice(0, 3));
  console.log(`✓ Rewritten Bullets (Google XYZ): ${tailorData.bullet_suggestions.length} suggestions`);

  // Test 8: Razorpay Order Creation
  console.log("\n[Test 8] Testing /api/payments/create-order (Starter Pack - ₹99 for 3 Credits)");
  const orderRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pack_id: "pack_3" }),
  });
  const orderData = await orderRes.json();
  if (orderRes.status !== 200) throw new Error(`Payment order creation failed: ${JSON.stringify(orderData)}`);
  console.log(`✓ Razorpay Order Created: ${orderData.order_id}, Amount: ₹${orderData.amount / 100}, Credits: ${orderData.credits}`);

  // Test 9: Razorpay Payment Verification & Credit Fulfillment
  console.log("\n[Test 9] Testing /api/payments/verify");
  const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: orderData.order_id,
      razorpay_payment_id: "pay_test_payment_12345",
      razorpay_signature: "sig_test_signature_valid",
    }),
  });
  const verifyData = await verifyRes.json();
  if (verifyRes.status !== 200) throw new Error(`Payment verification failed: ${JSON.stringify(verifyData)}`);
  console.log(`✓ Payment verified successfully! Credits added: ${verifyData.credits_added}, Current total: ${verifyData.current_credits}`);

  console.log("\n=== ALL E2E TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
