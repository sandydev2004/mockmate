"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Video,
} from "lucide-react";

export default function AdminIntegrityQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrity");
      if (!res.ok) throw new Error("Failed to load integrity review queue");
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (err: any) {
      setError(err.message || "Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleQuickVerdict = async (interviewId: string, verdict: "approved" | "flagged") => {
    setActionId(interviewId);
    try {
      const res = await fetch(`/api/admin/interviews/${interviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          verdict,
          notes: `Quick review verdict from integrity queue: ${verdict}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit verdict");
      // Remove from queue
      setQueue((prev) => prev.filter((item) => item.id !== interviewId));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Integrity Review Queue</h1>
          <p className="text-sm text-slate-400">
            Sessions with High / Medium integrity risk or triggered auto-submits awaiting review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg font-semibold">
            {queue.length} Pending Actions
          </span>
          <button
            onClick={fetchQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-900 border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h2 className="text-base font-semibold text-white">Queue is Clear</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All flagged or high-risk candidate interviews have been reviewed and approved.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.risk_level === "High"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {item.risk_level} Risk ({item.risk_score})
                  </span>
                  <span className="font-semibold text-white uppercase text-xs">{item.round}</span>
                  <span className="text-xs text-slate-400 font-medium">· {item.user_email}</span>
                </div>

                {item.auto_submit_reason && (
                  <p className="text-xs text-amber-300">
                    <strong>Auto-Submit Reason:</strong> {item.auto_submit_reason}
                  </p>
                )}

                {item.top_risk_reasons && item.top_risk_reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-400">
                    {item.top_risk_reasons.map((r: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-[11px] text-slate-500">
                  Started: {new Date(item.started_at).toLocaleString()} · Strikes: {item.strikes}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/admin/interviews/${item.id}`}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Session</span>
                </Link>

                <button
                  disabled={actionId === item.id}
                  onClick={() => handleQuickVerdict(item.id, "approved")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>

                <button
                  disabled={actionId === item.id}
                  onClick={() => handleQuickVerdict(item.id, "flagged")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Flag</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

