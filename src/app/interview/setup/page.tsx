"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Upload,
  PlayCircle,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Role, CompanyType, Difficulty, RoundType } from "@/types";

function InterviewSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form State
  const [role, setRole] = useState<Role>("SDE");
  const [companyType, setCompanyType] = useState<CompanyType>("product");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [round, setRound] = useState<RoundType>(
    (searchParams.get("round") as RoundType) || "dsa"
  );

  // Resume Upload State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadStatus, setResumeUploadStatus] = useState<string | null>(null);

  // User credits & submission state
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user credits
  useEffect(() => {
    fetch("/api/auth/demo")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCredits(data.user.credits);
        }
      })
      .catch(() => {});
  }, []);

  // Handle PDF Resume Upload
  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file (.pdf)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds the 5MB size limit.");
      return;
    }

    setResumeFile(file);
    setError(null);
    setUploadingResume(true);
    setResumeUploadStatus("Extracting resume projects and skills...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload resume");
      }

      setResumeId(data.resume.id);
      setResumeUploadStatus(`Resume parsed: ${file.name}`);
    } catch (err: any) {
      setError(err.message);
      setResumeUploadStatus(null);
    } finally {
      setUploadingResume(false);
    }
  };

  // Launch interview
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          company_type: companyType,
          difficulty,
          round,
          resume_id: resumeId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "INSUFFICIENT_CREDITS") {
          setError("You have 0 interview credits. Please purchase an interview pack to continue.");
          return;
        }
        throw new Error(data.error || "Failed to start interview");
      }

      // Redirect to interview room
      router.push(`/interview/${data.interview.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 of 2: Configure Session</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Configure Your Mock Interview
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personalize the company style, difficulty, and interview round to match your target placement drive.
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p>{error}</p>
            {error.includes("credits") && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 text-xs font-bold underline"
              >
                Buy Interview Pack (Starts at ₹99) &rarr;
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Target Role */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="block text-sm font-bold text-slate-900 dark:text-white">
            1. Target Engineering Role
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "SDE", title: "Software Engineer (SDE)", desc: "Web, Backend, Full Stack & Mobile" },
              { id: "Data/ML", title: "Data / ML Engineer", desc: "Data Analytics, AI & Python" },
              { id: "Core", title: "Core CS / Systems", desc: "Embedded, Networks & OS" },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setRole(item.id as Role)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  role === item.id
                    ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-white ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{item.title}</span>
                  {role === item.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Company Model */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="block text-sm font-bold text-slate-900 dark:text-white">
            2. Company Hiring Model
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "service",
                title: "Service Company",
                examples: "TCS, Infosys, Wipro, Cognizant, Accenture",
                desc: "Focus on CS fundamentals, OOP, clean communication & standard DSA",
              },
              {
                id: "product",
                title: "Tier-1 Product Company",
                examples: "Amazon, Microsoft, Swiggy, Flipkart, Adobe",
                desc: "Rigorous focus on optimal time complexity, edge cases & internal mechanisms",
              },
              {
                id: "startup",
                title: "High-Growth Startup",
                examples: "CRED, Zepto, Razorpay, Postman",
                desc: "Practical engineering, tradeoffs, hands-on debugging & architecture choices",
              },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setCompanyType(item.id as CompanyType)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  companyType === item.id
                    ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-white ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{item.title}</span>
                  {companyType === item.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mb-1.5">{item.examples}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Interview Round */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="block text-sm font-bold text-slate-900 dark:text-white">
            3. Placement Round Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: "dsa",
                title: "DSA & Problem Solving",
                tag: "Monaco Code Editor + Judge0",
                desc: "Interactive coding with sample test cases. AI evaluates logic, time/space complexity.",
              },
              {
                id: "cs_fundamentals",
                title: "CS Fundamentals (Core)",
                tag: "OS, DBMS, CN, OOP",
                desc: "Deadlocks, Paging, ACID properties, Indexing, TCP 3-way handshake, Virtual memory.",
              },
              {
                id: "system_design",
                title: "System Design (HLD / LLD)",
                tag: "Scalability & Architecture",
                desc: "Design URL Shortener, Rate Limiter, UPI Payment Queue, Caching & Database Sharding.",
              },
              {
                id: "hr",
                title: "HR & Behavioral Round",
                tag: "STAR Format Evaluation",
                desc: "Conflict resolution, teamwork, college projects, handling pressure, why this company.",
              },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setRound(item.id as RoundType)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  round === item.id
                    ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-white ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{item.title}</span>
                  {round === item.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-950/60 px-2 py-0.5 rounded mb-2">
                  {item.tag}
                </span>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Difficulty Level */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <label className="block text-sm font-bold text-slate-900 dark:text-white">
            4. Difficulty Bar
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "easy", title: "Easy", desc: "Foundation / Mass Hiring" },
              { id: "medium", title: "Medium", desc: "Standard Campus Day-1" },
              { id: "hard", title: "Hard", desc: "Dream Package (20+ LPA)" },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setDifficulty(item.id as Difficulty)}
                className={`p-3.5 rounded-xl text-center border transition-all ${
                  difficulty === item.id
                    ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-white ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <p className="font-bold text-sm">{item.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Resume Upload (Optional) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-white">
                5. Upload Resume for Resume-Aware Questions (Optional)
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                The AI will extract your projects, tech stack & internships to cross-question you realistically. (PDF max 5MB)
              </p>
            </div>
            {resumeId && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Parsed
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-850 transition-colors">
              <Upload className="w-6 h-6 text-indigo-500 mb-2" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {resumeFile ? resumeFile.name : "Click to select resume PDF"}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                {uploadingResume ? "Extracting text..." : "PDF format only, max 5 MB"}
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleResumeChange}
                className="hidden"
              />
            </label>
          </div>

          {resumeUploadStatus && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              ✓ {resumeUploadStatus}
            </p>
          )}
        </div>

        {/* Submit & Credit Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>
              This session will consume <strong className="text-slate-900 dark:text-white">1 interview credit</strong>.
              {credits !== null && ` You have ${credits} credit(s) available.`}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingResume}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <PlayCircle className="w-5 h-5" />
            <span>{loading ? "Starting Session..." : "Enter Interview Room"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function InterviewSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading interview setup form...
        </div>
      }
    >
      <InterviewSetupContent />
    </Suspense>
  );
}
