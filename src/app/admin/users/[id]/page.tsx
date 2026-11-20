"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Shield,
  Coins,
  Ban,
  Trash2,
  Send,
  Calendar,
  Video,
  CreditCard,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Credit adjustment state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditDelta, setCreditDelta] = useState(1);
  const [creditReason, setCreditReason] = useState("");
  const [creditError, setCreditError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Confirmation dialogs
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to load user details");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchUserData();
  }, [userId]);

  const handleAdjustCredits = async () => {
    if (!creditReason.trim() || creditReason.trim().length < 3) {
      setCreditError("A detailed reason is required (minimum 3 characters).");
      return;
    }

    setActionLoading(true);
    setCreditError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_credits",
          amount: creditDelta,
          reason: creditReason.trim(),
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to adjust credits");

      setShowCreditModal(false);
      setCreditReason("");
      setNotice(resData.message);
      fetchUserData();
    } catch (err: any) {
      setCreditError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!data?.profile) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_suspend",
          is_suspended: !data.profile.is_suspended,
          reason: `Admin toggled suspension`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update suspension");
      setShowSuspendConfirm(false);
      setNotice(resData.message);
      fetchUserData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_verification" }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to resend verification");
      setNotice("Verification link resent to user's email.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to delete user");
      setShowDeleteConfirm(false);
      router.push("/admin/users");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-900 rounded w-1/6"></div>
        <div className="h-44 bg-slate-900 border border-slate-800 rounded-xl"></div>
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl"></div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-base font-semibold text-white">User Not Found or Error Occurred</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Users
        </Link>
      </div>
    );
  }

  const { profile, auth, interviews, payments } = data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Users</span>
        </Link>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* User Header Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{profile.full_name || "Anonymous Candidate"}</h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    profile.role === "admin"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {profile.role || "user"}
                </span>
                {profile.is_suspended && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Suspended
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{profile.email}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
            <div>
              <span className="text-slate-500 block">Available Credits</span>
              <span className="text-base font-bold text-amber-400">{profile.credits}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Email Verified</span>
              <span className="font-semibold text-slate-300">
                {auth?.email_confirmed_at ? "Verified" : "Unconfirmed"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Target Role / Company</span>
              <span className="font-semibold text-slate-300">
                {profile.target_role || "SDE"} · {profile.target_company_type || "product"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Member Since</span>
              <span className="font-semibold text-slate-300">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap md:flex-col gap-2 justify-start md:justify-center">
          <button
            onClick={() => {
              setCreditDelta(1);
              setCreditReason("");
              setCreditError("");
              setShowCreditModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            <Coins className="w-4 h-4" />
            <span>Adjust Credits</span>
          </button>

          <button
            onClick={() => setShowSuspendConfirm(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              profile.is_suspended
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>{profile.is_suspended ? "Unsuspend Candidate" : "Suspend Candidate"}</span>
          </button>

          {!auth?.email_confirmed_at && (
            <button
              onClick={handleResendVerification}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Resend Verification</span>
            </button>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-950 text-rose-400 border border-rose-900/40 hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete User</span>
          </button>
        </div>
      </div>

      {/* Interviews History */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Interview History ({interviews?.length || 0})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Round</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Status</th>
                <th className="p-3">Score</th>
                <th className="p-3">Strikes</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {interviews?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No interviews found for this candidate.
                  </td>
                </tr>
              ) : (
                interviews.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-white uppercase">{inv.round}</td>
                    <td className="p-3 capitalize text-slate-300">{inv.difficulty}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-indigo-400">
                      {inv.overall_score !== null ? `${inv.overall_score}/100` : "—"}
                    </td>
                    <td className="p-3 text-slate-300">
                      {inv.strikes > 0 ? (
                        <span className="text-rose-400 font-semibold">{inv.strikes}</span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(inv.started_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/interviews/${inv.id}`}
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white inline-block"
                        title="View Interview Integrity & Transcript"
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
      </div>

      {/* Payments History */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-400" />
          <h2 className="text-base font-semibold text-white">Payment Orders ({payments?.length || 0})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Razorpay Order ID</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Credits Granted</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payments?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No payment transactions for this user.
                  </td>
                </tr>
              ) : (
                payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-slate-300">{p.razorpay_order_id}</td>
                    <td className="p-3 font-semibold text-white">₹{Math.round(p.amount / 100)}</td>
                    <td className="p-3 text-amber-400 font-semibold">+{p.credits_added}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === "paid"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Adjustment Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Adjust Credits</h3>
            <p className="text-xs text-slate-400">
              Candidate: <span className="text-white font-medium">{profile.email}</span> (Current:{" "}
              {profile.credits} credits)
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Credit Delta (+ to add, - to subtract)
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
                  placeholder="e.g. Compensation for verified platform timeout during interview"
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
                onClick={() => setShowCreditModal(false)}
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
        isOpen={showSuspendConfirm}
        title={profile.is_suspended ? "Unsuspend Candidate" : "Suspend Candidate"}
        message={
          profile.is_suspended
            ? `Are you sure you want to restore access for ${profile.email}?`
            : `Are you sure you want to suspend ${profile.email}? Suspended candidates cannot start new interviews.`
        }
        confirmText={profile.is_suspended ? "Unsuspend" : "Suspend Account"}
        isDestructive={!profile.is_suspended}
        onConfirm={handleToggleSuspend}
        onCancel={() => setShowSuspendConfirm(false)}
      />

      {/* Delete User Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Permanently Delete Candidate"
        message={`Are you sure you want to permanently delete ${profile.email}? This action cannot be undone and will delete all associated interview records and resumes.`}
        confirmText="Permanently Delete"
        isDestructive={true}
        onConfirm={handleDeleteUser}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

