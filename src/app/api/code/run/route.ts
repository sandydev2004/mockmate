import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { executeCodeOnTestCases } from "@/lib/judge0";
import { getProblemByIdOrSlug } from "@/lib/dsa-problems";
import { SupportedLanguage } from "@/types";

const runCodeSchema = z.object({
  interview_id: z.string().uuid(),
  problem_id: z.string().min(1),
  language: z.enum(["python", "cpp", "java", "javascript"]),
  code: z.string().min(1, "Code cannot be empty").max(20000, "Code is too large"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = runCodeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid code submission", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { interview_id, problem_id, language, code } = validated.data;

    // Fetch problem
    const problem = getProblemByIdOrSlug(problem_id);
    if (!problem) {
      return NextResponse.json({ error: "DSA Problem not found" }, { status: 404 });
    }

    // Execute against all test cases
    const results = await executeCodeOnTestCases(
      language as SupportedLanguage,
      code,
      problem.test_cases
    );

    const passedCount = results.filter((r) => r.passed).length;
    const allPassed = passedCount === results.length;

    // Record submission
    const submissionRecord = {
      id: crypto.randomUUID(),
      interview_id,
      language: language as SupportedLanguage,
      code,
      test_results: results,
      execution_status: allPassed ? "Accepted" : "Wrong Answer",
      created_at: new Date().toISOString(),
    };

    appStore.addSubmission(submissionRecord);

    return NextResponse.json({
      results,
      all_passed: allPassed,
      passed_count: passedCount,
      total_count: results.length,
      submission_id: submissionRecord.id,
    });
  } catch (error: any) {
    console.error("[CODE_RUN_ERROR]", error);
    return NextResponse.json(
      { error: "Code execution failed", details: error.message },
      { status: 500 }
    );
  }
}

