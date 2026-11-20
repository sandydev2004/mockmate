"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  PlusCircle,
  Coins,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface PaymentRow {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  amount_inr: number;
  credits_added: number;
  status: "paid" | "failed" | "created";
  created_at: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual grant modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [grantCredits, setGrantCredits] = useState<number>(5);
  const [grantReason, setGrantReason] = useState("");
  const [grantError, setGrantError] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Access denied or session unverified. Ensure your account has admin privileges and complete 2-step verification.");
        }
        throw new Error(`Failed to load payments (HTTP ${res.status})`);
      }
      const data = await res.json();
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const handleManualGrant = async () => {
    if (!selectedPayment) return;
    if (!grantReason.trim() || grantReason.trim().length < 5) {
      setGrantError("A detailed reason is required (minimum 5 characters).");
      return;
    }

    setGrantLoading(true);
    setGrantError("");
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: selectedPayment.id,
          credits_to_add: grantCredits,
          reason: grantReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grant credits");

      setSelectedPayment(null);
      setGrantReason("");
      setNotice(data.message);
      fetchPayments();
    } catch (err: any) {
      setGrantError(err.message);
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Payments & Billing</h1>
          <p className="text-sm text-slate-400">
            Audit Razorpay orders, revenue settlements, and manually grant credits for verified bank/gateway failures.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Total Transactions: <span className="font-semibold text-white">{total}</span>
        </div>
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

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All Transactions</option>
            <option value="paid">Paid / Settled</option>
            <option value="failed">Failed / Dropped</option>
            <option value="created">Pending / Created</option>
          </select>
        </div>
      </div>

      {/* Table or Error */}
      {error ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-semibold text-white">Failed to Load Payments</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchPayments}
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
                <th className="p-4">Candidate</th>
                <th className="p-4">Razorpay Order ID</th>
                <th className="p-4">Payment ID</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Credits</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{p.user_name}</div>
                      <div className="text-slate-400 text-[11px]">{p.user_email}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">{p.razorpay_order_id}</td>
                    <td className="p-4 font-mono text-slate-400">
                      {p.razorpay_payment_id || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="p-4 font-bold text-white">₹{p.amount_inr}</td>
                    <td className="p-4 font-semibold text-amber-400">+{p.credits_added}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.status === "paid"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : p.status === "failed"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      {p.status !== "paid" ? (
                        <button
                          onClick={() => {
                            setSelectedPayment(p);
                            setGrantCredits(p.credits_added || 5);
                            setGrantReason("");
                            setGrantError("");
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                        >
                          Manual Grant
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Settled</span>
                      )}
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

      {/* Manual Grant Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-white">Manual Credit Grant</h3>
            <p className="text-xs text-slate-400">
              Order: <span className="text-white font-mono">{selectedPayment.razorpay_order_id}</span>
              <br />
              Candidate: <span className="text-white font-medium">{selectedPayment.user_email}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Credits to Fulfill
                </label>
                <input
                  type="number"
                  min="1"
                  value={grantCredits}
                  onChange={(e) => setGrantCredits(parseInt(e.target.value || "1", 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason / Verification Reference <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Bank statement verified; UPI reference #98127391 paid successfully but Razorpay webhook timed out."
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              {grantError && (
                <div className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{grantError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={grantLoading}
                onClick={handleManualGrant}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              >
                {grantLoading ? "Granting..." : "Fulfill Credits & Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

