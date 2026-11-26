"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Video,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminErrorState } from "@/components/admin/AdminErrorState";

interface InterviewRow {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: string;
  company_type: string;
  difficulty: string;
  round: string;
  status: string;
  mode: string;
  strikes: number;
  auto_submit_reason: string | null;
  overall_score: number | null;
  risk_level: "Low" | "Medium" | "High";
  risk_score: number;
  admin_reviewed: boolean;
  admin_review_verdict: string | null;
  started_at: string;
  is_admin_test?: boolean;
}

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [retrying, setRetrying] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roundFilter, setRoundFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [autoSubmitFilter, setAutoSubmitFilter] = useState("all");
  const [reviewedFilter, setReviewedFilter] = useState("all");
  const [adminTestFilter, setAdminTestFilter] = useState("all");

  const fetchInterviews = async () => {
    if (interviews.length === 0) setLoading(true);
    else setRetrying(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        round: roundFilter,
        risk: riskFilter,
      });
      if (search) params.set("q", search);
      if (autoSubmitFilter !== "all") params.set("auto_submitted", autoSubmitFilter);
      if (reviewedFilter !== "all") params.set("admin_reviewed", reviewedFilter);
      if (adminTestFilter !== "all") params.set("is_admin_test", adminTestFilter);

      const result = await adminFetch<{ interviews: InterviewRow[]; total: number; totalPages: number }>(
        `/api/admin/interviews?${params.toString()}`
      );
      if (result.error) {
        setError(result.error);
        setRequestId(result.requestId);
      } else if (result.data) {
        setInterviews(result.data.interviews || []);
        setTotal(result.data.total || 0);
        setTotalPages(result.data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load interviews");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [page, statusFilter, roundFilter, riskFilter, autoSubmitFilter, reviewedFilter, adminTestFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInterviews();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Interview Records</h1>
          <p className="text-sm text-slate-400">
            Audit proctored sessions, AI questions, candidate responses, strikes, and risk ratings.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Total Sessions: <span className="font-semibold text-white">{total}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate email or interview ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-3 items-center text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Round:</span>
            <select
              value={roundFilter}
              onChange={(e) => {
                setRoundFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All Rounds</option>
              <option value="dsa">DSA</option>
              <option value="hr">HR / Behavioral</option>
              <option value="cs_fundamentals">CS Fundamentals</option>
              <option value="system_design">System Design</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Auto-Submitted:</span>
            <select
              value={autoSubmitFilter}
              onChange={(e) => {
                setAutoSubmitFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Admin Review:</span>
            <select
              value={reviewedFilter}
              onChange={(e) => {
                setReviewedFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="true">Reviewed</option>
              <option value="false">Pending</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Admin Tests:</span>
            <select
              value={adminTestFilter}
              onChange={(e) => {
                setAdminTestFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All Sessions</option>
              <option value="false">Candidate Interviews</option>
              <option value="true">Admin Test Sessions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table or Error */}
      {error ? (
        <AdminErrorState
          title="Failed to Load Interviews"
          error={error}
          requestId={requestId}
          onRetry={fetchInterviews}
          isRetrying={retrying}
        />
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Candidate</th>
                <th className="p-4">Round</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Score</th>
                <th className="p-4">Integrity Risk</th>
                <th className="p-4">Status / Trigger</th>
                <th className="p-4">Review</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading interviews...
                  </td>
                </tr>
              ) : interviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No interviews match the selected filters.
                  </td>
                </tr>
              ) : (
                interviews.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{inv.user_name || "Anonymous Candidate"}</div>
                      <div className="text-slate-400 text-[11px]">{inv.user_email}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white uppercase">{inv.round}</span>
                        {inv.is_admin_test && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Admin Test
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-slate-400">{inv.role}</span>
                    </td>
                    <td className="p-4 capitalize text-slate-300">{inv.difficulty}</td>
                    <td className="p-4 font-semibold text-indigo-400">
                      {inv.overall_score !== null ? `${inv.overall_score}/100` : "—"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          inv.risk_level === "High"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : inv.risk_level === "Medium"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>{inv.risk_level} ({inv.risk_score})</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="capitalize text-slate-300 font-medium">{inv.status}</div>
                      {inv.auto_submit_reason && (
                        <div className="text-[10px] text-amber-400 truncate max-w-[150px]" title={inv.auto_submit_reason}>
                          {inv.auto_submit_reason}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {inv.admin_reviewed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="capitalize">{inv.admin_review_verdict || "Reviewed"}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/interviews/${inv.id}`}
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 inline-block transition-colors"
                        title="View Full Report & Review"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

