import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import {
  PlayCircle,
  FileText,
  BarChart3,
  Zap,
  ArrowRight,
  Clock,
  Award,
  ChevronRight,
  PlusCircle,
  CheckCircle,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { formatDate, getDifficultyBadgeColor, getRoleBadgeColor, getScoreColor } from "@/lib/utils";
import { PaymentStatusBanner } from "@/components/dashboard/PaymentStatusBanner";
import { DeleteInterviewButton } from "@/components/dashboard/DeleteInterviewButton";
import { BuyButton } from "@/components/BuyButton";
import { isAdminRole } from "@/lib/admin-permissions";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Enforce authentication: Dashboard only opens after signup or login!
  if (!user) {
    redirect("/login");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let interviews: any[] = [];
  let resumes: any[] = [];
  let payments: any[] = [];
  let currentCredits = user.credits ?? 0;

  if (supabaseUrl && !supabaseUrl.includes("mockmate-demo")) {
    try {
      const supabase = createAdminClient();
      const { data: dbInterviews } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });
      interviews = dbInterviews || [];

      const { data: dbResumes } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      resumes = dbResumes || [];

      const { data: dbPayments } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      payments = dbPayments || [];

      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      if (dbProfile?.credits !== undefined && dbProfile?.credits !== null) {
        currentCredits = dbProfile.credits;
      }
    } catch (dbErr) {
      console.warn("[DASHBOARD] Supabase fetch error, fallback to local store:", dbErr);
      interviews = appStore.getUserInterviews(user.id);
      resumes = appStore.getUserResumes(user.id);
      payments = appStore.getUserPayments(user.id);
      currentCredits = appStore.getProfile(user.id).credits;
    }
  } else {
    interviews = appStore.getUserInterviews(user.id);
    resumes = appStore.getUserResumes(user.id);
    payments = appStore.getUserPayments(user.id);
    currentCredits = appStore.getProfile(user.id).credits;
  }

  const profile = appStore.getProfile(user.id);

  // Stats calculation (excluding admin test sessions)
  const completedInterviews = interviews.filter(
    (i) => i.status === "completed" && i.overall_score && !i.is_admin_test
  );
  const avgScore = completedInterviews.length > 0
    ? Math.round(
        completedInterviews.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) /
          completedInterviews.length
      )
    : null;

  const candidateDisplayName = user.full_name || profile.full_name || "Candidate";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl shadow-indigo-600/10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Placement Readiness Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {candidateDisplayName}!
          </h1>
          <p className="text-indigo-100 text-sm max-w-xl">
            You are currently practicing for <span className="font-semibold text-white">SDE roles</span> at <span className="font-semibold text-white">product & service firms</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <div>
                <p className="text-[11px] text-indigo-200 uppercase tracking-wider font-medium">Credits</p>
                {isAdminRole(user.role) ? (
                  <p className="text-lg font-bold leading-none">Admin: unlimited</p>
                ) : (
                  <p className="text-lg font-bold leading-none">{currentCredits} Available</p>
                )}
              </div>
            </div>
            {!isAdminRole(user.role) && (
              <Link
                href="/pricing"
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-indigo-900 hover:bg-indigo-50 transition-colors shadow-sm"
              >
                Get More
              </Link>
            )}
          </div>

          <Link
            href="/interview/setup"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-white text-indigo-900 hover:bg-indigo-50 shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <PlayCircle className="w-4 h-4 text-indigo-600" />
            <span>Start New Interview</span>
          </Link>
        </div>
      </div>

      {/* Payment Success/Failure Notification Banner */}
      <PaymentStatusBanner />

      {/* 0 Credits Alert */}
      {currentCredits === 0 && !isAdminRole(user.role) && (
        <div className="p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                You have 0 interview credits remaining
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Practice upcoming campus placement rounds by adding credits starting at just ₹99.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0 self-start sm:self-auto"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Get Interview Credits (from ₹99) &rarr;</span>
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Interview Sessions</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Started {interviews.length} / Completed {completedInterviews.length}
          </p>
          <p className="text-xs text-slate-500">{interviews.length - completedInterviews.length} in-progress</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Average Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {avgScore !== null ? `${avgScore}/100` : "—"}
          </p>
          <p className="text-xs text-slate-500">
            {avgScore ? (avgScore >= 75 ? "Placement Ready 🚀" : "Keep practicing 🎯") : "Take 1st interview"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Saved Resumes</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {resumes.length}
          </p>
          <p className="text-xs text-slate-500">Ready for tailored interviews</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Progress Trend</span>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {completedInterviews.length > 0 ? "Tracking" : "Ready"}
          </p>
          <Link
            href="/progress"
            className="inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View Score Analytics &rarr;
          </Link>
        </div>
      </div>

      {/* Two Column Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Resume Tailor */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Target a Specific Campus Job Description
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Paste the job description from your college T&P cell (Training & Placement) or LinkedIn. Get missing ATS keywords, match scores, and rewritten bullet points.
            </p>
          </div>
          <Link
            href="/resume-tailor"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-3 transition-all"
          >
            Open Resume Tailor &rarr;
          </Link>
        </div>

        {/* Card 2: DSA Round Practice */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PlayCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Practice Coding & DSA Round
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Interactive Monaco editor with Judge0 test case evaluation. The AI interviewer critiques your algorithm approach, space-time complexity, and edge cases.
            </p>
          </div>
          <Link
            href="/interview/setup?round=dsa"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-3 transition-all"
          >
            Launch DSA Interview &rarr;
          </Link>
        </div>
      </div>

      {/* Past Interviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Recent Mock Interviews
            </h2>
            <p className="text-xs text-slate-500">
              Review your answers, AI questions, and structured feedback reports
            </p>
          </div>
          <Link
            href="/progress"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            See All & Analytics &rarr;
          </Link>
        </div>

        {interviews.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Welcome, {candidateDisplayName}! No interviews taken yet.
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {isAdminRole(user.role)
                  ? "Admin account: Unlimited interview credits active! Configure your target role and company to begin."
                  : `You have ${user.credits} free interview credit loaded! Configure your target role and company to begin your first session.`}
              </p>
            </div>
            <Link
              href="/interview/setup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              Start First Mock Interview
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {interviews.map((interview) => {
              const scoreColors = interview.overall_score
                ? getScoreColor(interview.overall_score)
                : null;

              return (
                <div
                  key={interview.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(interview.role)}`}>
                        {interview.role}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        {interview.company_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${getDifficultyBadgeColor(interview.difficulty)}`}>
                        {interview.difficulty}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {interview.round === "cs_fundamentals" ? "CS Fundamentals" : interview.round.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Started: {formatDate(interview.started_at)}</span>
                      <span>•</span>
                      <span>{interview.total_questions} Questions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {interview.status === "completed" && interview.overall_score !== null && interview.overall_score !== undefined && interview.overall_score > 0 ? (
                      <div className="text-right">
                        <span className={`text-xl font-extrabold ${scoreColors?.text}`}>
                          {interview.overall_score}
                        </span>
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg">
                        {interview.status === "in_progress" ? "In progress" : "Not completed"}
                      </span>
                    )}

                    <Link
                      href={
                        interview.status === "completed"
                          ? `/interview/${interview.id}/report`
                          : `/interview/${interview.id}`
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 transition-colors"
                    >
                      <span>{interview.status === "completed" ? "View Report" : "Resume"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    {interview.status !== "completed" && (
                      <DeleteInterviewButton interviewId={interview.id} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment & Credit Orders History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Payment History
            </h2>
          </div>
          {!isAdminRole(user.role) && (
            <Link
              href="/pricing"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Buy More Credits &rarr;
            </Link>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 space-y-2">
            <CreditCard className="w-8 h-8 mx-auto text-slate-400 stroke-1" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No payment transactions yet</p>
            <p>Every student starts with 1 free interview credit upon signup.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Pack & Credits</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Order Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {payments.map((p) => {
                    const status = p.status || "created";
                    const statusColor =
                      status === "paid"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-500/20"
                        : status === "failed"
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-500/20"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-500/20";

                    const packName =
                      p.pack === "pro" || p.credits_added >= 10
                        ? "Placement Pro (10 Mocks)"
                        : "Starter Pack (3 Mocks)";

                    const formattedAmount = p.amount ? `₹${p.amount / 100}` : "—";
                    const orderRef = p.order_id || p.razorpay_order_id || p.id;

                    return (
                      <tr key={p.id || orderRef} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-3.5 text-slate-500">{formatDate(p.created_at)}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                          {packName} <span className="text-[11px] font-normal text-slate-500">(+{p.credits_added} credits)</span>
                        </td>
                        <td className="px-6 py-3.5 font-extrabold text-slate-900 dark:text-white">{formattedAmount}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-[11px] text-slate-400">
                          {orderRef.slice(0, 16)}...
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
