import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import {
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  PlayCircle,
  BarChart3,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { ScoreChart } from "@/components/ScoreChart";
import { formatDate, getDifficultyBadgeColor, getRoleBadgeColor, getScoreColor } from "@/lib/utils";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  const userId = user?.id || "demo-user-123";
  const interviews = appStore.getUserInterviews(userId);

  // Scored interviews sorted by date ascending for line chart
  const completed = interviews
    .filter((i) => i.status === "completed" && i.overall_score)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  const chartData = completed.map((i, idx) => {
    const d = new Date(i.started_at);
    return {
      date: `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`,
      score: i.overall_score || 0,
      label: `${i.role} (${i.round.toUpperCase()})`,
    };
  });

  const scores = completed.map((i) => i.overall_score || 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;
  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          <span>Placement Performance Trajectory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Your Placement Readiness Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track your mock interview score improvement over time across DSA, CS Fundamentals, System Design, and HR rounds.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs text-slate-500 font-medium">Interviews Completed</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {completed.length}
          </p>
          <p className="text-xs text-slate-500">Across all rounds</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs text-slate-500 font-medium">Average Score</span>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {avgScore !== null ? `${avgScore}` : "—"}
            <span className="text-xs text-slate-400 font-normal">/100</span>
          </p>
          <p className="text-xs text-slate-500">Target: 75+ for Day-1 firms</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs text-slate-500 font-medium">Peak Performance</span>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {maxScore !== null ? `${maxScore}` : "—"}
            <span className="text-xs text-slate-400 font-normal">/100</span>
          </p>
          <p className="text-xs text-slate-500">Highest interview mark</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs text-slate-500 font-medium">Latest Score</span>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {latestScore !== null ? `${latestScore}` : "—"}
            <span className="text-xs text-slate-400 font-normal">/100</span>
          </p>
          <p className="text-xs text-slate-500">Most recent session</p>
        </div>
      </div>

      {/* Recharts Line Chart */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Score Trajectory Over Time</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizes placement readiness improvement session by session
            </p>
          </div>
          <Link
            href="/interview/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Practice Next</span>
          </Link>
        </div>

        <ScoreChart data={chartData} />
      </div>

      {/* History Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Full Mock Interview History
        </h2>

        {interviews.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-500">
            No interviews taken yet.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Role & Round</th>
                    <th className="px-6 py-4">Company Style</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Started</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {interviews.map((item) => {
                    const scoreColors = item.overall_score ? getScoreColor(item.overall_score) : null;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadgeColor(item.role)}`}>
                              {item.role}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {item.round === "cs_fundamentals" ? "CS Fundamentals" : item.round.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 uppercase text-[11px] text-slate-600 dark:text-slate-400">
                          {item.company_type}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getDifficultyBadgeColor(item.difficulty)}`}>
                            {item.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDate(item.started_at)}
                        </td>
                        <td className="px-6 py-4">
                          {item.overall_score !== null && item.overall_score !== undefined ? (
                            <span className={`font-extrabold text-sm ${scoreColors?.text}`}>
                              {item.overall_score}/100
                            </span>
                          ) : (
                            <span className="text-amber-500 font-medium text-[11px]">In Progress</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={
                              item.status === "completed"
                                ? `/interview/${item.id}/report`
                                : `/interview/${item.id}`
                            }
                            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            <span>{item.status === "completed" ? "Report" : "Resume"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
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
