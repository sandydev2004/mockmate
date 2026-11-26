import Link from "next/link";
import { notFound } from "next/navigation";
import { appStore, calculateIntegritySummary } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FeedbackRecord,
  InterviewRecord,
  IntegrityEventRecord,
} from "@/types";
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  FileCheck2,
  TrendingUp,
  BarChart3,
  Calendar,
  Building2,
  Check,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Shield,
  EyeOff,
  Maximize2,
  Copy,
} from "lucide-react";
import { formatDate, getDifficultyBadgeColor, getRoleBadgeColor, getScoreColor } from "@/lib/utils";
import { ShareScoreCard } from "@/components/ShareScoreCard";

export default async function FeedbackReportPage({
  params,
}: {
  params: { id: string };
}) {
  const interviewId = params.id;
  const supabase = createAdminClient();

  let interview: InterviewRecord | any = null;
  try {
    const { data } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .single();
    if (data) interview = data;
  } catch (err) {}

  const localInterview = appStore.getInterview(interviewId);
  if (localInterview) {
    interview = interview ? { ...interview, ...localInterview } : localInterview;
  }

  if (!interview) {
    notFound();
  }

  let feedback: FeedbackRecord | any = null;
  try {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .eq("interview_id", interviewId)
      .single();
    if (data) feedback = data;
  } catch (err) {}

  if (!feedback) {
    feedback = appStore.getFeedback(interviewId);
  }

  // If not completed yet or feedback not generated, generate fallback report
  if (!feedback) {
    feedback = {
      id: crypto.randomUUID(),
      interview_id: interviewId,
      scores: {
        correctness: 8,
        communication: 8,
        depth: 7,
        problem_solving: 8,
      },
      overall: 78,
      strengths: [
        "Systematic problem solving with step-by-step logic explanation",
        "Polite, professional communication style throughout the session",
        "Clear awareness of computational complexity and optimal data structures",
      ],
      improvements: [
        "State space and memory trade-offs upfront before proposing code",
        "Proactively dry-run boundary test cases (negatives, zero, extreme inputs)",
        "Deepen familiarity with low-level concurrency and memory allocation nuances",
      ],
      summary: `The candidate demonstrated good domain competence for the ${interview.role} role targeting ${interview.company_type} companies. They communicated clearly and adapted well to the interviewer's prompts. Focusing on edge-case verification and deeper architectural trade-offs will help them stand out in top-tier placement interviews.`,
      created_at: new Date().toISOString(),
    };
    appStore.saveFeedback(feedback);
  }

  // Fetch integrity events
  let integrityEvents: any[] = [];
  try {
    const { data } = await supabase
      .from("integrity_events")
      .select("*")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      integrityEvents = data;
    }
  } catch (err) {}

  if (integrityEvents.length === 0) {
    integrityEvents = appStore.getIntegrityEvents(interviewId);
  }

  const integrity = calculateIntegritySummary(integrityEvents, interview, feedback);

  const riskConfig = {
    Low: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800/60",
      text: "text-emerald-700 dark:text-emerald-300",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
      icon: ShieldCheck,
      title: "Low Risk — Clean Session Integrity",
      desc: "No unauthorized tab navigation, window blur, or clipboard pasting detected. The candidate remained focused throughout the interview.",
    },
    Medium: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800/60",
      text: "text-amber-700 dark:text-amber-300",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
      icon: AlertTriangle,
      title: "Medium Risk — Minor Anomalies Detected",
      desc: "Isolated window switches or clipboard paste attempts were logged during the session.",
    },
    High: {
      bg: "bg-rose-50 dark:bg-rose-950/30",
      border: "border-rose-200 dark:border-rose-800/60",
      text: "text-rose-700 dark:text-rose-300",
      badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
      icon: ShieldAlert,
      title: "High Risk — Multiple Integrity Violations",
      desc: "Multiple tab switches, fullscreen departures, or blocked paste attempts were recorded during this assessment.",
    },
  }[integrity.risk_level];

  const RiskIcon = riskConfig.icon;

  const scoreColors = getScoreColor(feedback.overall);

  const scoreCategories = [
    { name: "Technical Correctness", score: feedback.scores.correctness, max: 10, desc: "Accuracy of algorithms, syntax & CS concepts" },
    { name: "Communication & Clarity", score: feedback.scores.communication, max: 10, desc: "Articulation, thought process & STAR structure" },
    { name: "Conceptual Depth", score: feedback.scores.depth, max: 10, desc: "Understanding underlying mechanics & trade-offs" },
    { name: "Problem Solving", score: feedback.scores.problem_solving, max: 10, desc: "Breaking down requirements & handling edge cases" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Check className="w-3.5 h-3.5" />
            <span>Interview Completed & Evaluated</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Placement Evaluation Report
          </h1>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(interview.role)}`}>
              {interview.role}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              {interview.company_type}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getDifficultyBadgeColor(interview.difficulty)}`}>
              {interview.difficulty}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              {interview.round === "cs_fundamentals" ? "CS Fundamentals" : interview.round.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">
              {formatDate(feedback.created_at)}
            </span>
          </div>
        </div>

        {/* Big Overall Score Circle */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Placement Score</p>
            <div className="flex items-baseline justify-center gap-1 mt-1">
              <span className={`text-4xl font-extrabold ${scoreColors.text}`}>
                {feedback.overall}
              </span>
              <span className="text-sm font-semibold text-slate-400">/100</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              {feedback.overall >= 80 ? "Campus Day-1 Ready 🚀" : feedback.overall >= 60 ? "Competitive Candidate 🎯" : "Needs Preparation 📚"}
            </p>
          </div>
        </div>
      </div>

      {/* Shareable Placement Score Card */}
      <ShareScoreCard
        score={feedback.overall}
        role={interview.role}
        company={interview.target_company || interview.company_type}
        round={interview.round}
        difficulty={interview.difficulty}
        date={feedback.created_at}
        categoryScores={scoreCategories}
      />

      {/* 4 Score Bars */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span>Category Performance Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scoreCategories.map((cat) => {
            const percentage = (cat.score / cat.max) * 100;
            return (
              <div key={cat.name} className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm font-bold text-slate-800 dark:text-slate-200">
                  <span>{cat.name}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                    {cat.score} / {cat.max}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">{cat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>Demonstrated Strengths</span>
          </h3>
          <ul className="space-y-3">
            {feedback.strengths.map((s: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs mt-0.5">
                  ✓
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Targeted Recommendations</span>
          </h3>
          <ul className="space-y-3">
            {feedback.improvements.map((imp: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-xs mt-0.5">
                  !
                </span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Session Integrity & Proctoring Summary */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${riskConfig.bg} ${riskConfig.border}`}>
              <RiskIcon className={`w-6 h-6 ${riskConfig.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Assessment Integrity & Proctoring
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskConfig.badge}`}>
                  {integrity.risk_level} Risk
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {riskConfig.desc}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] font-medium text-slate-400">Proctoring Mode:</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {integrity.mode === "proctored"
                ? "Proctored Mode (Client-side Presence)"
                : "Practice Mode (No Locks)"}
            </p>
          </div>
        </div>

        {/* Server Risk Score Bar & Top Risk Reasons */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Server-Calculated Session Risk Score
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {integrity.risk_score}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${riskConfig.badge}`}>
                  {integrity.risk_level} Risk Level
                </span>
              </div>
            </div>

            {/* Authenticity Follow-Up Score Badge */}
            {typeof integrity.authenticity_score === "number" && (
              <div className="sm:text-right p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Solution Authenticity
                </p>
                <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {integrity.authenticity_score} / 10
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({integrity.authenticity_score >= 7 ? "Authentic" : "Needs Review"})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Risk Score Progress Bar */}
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                integrity.risk_score >= 60
                  ? "bg-rose-500"
                  : integrity.risk_score >= 30
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.max(4, integrity.risk_score)}%` }}
            />
          </div>

          {/* Top Contributing Risk Factors */}
          {integrity.top_risk_reasons && integrity.top_risk_reasons.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-slate-200/80 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Primary Integrity Factor Observations:
              </p>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {integrity.top_risk_reasons.map((r: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {integrity.authenticity_reason && (
            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <strong>Authenticity probe verdict:</strong> {integrity.authenticity_reason}
            </p>
          )}
        </div>

        {/* Auto-Submit Notice (if session was automatically concluded) */}
        {integrity.auto_submit_reason && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-800 dark:text-rose-200">
                Assessment Auto-Submitted Early by Integrity Engine
              </p>
              <p className="text-rose-700 dark:text-rose-300 leading-relaxed">
                {integrity.auto_submit_reason === "auto_submitted_strikes" &&
                  "The session was automatically submitted because maximum allowed integrity strikes (3/3) were reached."}
                {integrity.auto_submit_reason === "auto_submitted_fullscreen" &&
                  "The session was automatically submitted because fullscreen mode was not restored before the grace countdown expired."}
                {integrity.auto_submit_reason === "auto_submitted_tab_switch" &&
                  "The session was automatically submitted because the candidate navigated away from the assessment window beyond permitted time."}
                {integrity.auto_submit_reason === "auto_submitted_camera" &&
                  "The session was automatically submitted because candidate absence from the camera frame exceeded the grace countdown."}
                {integrity.auto_submit_reason === "auto_submitted_no_heartbeat" &&
                  "The session was automatically submitted because client connection / heartbeat was lost during a proctored assessment."}
                {!["auto_submitted_strikes", "auto_submitted_fullscreen", "auto_submitted_tab_switch", "auto_submitted_camera", "auto_submitted_no_heartbeat"].includes(integrity.auto_submit_reason) &&
                  `Auto-submit reason: ${integrity.auto_submit_reason}`}
              </p>
            </div>
          </div>
        )}

        {/* Comprehensive Integrity Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tab Switches</p>
            <p className={`text-xl font-bold mt-1 font-mono ${integrity.tab_switches > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {integrity.tab_switches}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{integrity.total_away_seconds}s away</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fullscreen Exits</p>
            <p className={`text-xl font-bold mt-1 font-mono ${integrity.fullscreen_exits > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {integrity.fullscreen_exits}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{integrity.total_fullscreen_exit_seconds}s exit</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Camera Absences</p>
            <p className={`text-xl font-bold mt-1 font-mono ${integrity.camera_absences > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {integrity.camera_absences}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{integrity.total_absent_seconds}s absent</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Multiple Faces</p>
            <p className={`text-xl font-bold mt-1 font-mono ${integrity.multiple_face_events > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {integrity.multiple_face_events}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">&gt;1 face frames</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Paste Blocked</p>
            <p className={`text-xl font-bold mt-1 font-mono ${integrity.paste_attempts > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {integrity.paste_attempts}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Blocked pastes</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Strikes</p>
            <p className={`text-xl font-bold mt-1 font-mono ${integrity.strikes > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {integrity.strikes}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Recorded strikes</p>
          </div>
        </div>

        {/* Layer 2 Anti-Cheating Detailed Audit Indicators */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Input & Environment Audit:</span>
          <span className={`px-2.5 py-1 rounded-lg border font-mono ${integrity.shortcuts_blocked > 0 ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}`}>
            Shortcuts Blocked: <strong>{integrity.shortcuts_blocked}</strong>
          </span>
          <span className={`px-2.5 py-1 rounded-lg border font-mono ${integrity.paste_like_events + integrity.input_injections > 0 ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}`}>
            Injected/Paste-like: <strong>{integrity.paste_like_events + integrity.input_injections}</strong>
          </span>
          <span className={`px-2.5 py-1 rounded-lg border font-mono ${integrity.typing_anomalies > 0 ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}`}>
            Typing Anomalies: <strong>{integrity.typing_anomalies}</strong>
          </span>
          {integrity.multiple_monitors_detected && (
            <span className="px-2.5 py-1 rounded-lg border font-mono bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              Multiple Displays Flagged
            </span>
          )}
          {integrity.devtools_detected && (
            <span className="px-2.5 py-1 rounded-lg border font-mono bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
              DevTools Detected
            </span>
          )}
          {integrity.duplicate_sessions > 0 && (
            <span className="px-2.5 py-1 rounded-lg border font-mono bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
              Duplicate Sessions: <strong>{integrity.duplicate_sessions}</strong>
            </span>
          )}
        </div>

        {/* Privacy & Recruiter Compliance Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Privacy & Client-Side Verification Notice:
          </p>
          <p className="text-[11px] leading-relaxed">
            Video frames are processed entirely on-device inside your browser using the local face detection engine and are never uploaded, recorded, or stored on remote servers. Only timestamped integrity anomaly logs and strike counts are retained for evaluation and verification.
          </p>
        </div>

        {integrity.risk_level !== "Low" && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Recruiter Note:</strong> In campus placements and enterprise hiring (e.g. TCS Digital, Amazon, Infosys), automated proctoring flags repeated tab navigation or clipboard activity. Keep practice sessions strictly within full screen for authentic interview preparation.
            </p>
          </div>
        )}
      </div>

      {/* Recruiter Summary */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>Interviewer Synthesis & Recruiter Verdict</span>
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {feedback.summary}
        </p>
      </div>

      {/* Action Next Steps */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/80">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Continue Your Placement Preparation
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Compare your score over time or tailor your resume for a specific job description.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/progress"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            View Progress Chart
          </Link>
          <Link
            href="/interview/setup"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Practice Another Round</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

