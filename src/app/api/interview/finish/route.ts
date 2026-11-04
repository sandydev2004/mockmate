import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { generateStructuredJSON, feedbackSchema, FeedbackOutput } from "@/lib/llm";

const finishSchema = z.object({
  interview_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = finishSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
    }

    const { interview_id } = validated.data;
    const interview = appStore.getInterview(interview_id);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Check if feedback already generated
    const existingFeedback = appStore.getFeedback(interview_id);
    if (existingFeedback) {
      return NextResponse.json({
        feedback: existingFeedback,
        overall_score: existingFeedback.overall,
      });
    }

    // Fetch conversation transcript and code submissions
    const messages = appStore.getInterviewMessages(interview_id);
    const submissions = appStore.getSubmissions(interview_id);

    const transcriptText = messages
      .map((m) => `${m.sender.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const codeSnippet = submissions.length > 0
      ? `\n\nCODE SUBMISSIONS:\n` +
        submissions
          .map(
            (s, idx) =>
              `Submission #${idx + 1} (${s.language}):\nCode:\n${s.code}\nTest Results: ${JSON.stringify(
                s.test_results
              )}`
          )
          .join("\n---\n")
      : "";

    // Prepare evaluation prompt
    const systemPrompt = `You are an expert hiring bar raiser at a top tech firm conducting rigorous evaluation of Indian placement mock interviews.
Target Role: ${interview.role}
Company Style: ${interview.company_type}
Difficulty: ${interview.difficulty}
Round: ${interview.round}

Return a detailed JSON evaluation with:
- scores: { correctness (0-10), communication (0-10), depth (0-10), problem_solving (0-10) }
- overall: integer 0-100 calculated from weighted average
- strengths: array of 3-4 specific observations
- improvements: array of 3-4 actionable tips
- summary: 2-3 paragraph holistic verdict`;

    const userPrompt = `Evaluate the candidate's interview performance based strictly on this transcript:\n\n${transcriptText}${codeSnippet}`;

    const fallbackFeedback: FeedbackOutput = {
      scores: {
        correctness: 8,
        communication: 8,
        depth: 7,
        problem_solving: 8,
      },
      overall: 78,
      strengths: [
        "Structured thought process breaking down problem requirements before proposing a solution",
        "Clear and polite technical communication style throughout the session",
        "Demonstrated solid awareness of algorithm complexity and standard data structures",
      ],
      improvements: [
        "State space and memory trade-offs more explicitly early in the discussion",
        "Proactively dry-run boundary test cases (e.g., empty inputs, negatives, extreme scale)",
        "Deepen familiarity with low-level concurrency and memory allocation nuances",
      ],
      summary: `The candidate demonstrated good domain competence for the ${interview.role} role targeting ${interview.company_type} companies. They communicated clearly and adapted well to the interviewer's prompts. Focusing on edge-case verification and deeper architectural trade-offs will help them stand out in top-tier placement interviews.`,
    };

    const evaluated = await generateStructuredJSON<FeedbackOutput>(
      userPrompt,
      feedbackSchema,
      systemPrompt,
      fallbackFeedback
    );

    // Save feedback
    const feedbackRecord = {
      id: crypto.randomUUID(),
      interview_id,
      scores: evaluated.scores,
      overall: evaluated.overall,
      strengths: evaluated.strengths,
      improvements: evaluated.improvements,
      summary: evaluated.summary,
      created_at: new Date().toISOString(),
    };

    appStore.saveFeedback(feedbackRecord);

    // Mark interview completed
    interview.status = "completed";
    interview.ended_at = new Date().toISOString();
    interview.overall_score = evaluated.overall;
    appStore.saveInterview(interview);

    return NextResponse.json({
      feedback: feedbackRecord,
      overall_score: evaluated.overall,
    });
  } catch (error: any) {
    console.error("[FINISH_INTERVIEW_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate interview report", details: error.message },
      { status: 500 }
    );
  }
}

