"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Terminal,
  AlertCircle,
} from "lucide-react";
import { AuditLogRecord } from "@/types";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("q", search);
      if (actionFilter) params.set("action", actionFilter);
      if (targetFilter) params.set("target_type", targetFilter);

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Access denied or session unverified. Ensure your account has admin privileges and complete 2-step verification.");
        }
        throw new Error(`Failed to load audit logs (HTTP ${res.status})`);
      }
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, targetFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Administrative Audit Trail</h1>
          <p className="text-sm text-slate-400">
            Immutable log of all administrator actions, credit adjustments, sensitive data accesses, and policy changes.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Total Logged Events: <span className="font-semibold text-white">{total}</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by admin email, action name, or target ID..."
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Target:</span>
            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="">All Targets</option>
              <option value="user">User</option>
              <option value="interview">Interview</option>
              <option value="payment">Payment</option>
              <option value="setting">Setting</option>
              <option value="problem">DSA Problem</option>
              <option value="export">Data Export</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table or Error */}
      {error ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-semibold text-white">Failed to Load Audit Trail</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchLogs}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/admin/mfa"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Verify 2-Step Login (MFA)
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Loading audit trail...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No audit records match the filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 font-medium text-white">{log.admin_email}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.action.includes("deleted") || log.action.includes("suspended")
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : log.action.includes("sensitive")
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : log.action.includes("credit")
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 font-mono text-[11px]">
                          <span className="text-slate-500 capitalize">{log.target_type}:</span>{" "}
                          {log.target_id ? log.target_id.slice(0, 16) : "system"}
                        </td>
                        <td className="p-4 font-mono text-slate-400 text-[11px]">
                          {log.ip_address || "127.0.0.1"}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
                          >
                            {isExpanded ? "Hide Details" : "View JSON"}
                          </button>

                          {isExpanded && log.details && (
                            <div className="text-left mt-2 p-3 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-w-sm ml-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
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

