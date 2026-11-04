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

    const fallbackResult: TailorResult = {
      match_score: 74,
      matched_skills: [
        "Data Structures & Algorithms",
        "React",
        "Node.js",
        "Git",
        "REST APIs",
        "SQL",
      ],
      missing_keywords: [
        "Docker / Containerization",
        "Redis caching",
        "CI/CD pipelines",
        "System latency benchmarking",
        "Kafka / Event queues",
      ],
      bullet_suggestions: [
        {
          original: "Developed a full stack web application using React and Node.js for student notes.",
          improved:
            "Architected responsive full-stack note-sharing platform serving 500+ campus students, improving content retrieval speeds by 38% via Redis caching.",
          reason:
            "Quantifies impact and demonstrates production-grade caching techniques sought by the recruiter.",
        },
        {
          original: "Worked on SQL queries and database management for semester project.",
          improved:
            "Engineered normalized PostgreSQL schema with indexed queries, reducing p95 database response latency under 45ms across 10,000 synthetic records.",
          reason:
            "Replaces generic phrasing with specific database tuning metrics and measurable scale.",
        },
        {
          original: "Collaborated with team members to resolve bugs.",
          improved:
            "Coordinated with a 4-engineer peer team via Git PR workflows and automated testing, resolving 25+ critical edge-case bugs ahead of sprint deadline.",
          reason:
            "Highlights agile team collaboration, code reviews, and proactive delivery.",
        },
      ],
      summary:
        "Your profile has solid core full-stack foundations that match the foundational requirements of this job. Incorporating cloud, caching, and concrete performance metrics will significantly increase your ATS ranking.",
      action_plan: [
        "Include Redis and Docker keywords in your Technical Skills section",
        "Update project bullet points using the suggested metric-driven STAR format",
        "Add a direct link to your live GitHub deployment and system architecture diagram",
      ],
    };

    const result = await generateStructuredJSON<TailorResult>(
      userPrompt,
      resumeTailorSchema,
      systemPrompt,
      fallbackResult
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

