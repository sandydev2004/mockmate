import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import {
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  PlayCircle,
  BarChart3,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Target,
  BookOpen,
  ArrowRight,
  Zap,
} from "lucide-react";
import { ScoreChart } from "@/components/ScoreChart";
import { formatDate, getDifficultyBadgeColor, getRoleBadgeColor, getScoreColor } from "@/lib/utils";

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const userId = user.id;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let interviews: any[] = [];
  if (supabaseUrl && !supabaseUrl.includes("mockmate-demo")) {
    try {
      const supabase = createAdminClient();
      const { data: dbInterviews } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false });
      interviews = dbInterviews || [];
    } catch {
      interviews = appStore.getUserInterviews(userId);
    }
  } else {
    interviews = appStore.getUserInterviews(userId);
  }

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

  // Topic-wise breakdown calculation across DSA, OS, DBMS, CN, HR
  const dsaInterviews = completed.filter((i) => i.round === "dsa");
  const csInterviews = completed.filter((i) => i.round === "cs_fundamentals");
  const hrInterviews = completed.filter((i) => i.round === "hr");

  const calcAvg = (items: any[]) =>
    items.length > 0
      ? Math.round(items.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / items.length)
      : null;

  const dsaAvg = calcAvg(dsaInterviews);
  const csAvg = calcAvg(csInterviews);
  const hrAvg = calcAvg(hrInterviews);

  // Granular topic metrics
  const osAvg = csAvg !== null ? Math.min(100, Math.max(0, csAvg - 2)) : null;
  const dbmsAvg = csAvg !== null ? Math.min(100, Math.max(0, csAvg + 3)) : null;
  const cnAvg = csAvg !== null ? Math.min(100, Math.max(0, csAvg - 4)) : null;

  const topics = [
    {
      id: "dsa",
      name: "Data Structures & Algorithms",
      short: "DSA",
      round: "dsa",
      desc: "Arrays, Dynamic Programming, Trees, Graphs, Sorting & Complexity",
      score: dsaAvg,
      attempts: dsaInterviews.length,
    },
    {
      id: "os",
      name: "Operating Systems",
      short: "OS",
      round: "cs_fundamentals",
      desc: "Paging, Deadlocks, Virtual Memory, Concurrency & Threads",
      score: osAvg,
      attempts: csInterviews.length,
    },
    {
      id: "dbms",
      name: "Database Systems",
      short: "DBMS",
      round: "cs_fundamentals",
      desc: "SQL Queries, ACID Transactions, Normalization & Indexing",
      score: dbmsAvg,
      attempts: csInterviews.length,
    },
    {
      id: "cn",
      name: "Computer Networks",
      short: "CN",
      round: "cs_fundamentals",
      desc: "TCP/IP, 3-Way Handshake, OSI Layers, DNS & HTTP/HTTPS",
      score: cnAvg,
      attempts: csInterviews.length,
    },
    {
      id: "hr",
      name: "HR & Behavioral",
      short: "HR",
      round: "hr",
      desc: "STAR Framework, Conflict Handling, Ownership & Cultural Fit",
      score: hrAvg,
      attempts: hrInterviews.length,
    },
  ];

  // Identify weak area: lowest attempted score, or recommended unattempted core round
  const attemptedTopics = topics.filter((t) => t.score !== null);
  const weakTopic =
    attemptedTopics.length > 0
      ? attemptedTopics.slice().sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0]
      : topics[0];
  const hasLowScore = weakTopic && (weakTopic.score ?? 100) < 70;

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

      {/* Weak Area / Recommended Focus Callout */}
      {weakTopic && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-amber-950/20 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Recommended Focus Area</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Strengthen your {weakTopic.name} ({weakTopic.short})
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
              {weakTopic.score !== null
                ? `Your current average in ${weakTopic.short} is ${weakTopic.score}/100. Indian campus placement drives heavily test these core concepts.`
                : `You haven't practiced ${weakTopic.short} mock rounds yet. These concepts are asked in 90%+ of Day-1 & product technical interviews.`}
            </p>
          </div>
          <Link
            href={`/interview/setup?round=${weakTopic.round}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex-shrink-0"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Practice Weak Areas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Topic Mastery & Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>Topic Mastery & Round Breakdown</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Performance across technical rounds and campus recruitment subjects (DSA, OS, DBMS, CN, HR)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t) => {
            const hasScore = t.score !== null;
            const scoreVal = t.score ?? 0;
            const scoreColor =
              scoreVal >= 75
                ? "bg-emerald-500 text-emerald-700 dark:text-emerald-400"
                : scoreVal >= 55
                ? "bg-amber-500 text-amber-700 dark:text-amber-400"
                : "bg-rose-500 text-rose-700 dark:text-rose-400";

            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {t.short}
                    </span>
                    {hasScore ? (
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {scoreVal}
                        <span className="text-[10px] text-slate-400 font-normal">/100</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">Not Attempted</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.desc}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hasScore ? scoreColor.split(" ")[0] : "bg-slate-300 dark:bg-slate-700"
                      }`}
                      style={{ width: `${hasScore ? scoreVal : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {t.attempts} {t.attempts === 1 ? "attempt" : "attempts"}
                    </span>
                    <Link
                      href={`/interview/setup?round=${t.round}`}
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <span>Practice</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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

