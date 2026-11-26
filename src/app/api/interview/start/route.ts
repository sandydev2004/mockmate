import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { buildInterviewerSystemPrompt, generateText } from "@/lib/llm";
import { getRandomProblem, DSA_PROBLEMS } from "@/lib/dsa-problems";
import { selectRandomDsaProblem } from "@/lib/question-randomizer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformSettings } from "@/lib/platform-settings";
import { verifyCreditEligibility, consumeCredit } from "@/lib/credit-manager";
import { logAdminAction } from "@/lib/audit";

const startInterviewSchema = z.object({
  role: z.enum(["SDE", "Data/ML", "Core"]),
  company_type: z.enum(["service", "product", "startup"]),
  target_company: z.string().optional().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  round: z.enum(["dsa", "hr", "cs_fundamentals", "system_design"]),
  resume_id: z.string().optional().nullable(),
  mode: z.enum(["proctored", "practice"]).optional().default("proctored"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to start an interview." }, { status: 401 });
    }

    if (user.is_suspended) {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    // Check platform settings kill-switch
    const platformSettings = await getPlatformSettings();
    if (platformSettings.llm_kill_switch) {
      return NextResponse.json(
        { error: "Interviews are temporarily disabled by the administrator for maintenance." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const validated = startInterviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid interview parameters", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { role, company_type, target_company, difficulty, round, resume_id, mode } = validated.data;
    const supabase = createAdminClient();

    // 1. Credit & Suspension Pre-check using centralized helper (Do NOT deduct yet! Only deduct after LLM succeeds)
    const eligibility = await verifyCreditEligibility(user);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: eligibility.error || "Insufficient credits. You need at least 1 credit to start an interview.",
          code: eligibility.statusCode === 402 ? "INSUFFICIENT_CREDITS" : "ACCESS_DENIED",
        },
        { status: eligibility.statusCode || 402 }
      );
    }

    // 1b. Enforce Daily Interview Caps (Admins get higher cap via ADMIN_MAX_DAILY_INTERVIEWS)
    const isAdmin = eligibility.isAdmin || user.role === "admin";
    const maxDailyInterviews = isAdmin
      ? Number(process.env.ADMIN_MAX_DAILY_INTERVIEWS) || 100
      : platformSettings.max_daily_interviews_per_user || 10;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayIso = startOfToday.toISOString();

    let todayInterviewsCount = 0;
    try {
      const { count, error: countErr } = await supabase
        .from("interviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("started_at", startOfTodayIso);
      if (!countErr && count !== null) {
        todayInterviewsCount = count;
      }
    } catch {}

    if (todayInterviewsCount === 0) {
      const localInterviews = appStore.getUserInterviews(user.id);
      todayInterviewsCount = localInterviews.filter(
        (i) => i.started_at && new Date(i.started_at) >= startOfToday
      ).length;
    }

    if (todayInterviewsCount >= maxDailyInterviews) {
      return NextResponse.json(
        {
          error: `Daily interview limit of ${maxDailyInterviews} reached. Please try again tomorrow.`,
          code: "DAILY_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // 2. Fetch resume text if provided
    let resumeText = "";
    if (resume_id) {
      const { data: resumeData } = await supabase
        .from("resumes")
        .select("extracted_text")
        .eq("id", resume_id)
        .single();
      if (resumeData?.extracted_text) {
        resumeText = resumeData.extracted_text;
      } else {
        const localResume = appStore.getResume(resume_id);
        if (localResume) resumeText = localResume.extracted_text;
      }
    }

    // 3. Generate interview randomization seed & pick DSA problem avoiding past repeats
    const seed = Math.floor(Math.random() * 1000000) + 1;
    let dsaProblemId: string | null = null;
    let selectedProblem: any = null;

    if (round === "dsa") {
      let candidateProblems = DSA_PROBLEMS;
      try {
        const { data: dbProblems } = await supabase
          .from("dsa_problems")
          .select("*")
          .eq("difficulty", difficulty);
        if (dbProblems && dbProblems.length > 0) {
          candidateProblems = dbProblems;
        }
      } catch (err) {}

      // Avoid serving the same problem to the same user twice
      let pastProblemIds: string[] = [];
      try {
        const { data: pastInterviews } = await supabase
          .from("interviews")
          .select("dsa_problem_id")
          .eq("user_id", user.id)
          .not("dsa_problem_id", "is", null);
        if (pastInterviews) {
          pastProblemIds = pastInterviews.map((p: any) => p.dsa_problem_id).filter(Boolean);
        }
      } catch (err) {}

      selectedProblem = selectRandomDsaProblem(
        candidateProblems,
        difficulty,
        pastProblemIds,
        seed
      );
      dsaProblemId = selectedProblem.id;
    }

    const totalQuestions = round === "dsa" ? 6 : 7;
    const systemPrompt = buildInterviewerSystemPrompt({
      role,
      companyType: company_type,
      targetCompany: target_company,
      difficulty,
      round,
      resumeText,
      totalQuestions,
    });

    let firstPrompt = "";
    if (round === "dsa" && selectedProblem) {
      firstPrompt = `Start the interview. Greet the candidate professionally, mention this is a DSA round${
        target_company ? ` for ${target_company}` : ` for a ${company_type} company`
      }, and introduce the problem: "${selectedProblem.title}". Briefly outline the objective and ask the candidate how they plan to approach it before writing code. Keep under 120 words.`;
    } else if (resumeText) {
      firstPrompt = `Start the interview. Greet the candidate warmly${
        target_company ? ` on behalf of ${target_company}` : ""
      }, mention you are reviewing their resume, and ask an opening technical question directly relating to one of the projects or key technical skills stated in their resume. Keep under 120 words.`;
    } else {
      firstPrompt = `Start the interview. Greet the candidate professionally${
        target_company ? ` on behalf of ${target_company}` : ""
      } and ask the first question for a ${difficulty}-level ${role} interview in the ${round} round. Keep under 120 words.`;
    }

    // 4. Call Real LLM FIRST (If this fails, credit is NOT deducted!)
    let firstQuestion: string;
    try {
      firstQuestion = await generateText({
        systemPrompt,
        messages: [{ role: "user", content: firstPrompt }],
        temperature: 0.6,
        maxTokens: 300,
      });
    } catch (llmError: any) {
      console.error("[START_INTERVIEW_LLM_FAILURE] Failed to generate first question via Gemini:", llmError);
      return NextResponse.json(
        {
          error: `AI Interviewer failed to initialize: ${llmError.message}. No credits were deducted.`,
        },
        { status: 503 }
      );
    }

    // 5. LLM succeeded -> Deduct credit (or skip entirely if admin)
    const interviewId = crypto.randomUUID();
    const activeSessionToken = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const consumptionResult = await consumeCredit(user, { interviewId });

    // 6. Create interview and initial message records (tagged with is_admin_test for admins)
    const interviewRecord = {
      id: interviewId,
      user_id: user.id,
      role,
      company_type,
      target_company: target_company || null,
      difficulty,
      round,
      resume_id: resume_id || null,
      status: "active" as const,
      mode: mode || "proctored",
      strikes: 0,
      seed,
      active_session_token: activeSessionToken,
      question_started_at: nowIso,
      last_heartbeat_at: nowIso,
      started_at: nowIso,
      current_question_index: 1,
      total_questions: totalQuestions,
      dsa_problem_id: dsaProblemId,
      is_admin_test: isAdmin,
    };

    // Save to Supabase (with fallback if column target_company doesn't exist yet on remote table)
    const { error: insertError } = await supabase.from("interviews").insert(interviewRecord);
    if (insertError && insertError.message?.includes("target_company")) {
      const fallbackRecord = { ...interviewRecord };
      delete (fallbackRecord as any).target_company;
      await supabase.from("interviews").insert(fallbackRecord);
    }

    // If an administrator starts an interview without credits, log to audit_logs (metadata only, NO interview content)
    if (isAdmin) {
      await logAdminAction({
        adminId: user.id,
        adminEmail: user.email,
        action: "interview.admin_credit_exempt_start",
        targetType: "interview",
        targetId: interviewId,
        details: {
          round,
          role,
          difficulty,
          company_type,
          mode: mode || "proctored",
          is_admin_test: true,
          credits_deducted: false,
        },
        req,
      });
    }

    const messageRecord = {
      id: crypto.randomUUID(),
      interview_id: interviewId,
      sender: "ai" as const,
      content: firstQuestion,
      created_at: new Date().toISOString(),
    };

    await supabase.from("messages").insert(messageRecord);

    // Also mirror to memory store for fast lookups
    appStore.saveInterview(interviewRecord);
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
