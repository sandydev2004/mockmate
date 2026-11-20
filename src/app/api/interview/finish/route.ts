import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { generateStructuredJSON, feedbackSchema, FeedbackOutput } from "@/lib/llm";
import { computeServerRiskScore } from "@/lib/risk-config";
import { createAdminClient } from "@/lib/supabase/admin";

const finishSchema = z.object({
  interview_id: z.string().uuid(),
  auto_submit_reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const validated = finishSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid interview ID" }, { status: 400 });
    }

    const { interview_id, auto_submit_reason } = validated.data;
    const supabase = createAdminClient();

    // 1. Fetch interview
    let interview: any = null;
    const { data: dbInterview } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interview_id)
      .single();

    const localInterview = appStore.getInterview(interview_id);
    if (dbInterview && localInterview) {
      interview = { ...dbInterview, ...localInterview };
    } else {
      interview = dbInterview || localInterview;
    }

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Check if feedback already generated (in DB or appStore)
    const { data: dbFeedback } = await supabase
      .from("feedback")
      .select("*")
      .eq("interview_id", interview_id)
      .single();

    const localFeedback = appStore.getFeedback(interview_id);
    const existingFeedback = dbFeedback || localFeedback;

    if (existingFeedback) {
      return NextResponse.json({
        feedback: existingFeedback,
        overall_score: existingFeedback.overall,
      });
    }

    // 2. Fetch conversation transcript and code submissions from Supabase
    let messages: any[] = [];
    const { data: dbMessages } = await supabase
      .from("messages")
      .select("sender, content, created_at")
      .eq("interview_id", interview_id)
      .order("created_at", { ascending: true });

    if (dbMessages && dbMessages.length > 0) {
      messages = dbMessages;
    } else {
      messages = appStore.getInterviewMessages(interview_id);
    }

    const { data: dbSubmissions } = await supabase
      .from("code_submissions")
      .select("*")
      .eq("interview_id", interview_id);

    const submissions = dbSubmissions && dbSubmissions.length > 0 ? dbSubmissions : appStore.getSubmissions(interview_id);

    const transcriptText = messages
      .map((m) => `${m.sender.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const codeSnippet =
      submissions.length > 0
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

    // 3. Prepare real evaluation prompt for Gemini
    const systemPrompt = `You are an expert hiring bar raiser at a top tech firm conducting rigorous evaluation of Indian placement mock interviews.
Target Role: ${interview.role}
Company Style: ${interview.company_type}
Difficulty: ${interview.difficulty}
Round: ${interview.round}

Return a detailed RFC 8259 JSON evaluation with:
- scores: { correctness (0-10), communication (0-10), depth (0-10), problem_solving (0-10) }
- overall: integer 0-100 calculated from weighted average
- strengths: array of 3-4 specific observations
- improvements: array of 3-4 actionable tips
- summary: 2-3 paragraph holistic verdict
- authenticity_score: integer 0-10 judging whether candidate's explanations and reasoning are consistent with personal ownership of their code and answers
- authenticity_reason: a concise one-line reason for the authenticity rating`;

    const userPrompt = `Evaluate the candidate's interview performance based strictly on this transcript:\n\n${transcriptText}${codeSnippet}`;

    const evaluated = await generateStructuredJSON<FeedbackOutput>(
      userPrompt,
      feedbackSchema,
      systemPrompt
    );

    // Compute server-side risk score from integrity events
    let integrityEvents: any[] = [];
    try {
      const { data: dbEvents } = await supabase
        .from("integrity_events")
        .select("*")
        .eq("interview_id", interview_id);
      if (dbEvents && dbEvents.length > 0) integrityEvents = dbEvents;
    } catch {}
    if (integrityEvents.length === 0) {
      integrityEvents = appStore.getIntegrityEvents(interview_id);
    }

    const initialFeedbackRecord = {
      id: crypto.randomUUID(),
      interview_id,
      scores: evaluated.scores,
      overall: evaluated.overall,
      strengths: evaluated.strengths,
      improvements: evaluated.improvements,
      summary: evaluated.summary,
      authenticity_score: Math.min(10, Math.max(0, evaluated.authenticity_score ?? 8)),
      authenticity_reason: evaluated.authenticity_reason || "Consistent conceptual ownership demonstrated.",
      created_at: new Date().toISOString(),
    };

    const riskResult = computeServerRiskScore(integrityEvents, interview, initialFeedbackRecord);

    const feedbackRecord = {
      ...initialFeedbackRecord,
      risk_score: riskResult.risk_score,
      top_risk_reasons: riskResult.top_reasons,
    };

    try {
      await supabase.from("feedback").insert(feedbackRecord);
    } catch {
      try {
        const baseFeedback = {
          id: feedbackRecord.id,
          interview_id: feedbackRecord.interview_id,
          scores: feedbackRecord.scores,
          overall: feedbackRecord.overall,
          strengths: feedbackRecord.strengths,
          improvements: feedbackRecord.improvements,
          summary: feedbackRecord.summary,
          created_at: feedbackRecord.created_at,
        };
        await supabase.from("feedback").insert(baseFeedback);
      } catch {}
    }
    appStore.saveFeedback(feedbackRecord);

    // 5. Mark interview completed in Supabase
    interview.status = "completed";
    interview.ended_at = new Date().toISOString();
    interview.overall_score = evaluated.overall;
    const finalAutoSubmitReason = interview.auto_submit_reason || auto_submit_reason;
    if (finalAutoSubmitReason) {
      interview.auto_submit_reason = finalAutoSubmitReason;
      const autoEvt = {
        id: crypto.randomUUID(),
        interview_id,
        event_type: "auto_submit" as const,
        details: { reason: finalAutoSubmitReason },
        created_at: new Date().toISOString(),
      };
      appStore.addIntegrityEvent(autoEvt);
      try {
        await supabase.from("integrity_events").insert(autoEvt);
      } catch (err) {}
    }

    await supabase
      .from("interviews")
      .update({
        status: "completed",
        ended_at: interview.ended_at,
        overall_score: evaluated.overall,
        ...(finalAutoSubmitReason ? { auto_submit_reason: finalAutoSubmitReason } : {}),
      })
      .eq("id", interview_id);

    appStore.saveInterview(interview);

    return NextResponse.json({
      feedback: feedbackRecord,
      overall_score: evaluated.overall,
    });
  } catch (error: any) {
    console.error("[FINISH_INTERVIEW_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to generate interview report: " + error.message },
      { status: 500 }
    );
  }
}
