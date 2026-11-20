"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Video,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Coins,
  Cpu,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { AdminStats } from "@/types";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            "Access denied or session unverified. If you are an administrator, your session may require 2-step verification (MFA/AAL2)."
          );
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-900 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl"></div>
          ))}
        </div>
        <div className="h-72 bg-slate-900 border border-slate-800 rounded-xl"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-base font-semibold text-white">Failed to Load Overview Data</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={fetchStats}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/admin/mfa"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            Verify 2-Step Login (MFA)
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Registered Users",
      value: stats.totalUsers,
      subtext: `+${stats.signups7d} past 7d · +${stats.signups30d} past 30d`,
      icon: Users,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
    {
      title: "Interviews Started",
      value: stats.interviewsStarted,
      subtext: `${stats.interviewsCompleted} completed (${stats.interviewsStarted ? Math.round((stats.interviewsCompleted / stats.interviewsStarted) * 100) : 0}% rate)`,
      icon: Video,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Auto-Submitted Interviews",
      value: stats.autoSubmittedCount,
      subtext: "Flagged by integrity rules or timeouts",
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Total Paid Revenue",
      value: `₹${stats.totalRevenueInr.toLocaleString()}`,
      subtext: "Razorpay settled payments",
      icon: IndianRupee,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      title: "Credits Balance",
      value: `${stats.creditsSold} sold`,
      subtext: `${stats.creditsUsed} credits used by candidates`,
      icon: Coins,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "AI Calls Today",
      value: stats.llmStats.todayCalls,
      subtext: `${Object.keys(stats.llmStats.providerCounts).length} active providers`,
      icon: Cpu,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Operations Dashboard</h1>
          <p className="text-sm text-slate-400">
            Real-time analytics, user trends, interview integrity, and multi-provider AI metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/integrity"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Integrity Queue</span>
          </Link>
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-xl bg-slate-900 border ${card.borderColor} shadow-sm space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
              <p className="text-xs text-slate-500">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Chart: Daily Activity */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Platform Activity (Last 14 Days)</h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Signups
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Interviews
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyChart}>
              <defs>
                <linearGradient id="signupsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="interviewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="signups"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#signupsGrad)"
                strokeWidth={2}
                name="Signups"
              />
              <Area
                type="monotone"
                dataKey="interviews"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#interviewsGrad)"
                strokeWidth={2}
                name="Interviews"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Telemetry & Provider Health Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">AI Provider Telemetry & Fallback Chain</h2>
          </div>
          <Link
            href="/admin/ai-settings"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Manage AI Settings</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.llmStats.configuredProviders.map((provider) => {
            const isPrimary = provider.name === stats.llmStats.primaryProvider;
            const isFallback = stats.llmStats.fallbackProviders.includes(provider.name);

            return (
              <div
                key={provider.name}
                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-white capitalize">{provider.name}</span>
                    {isPrimary && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        Primary
                      </span>
                    )}
                    {isFallback && !isPrimary && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Fallback
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      provider.configured
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {provider.configured ? "Configured" : "Unset"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 truncate" title={provider.model}>
                  Model: {provider.model || "—"}
                </p>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Calls: {provider.calls}</span>
                  {provider.inCooldown ? (
                    <span className="text-rose-400 font-semibold animate-pulse">
                      Cooldown ({provider.cooldownRemainingSec}s)
                    </span>
                  ) : (
                    <span className="text-slate-400">Errors: {provider.errors}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

