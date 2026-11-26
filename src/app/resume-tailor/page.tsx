"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  FileText,
  Upload,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Target,
  Wand2,
} from "lucide-react";
import { ResumeRecord, TailorResult } from "@/types";
import { Spinner, ButtonLoading } from "@/components/loading";

export default function ResumeTailorPage() {
  const [savedResumes, setSavedResumes] = useState<ResumeRecord[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);

  // Load saved resumes
  useEffect(() => {
    // We can fetch user's saved resumes or demo resumes
    const sampleResume: ResumeRecord = {
      id: "sample-resume-01",
      user_id: "demo-user-123",
      filename: "Rahul_Sharma_SDE_Resume.pdf",
      file_path: "resumes/sample.pdf",
      extracted_text: `RAHUL SHARMA
Email: rahul.sharma@placement.edu.in | GitHub: github.com/rahul-dev | LinkedIn: linkedin.com/in/rahul-sde
B.Tech in Computer Science and Engineering, CGPA: 8.7/10 (2021 - 2025)

TECHNICAL SKILLS:
Languages: Java, C++, Python, JavaScript, SQL
Frameworks & Libraries: React, Node.js, Express, Tailwind CSS
Core CS: Data Structures & Algorithms, Object-Oriented Programming (OOP), Database Management Systems (DBMS), Operating Systems (OS), Computer Networks (CN)
Developer Tools: Git, GitHub, VS Code, Postman

PROJECTS:
1. Campus Placement Portal (Full Stack):
- Developed a web application using React and Node.js for student notes and job listings.
- Worked on SQL queries and database management for semester project.
- Collaborated with team members to resolve bugs.

2. Distributed Rate Limiter:
- Implemented sliding window rate limiting algorithm in Python.
- Handled API requests and reduced server overhead.

EXPERIENCE:
Software Engineering Intern | TechSol India (June 2024 - August 2024)
- Assisted backend development team with REST API integrations and wrote unit test cases.`,
      created_at: new Date().toISOString(),
    };

    setSavedResumes([sampleResume]);
    setSelectedResumeId(sampleResume.id);
    setResumeText(sampleResume.extracted_text);
  }, []);

  const handleSelectResume = (id: string) => {
    setSelectedResumeId(id);
    const found = savedResumes.find((r) => r.id === id);
    if (found) {
      setResumeText(found.extracted_text);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const newRecord: ResumeRecord = {
        id: data.resume.id,
        user_id: "demo-user-123",
        filename: file.name,
        file_path: `resumes/${data.resume.id}`,
        extracted_text: data.resume.extracted_text,
        created_at: new Date().toISOString(),
      };

      setSavedResumes((prev) => [newRecord, ...prev]);
      setSelectedResumeId(newRecord.id);
      setResumeText(newRecord.extracted_text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleTailor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setError("Please paste a realistic job description (minimum 20 characters).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: selectedResumeId || undefined,
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to tailor resume");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Sample quick JD for instant testing
  const loadSampleJD = () => {
    setJobDescription(`Software Development Engineer - 1 (Campus Hiring 2025)
Company: Amazon / Top Product Firm
Location: Bangalore / Hyderabad, India

Job Requirements:
- Strong foundations in Data Structures and Algorithms with proficiency in Java, C++ or Python
- Solid understanding of Object-Oriented Design, Database Management (PostgreSQL / MySQL), and RESTful API architecture
- Hands-on experience with caching solutions (Redis), containerization (Docker), and asynchronous event queues (Kafka / SQS)
- Excellent analytical problem-solving skills and clean coding practices
- Familiarity with CI/CD deployment pipelines, automated unit testing, and distributed microservices`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>ATS Keyword Matcher & Bullet Rewriter</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          AI Resume Tailor for Campus Placements
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Match your resume directly against company job descriptions. Discover missing high-frequency keywords and upgrade weak bullets using the proven Google XYZ impact formula.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form Grid */}
      <form onSubmit={handleTailor} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Choose / Upload Resume */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Step 1: Select or Upload Resume</span>
            </label>
            <label className="cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              {uploading ? (
                <Spinner size="sm" className="text-indigo-600" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{uploading ? "Extracting text from resume..." : "Upload New PDF"}</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                disabled={uploading}
                onChange={handlePdfUpload}
                className="hidden"
              />
            </label>
          </div>

          {savedResumes.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-slate-500">Pick saved resume:</span>
              <select
                value={selectedResumeId}
                onChange={(e) => handleSelectResume(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {savedResumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.filename}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-xs text-slate-500">Resume Content (Editable):</span>
            <textarea
              rows={12}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste or edit resume text here..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: Paste Job Description */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span>Step 2: Target Job Description</span>
              </label>
              <button
                type="button"
                onClick={loadSampleJD}
                className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
              >
                Insert Sample SDE JD
              </button>
            </div>

            <textarea
              rows={14}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the placement job description from your college T&P cell, LinkedIn, or company portal..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-sans text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none leading-relaxed"
            />
          </div>

          <ButtonLoading
            type="submit"
            loading={loading}
            loadingText="Analyzing ATS Match..."
            disabled={!jobDescription.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            <span>Tailor Resume & Calculate Match Score</span>
          </ButtonLoading>
        </div>
      </form>

      {/* Results Section */}
      {result && (
        <div className="space-y-8 pt-4">
          {/* Top Result Card: Score & Recruiter Verdict */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ATS Screening Report</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Recruiter First Impression
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Score Pill */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center shrink-0 min-w-[160px]">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ATS Match Score</p>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {result.match_score}
                </span>
                <span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                {result.match_score >= 80 ? "High Shortlist Chance 🚀" : "Moderate Match 🎯"}
              </p>
            </div>
          </div>

          {/* Keywords Grid: Matched vs Missing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Matched Skills Already Present ({result.matched_skills.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.matched_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>High-Impact Missing Keywords ({result.missing_keywords.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Add these technical terms to your skills section and project descriptions to pass ATS filters:
              </p>
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Rewritten Bullet Suggestions */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-600" />
                <span>High-Impact Bullet Point Rewrites (Google XYZ Formula)</span>
              </h3>
              <p className="text-xs text-slate-500">
                "Accomplished [X] as measured by [Y] by doing [Z]" — Copy and paste these directly onto your resume.
              </p>
            </div>

            <div className="space-y-5">
              {result.bullet_suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 space-y-3"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Original Weak Bullet:
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-through">
                      "{item.original}"
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Recommended ATS-Optimized Bullet:
                      </span>
                      <button
                        onClick={() => copyToClipboard(item.improved, idx)}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Bullet</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-100 leading-relaxed">
                      "{item.improved}"
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    <strong className="text-slate-700 dark:text-slate-300">Why this works:</strong> {item.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="p-6 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
              Immediate Placement Action Plan:
            </h4>
            <ul className="space-y-2">
              {result.action_plan.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-indigo-900 dark:text-indigo-300">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{idx + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

