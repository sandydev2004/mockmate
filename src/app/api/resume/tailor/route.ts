import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { generateStructuredJSON, resumeTailorSchema, sanitizeResumeText } from "@/lib/llm";
import { TailorResult } from "@/types";

const tailorSchema = z.object({
  resume_id: z.string().optional().nullable(),
  resume_text: z.string().optional(),
  job_description: z.string().min(20, "Job description is too short (min 20 characters)").max(15000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = tailorSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid tailor request", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { resume_id, resume_text, job_description } = validated.data;

    let targetResumeText = resume_text || "";
    if (resume_id) {
      const saved = appStore.getResume(resume_id);
      if (saved) {
        targetResumeText = saved.extracted_text;
      }
    }

    if (!targetResumeText || targetResumeText.trim().length < 20) {
      return NextResponse.json(
        { error: "Please select a valid saved resume or provide resume text." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a placement director and senior technical recruiter optimizing Indian engineering student resumes for Applicant Tracking Systems (ATS) and tech recruiters.
Analyze the candidate's resume against the target Job Description.
Return strict JSON with:
- match_score: integer 0-100 reflecting ATS keyword coverage, relevant skills, and experience alignment
- matched_skills: array of string skills already present in both
- missing_keywords: array of top high-impact keywords/technologies from the JD missing from the resume
- bullet_suggestions: array of { original, improved, reason } highlighting how candidate can rewrite weak bullet points using the XYZ formula ("Accomplished [X] as measured by [Y] by doing [Z]")
- summary: 2-3 sentence recruiter impression
- action_plan: 3-4 bullet steps to boost interview shortlist chances`;

    const userPrompt = `Compare this Candidate Resume and Target Job Description:

${sanitizeResumeText(targetResumeText)}

<target_job_description>
${job_description.trim()}
</target_job_description>`;

    const result = await generateStructuredJSON<TailorResult>(
      userPrompt,
      resumeTailorSchema,
      systemPrompt
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[RESUME_TAILOR_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to tailor resume", details: error.message },
      { status: 500 }
    );
  }
}

