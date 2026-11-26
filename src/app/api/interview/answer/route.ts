import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { evaluateCandidateAnswer } from "@/lib/llm";
import { createAdminClient } from "@/lib/supabase/admin";

const answerSchema = z.object({
  interview_id: z.string().uuid(),
  content: z.string().min(1, "Answer cannot be empty").max(4000, "Answer is too long"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const validated = answerSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid answer data", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { interview_id, content } = validated.data;
    const supabase = createAdminClient();

    // 1. Fetch interview from DB or store
    let interview: any = null;
    const { data: dbInterview } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interview_id)
      .single();

    if (dbInterview) {
      interview = dbInterview;
    } else {
      interview = appStore.getInterview(interview_id);
    }

    if (!interview) {
      return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
    }

    if (interview.status === "completed") {
      return NextResponse.json({ error: "This interview has already ended." }, { status: 400 });
    }

    // Timing check for fast long answer anomaly
    if (interview.mode === "proctored" && interview.question_started_at) {
      const elapsedMs = Date.now() - new Date(interview.question_started_at).getTime();
      if (content.trim().length > 120 && elapsedMs < 2500) {
        const anomalyEvt = {
          id: crypto.randomUUID(),
          interview_id,
          event_type: "typing_anomaly" as const,
          details: {
            type: "fast_long_answer",
            length: content.trim().length,
            elapsed_ms: elapsedMs,
          },
          created_at: new Date().toISOString(),
        };
        appStore.addIntegrityEvent(anomalyEvt);
        try {
          await supabase.from("integrity_events").insert(anomalyEvt);
        } catch {}
      }
    }

    // 2. Fetch full conversation history so far
    let previousMessages: Array<{ sender: "ai" | "user" | "system"; content: string }> = [];
    const { data: dbMessages } = await supabase
      .from("messages")
      .select("sender, content, created_at")
      .eq("interview_id", interview_id)
      .order("created_at", { ascending: true });

    if (dbMessages && dbMessages.length > 0) {
      previousMessages = dbMessages as any;
    } else {
      previousMessages = appStore.getInterviewMessages(interview_id);
    }

    // Rate limiting: Cap messages per interview
    const maxMessages = parseInt(process.env.MAX_MESSAGES_PER_INTERVIEW || "25", 10);
    if (previousMessages.length >= maxMessages) {
      return NextResponse.json({
        reply: "We have reached the maximum question limit for this session. Please click 'View Feedback Report' to see your comprehensive placement report.",
        current_question: interview.total_questions,
        is_finished: true,
      });
    }

    // 3. Fetch resume text if any
    let resumeText = "";
    if (interview.resume_id) {
      const { data: resData } = await supabase
        .from("resumes")
        .select("extracted_text")
        .eq("id", interview.resume_id)
        .single();
      if (resData?.extracted_text) {
        resumeText = resData.extracted_text;
      } else {
        const localResume = appStore.getResume(interview.resume_id);
        if (localResume) resumeText = localResume.extracted_text;
      }
    }

    // 4. Fetch DSA Problem if in DSA round
    let dsaProblem: any = null;
    if (interview.round === "dsa" && interview.dsa_problem_id) {
      const { data: prob } = await supabase
        .from("dsa_problems")
        .select("title, description")
        .eq("id", interview.dsa_problem_id)
        .single();
      dsaProblem = prob;
    }

    // 5. Call Real AI Interviewer to evaluate answer relevance and produce follow-up
    let evaluation;
    try {
      evaluation = await evaluateCandidateAnswer({
        role: interview.role,
        companyType: interview.company_type,
        targetCompany: interview.target_company,
        difficulty: interview.difficulty,
        round: interview.round,
        resumeText,
        totalQuestions: interview.total_questions,
        currentQuestionIndex: interview.current_question_index,
        conversationHistory: previousMessages,
        latestAnswer: content.trim(),
        dsaProblem,
      });
    } catch (llmErr: any) {
      console.error("[ANSWER_LLM_FAILURE] Gemini API failed during answer evaluation:", llmErr);
      return NextResponse.json(
        {
          error: `AI Interviewer service error: ${llmErr.message}. The question was not advanced. Please try submitting again.`,
        },
        { status: 503 }
      );
    }

    // 6. Save Candidate message
    const userMsgId = crypto.randomUUID();
    const userMsg = {
      id: userMsgId,
      interview_id,
      sender: "user" as const,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    await supabase.from("messages").insert(userMsg);
    appStore.addMessage(userMsg);

    // 7. Save AI message
    const aiMsgId = crypto.randomUUID();
    const aiMsg = {
      id: aiMsgId,
      interview_id,
      sender: "ai" as const,
      content: evaluation.reply,
      created_at: new Date().toISOString(),
    };
    await supabase.from("messages").insert(aiMsg);
    appStore.addMessage(aiMsg);

    // 8. Handle Question Advancement
    // If the answer is irrelevant/nonsense (is_relevant: false), do NOT advance!
    let nextQuestionIndex = interview.current_question_index;
    let isFinished = false;

    if (evaluation.is_relevant) {
      nextQuestionIndex = interview.current_question_index + 1;
      isFinished = nextQuestionIndex > interview.total_questions;

      interview.current_question_index = Math.min(nextQuestionIndex, interview.total_questions);
      interview.question_started_at = new Date().toISOString();
      if (isFinished) {
        interview.status = "completed";
        interview.ended_at = new Date().toISOString();
      }

      await supabase
        .from("interviews")
        .update({
          current_question_index: interview.current_question_index,
          status: interview.status,
          ended_at: interview.ended_at,
        })
        .eq("id", interview_id);

      appStore.saveInterview(interview);
    }

    return NextResponse.json({
      reply: evaluation.reply,
      current_question: interview.current_question_index,
      total_questions: interview.total_questions,
      is_finished: isFinished,
      is_relevant: evaluation.is_relevant,
    });
  } catch (error: any) {
    console.error("[ANSWER_ROUTE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to process interview response", details: error.message },
      { status: 500 }
    );
  }
}
