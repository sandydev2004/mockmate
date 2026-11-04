import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { buildInterviewerSystemPrompt, generateText, sanitizeCandidateInput } from "@/lib/llm";

const answerSchema = z.object({
  interview_id: z.string().uuid(),
  content: z.string().min(1, "Answer cannot be empty").max(4000, "Answer is too long"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const interview = appStore.getInterview(interview_id);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status === "completed") {
      return NextResponse.json({ error: "This interview has already ended" }, { status: 400 });
    }

    const previousMessages = appStore.getInterviewMessages(interview_id);

    // Rate limiting & cost control: Max 20 messages per interview
    const maxMessages = parseInt(process.env.MAX_MESSAGES_PER_INTERVIEW || "20", 10);
    if (previousMessages.length >= maxMessages) {
      return NextResponse.json({
        reply: "Thank you for answering all questions. We have concluded the interview session. Please click 'Finish Interview' to generate your detailed feedback report.",
        current_question: interview.total_questions,
        is_finished: true,
      });
    }

    // 1. Save candidate message
    const userMessage = {
      id: crypto.randomUUID(),
      interview_id,
      sender: "user" as const,
      content,
      created_at: new Date().toISOString(),
    };
    appStore.addMessage(userMessage);

    // 2. Determine question index and completion
    const nextQuestionIndex = interview.current_question_index + 1;
    const isFinished = nextQuestionIndex > interview.total_questions;

    // Update interview question counter
    interview.current_question_index = Math.min(nextQuestionIndex, interview.total_questions);
    appStore.saveInterview(interview);

    // 3. Build system prompt & message history for LLM
    let resumeText = "";
    if (interview.resume_id) {
      const resRecord = appStore.getResume(interview.resume_id);
      if (resRecord) resumeText = resRecord.extracted_text;
    }

    const systemPrompt = buildInterviewerSystemPrompt({
      role: interview.role,
      companyType: interview.company_type,
      difficulty: interview.difficulty,
      round: interview.round,
      resumeText,
      totalQuestions: interview.total_questions,
    });

    // Format transcript for LLM
    const llmMessages = previousMessages.map((m) => ({
      role: (m.sender === "ai" ? "model" : "user") as "model" | "user",
      content: m.sender === "user" ? sanitizeCandidateInput(m.content) : m.content,
    }));

    // Add candidate's latest message with context instruction
    let userPromptWithInstruction = sanitizeCandidateInput(content);
    if (isFinished) {
      userPromptWithInstruction += `\n\n[Interviewer instruction: This was the final question (${interview.total_questions}/${interview.total_questions}). Briefly acknowledge the candidate's answer, provide a warm concluding remark, and let them know the interview has ended. Keep under 80 words.]`;
    } else {
      userPromptWithInstruction += `\n\n[Interviewer instruction: Candidate answered question ${interview.current_question_index - 1} of ${interview.total_questions}. Acknowledge/probe their response, then ask Question #${interview.current_question_index}. Keep under 120 words.]`;
    }

    llmMessages.push({
      role: "user",
      content: userPromptWithInstruction,
    });

    const aiReply = await generateText({
      systemPrompt,
      messages: llmMessages,
      temperature: 0.6,
      maxTokens: 300,
    });

    // 4. Save AI message
    const aiMessage = {
      id: crypto.randomUUID(),
      interview_id,
      sender: "ai" as const,
      content: aiReply,
      created_at: new Date().toISOString(),
    };
    appStore.addMessage(aiMessage);

    return NextResponse.json({
      reply: aiReply,
      current_question: interview.current_question_index,
      total_questions: interview.total_questions,
      is_finished: isFinished,
    });
  } catch (error: any) {
    console.error("[ANSWER_ROUTE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to process interview response", details: error.message },
      { status: 500 }
    );
  }
}
