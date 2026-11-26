"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  PlusCircle,
  MinusCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminErrorState } from "@/components/admin/AdminErrorState";

interface UserItem {
  id: string;
  email: string;
  full_name: string | null;
  credits: number;
  role: "user" | "admin";
  is_suspended: boolean;
  target_role: string | null;
  target_company_type: string | null;
  interviews_count: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [retrying, setRetrying] = useState(false);

  // Credit adjustment modal state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [creditDelta, setCreditDelta] = useState<number>(1);
  const [creditReason, setCreditReason] = useState("");
  const [creditError, setCreditError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Suspend confirm modal state
  const [suspendUserTarget, setSuspendUserTarget] = useState<UserItem | null>(null);

  const fetchUsers = async () => {
    if (users.length === 0) setLoading(true);
    else setRetrying(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        role: roleFilter,
      });
      if (search) params.set("q", search);

      const result = await adminFetch<{ users: UserItem[]; total: number; totalPages: number }>(
        `/api/admin/users?${params.toString()}`
      );
      if (result.error) {
        setError(result.error);
        setRequestId(result.requestId);
      } else if (result.data) {
        setUsers(result.data.users || []);
        setTotal(result.data.total || 0);
        setTotalPages(result.data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser) return;
    if (!creditReason.trim() || creditReason.trim().length < 3) {
      setCreditError("A detailed reason is required (at least 3 characters).");
      return;
    }

    setActionLoading(true);
    setCreditError("");
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_credits",
          amount: creditDelta,
          reason: creditReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust credits");
      }

      setSelectedUser(null);
      setCreditReason("");
      fetchUsers();
    } catch (err: any) {
      setCreditError(err.message || "Failed to adjust credits");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!suspendUserTarget) return;
    try {
      const res = await fetch(`/api/admin/users/${suspendUserTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_suspend",
          is_suspended: !suspendUserTarget.is_suspended,
          reason: `Admin toggled suspension to ${!suspendUserTarget.is_suspended}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle suspension");
      setSuspendUserTarget(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Users & Credits</h1>
          <p className="text-sm text-slate-400">
            Manage candidate accounts, credit quotas, suspension states, and interview histories.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Total Users: <span className="font-semibold text-white">{total}</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table or Error State */}
      {error ? (
        <AdminErrorState
          title="Failed to Load Candidate Accounts"
          error={error}
          requestId={requestId}
          onRetry={fetchUsers}
          isRetrying={retrying}
        />
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Candidate</th>
                <th className="p-4">Role</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Interviews</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No users match the criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{u.full_name || "Anonymous Candidate"}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-amber-400">{u.credits}</span>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setCreditDelta(1);
                            setCreditReason("");
                            setCreditError("");
                          }}
                          className="text-[11px] text-slate-400 hover:text-indigo-400 underline"
                          title="Adjust Credits"
                        >
                          Modify
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{u.interviews_count}</td>
                    <td className="p-4">
                      {u.is_suspended ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSuspendUserTarget(u)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${
                            u.is_suspended
                              ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                          }`}
                          title={u.is_suspended ? "Unsuspend User" : "Suspend User"}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/admin/users/${u.id}`}
                          className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          title="View Full Profile & Interviews"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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

      {/* Credit Adjustment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Adjust Credits</h3>
            <p className="text-xs text-slate-400">
              Candidate: <span className="text-white font-medium">{selectedUser.email}</span> (Current:{" "}
              {selectedUser.credits} credits)
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Credit Delta (+ to grant, - to deduct)
                </label>
                <input
                  type="number"
                  value={creditDelta}
                  onChange={(e) => setCreditDelta(parseInt(e.target.value || "0", 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Required Reason for Audit Log <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Compensated for network glitch during interview #3819"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              {creditError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{creditError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleAdjustCredits}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!suspendUserTarget}
        title={suspendUserTarget?.is_suspended ? "Unsuspend Candidate" : "Suspend Candidate"}
        message={
          suspendUserTarget?.is_suspended
            ? `Are you sure you want to restore access for ${suspendUserTarget?.email}? They will be able to start interviews again.`
            : `Are you sure you want to suspend ${suspendUserTarget?.email}? Suspended candidates are strictly blocked from starting interviews.`
        }
        confirmText={suspendUserTarget?.is_suspended ? "Unsuspend" : "Suspend Account"}
        isDestructive={!suspendUserTarget?.is_suspended}
        onConfirm={handleToggleSuspend}
        onCancel={() => setSuspendUserTarget(null)}
      />
    </div>
  );
}

