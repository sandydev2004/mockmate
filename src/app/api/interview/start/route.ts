import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { buildInterviewerSystemPrompt, generateText } from "@/lib/llm";
import { getRandomProblem } from "@/lib/dsa-problems";
import { createClient } from "@/lib/supabase/server";

const startInterviewSchema = z.object({
  role: z.enum(["SDE", "Data/ML", "Core"]),
  company_type: z.enum(["service", "product", "startup"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  round: z.enum(["dsa", "hr", "cs_fundamentals", "system_design"]),
  resume_id: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const validated = startInterviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid interview parameters", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { role, company_type, difficulty, round, resume_id } = validated.data;

    // Supabase check vs Local store check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isSupabaseConfigured =
      supabaseUrl && !supabaseUrl.includes("mockmate-demo");

    // 1. Atomic credit check and deduction
    let creditDeducted = false;

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data: deducted, error } = await supabase.rpc("deduct_interview_credit", {
          p_user_id: user.id,
        });
        if (!error && deducted) {
          creditDeducted = true;
        }
      } catch (err) {
        console.warn("Supabase RPC failed, using store deduction:", err);
      }
    }

    if (!creditDeducted) {
      creditDeducted = appStore.deductCredit(user.id);
    }

    if (!creditDeducted) {
      return NextResponse.json(
        {
          error: "Insufficient credits. Please purchase an interview pack to continue.",
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 }
      );
    }

    // 2. Fetch resume text if resume_id is provided
    let resumeText = "";
    if (resume_id) {
      const savedResume = appStore.getResume(resume_id);
      if (savedResume) {
        resumeText = savedResume.extracted_text;
      } else if (isSupabaseConfigured) {
        try {
          const supabase = createClient();
          const { data: resData } = await supabase
            .from("resumes")
            .select("extracted_text")
            .eq("id", resume_id)
            .single();
          if (resData) resumeText = resData.extracted_text;
        } catch {
          // ignore
        }
      }
    }

    // 3. For DSA rounds, pick a targeted problem
    let dsaProblemId: string | null = null;
    if (round === "dsa") {
      const problem = getRandomProblem(difficulty);
      dsaProblemId = problem.id;
    }

    // 4. Create interview record
    const interviewId = crypto.randomUUID();
    const totalQuestions = round === "dsa" ? 6 : 7;

    const interviewRecord = {
      id: interviewId,
      user_id: user.id,
      role,
      company_type,
      difficulty,
      round,
      resume_id: resume_id || null,
      status: "active" as const,
      started_at: new Date().toISOString(),
      current_question_index: 1,
      total_questions: totalQuestions,
      dsa_problem_id: dsaProblemId,
    };

    appStore.saveInterview(interviewRecord);

    // 5. Generate first question using LLM
    const systemPrompt = buildInterviewerSystemPrompt({
      role,
      companyType: company_type,
      difficulty,
      round,
      resumeText,
      totalQuestions,
    });

    let firstPrompt = "";
    if (round === "dsa") {
      firstPrompt = `Start the interview. Greet the candidate briefly, mention you will be evaluating their problem solving skills for the ${company_type} company style, and introduce the problem statement clearly.`;
    } else if (resumeText) {
      firstPrompt = `Start the interview. Greet the candidate warmly, mention you have their resume in front of you, and ask an opening question directly relating to one of their highlighted projects or tools on their resume.`;
    } else {
      firstPrompt = `Start the interview. Greet the candidate warmly and ask the first foundational question for a ${difficulty} level ${role} interview focused on ${round}.`;
    }

    const firstQuestion = await generateText({
      systemPrompt,
      messages: [{ role: "user", content: firstPrompt }],
      temperature: 0.6,
      maxTokens: 250,
    });

    // 6. Save AI question into messages
    const messageRecord = {
      id: crypto.randomUUID(),
      interview_id: interviewId,
      sender: "ai" as const,
      content: firstQuestion,
      created_at: new Date().toISOString(),
    };
    appStore.addMessage(messageRecord);

    return NextResponse.json({
      interview: interviewRecord,
      first_message: messageRecord,
    });
  } catch (error: any) {
    console.error("[START_INTERVIEW_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to initialize interview", details: error.message },
      { status: 500 }
    );
  }
}
