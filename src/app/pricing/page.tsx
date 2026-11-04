"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Check,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load current user credits
  useEffect(() => {
    fetch("/api/auth/demo")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCredits(data.user.credits);
      })
      .catch(() => {});
  }, []);

  const handleBuyPack = async (packId: "pack_3" | "pack_10") => {
    setLoadingPack(packId);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Create Razorpay order on server
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: packId }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // Check if window.Razorpay SDK is loaded
      const RazorpaySDK = (window as any).Razorpay;

      if (RazorpaySDK && !orderData.key_id.includes("mockmate123456")) {
        // Open live Razorpay standard checkout
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "MockMate Placement AI",
          description: orderData.pack_title,
          order_id: orderData.order_id,
          handler: async function (response: any) {
            // 2. Verify payment signature on server
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          prefill: {
            name: "College Placement Candidate",
            email: "student@placement.edu.in",
            contact: "9999999999",
          },
          theme: {
            color: "#4f46e5",
          },
        };

        const rzp = new RazorpaySDK(options);
        rzp.open();
      } else {
        // Test mode / simulator checkout: immediately verifies with mock payment ID
        console.log("[PAYMENT] Simulating test payment confirmation for order:", orderData.order_id);
        const mockPaymentId = `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
        const mockSignature = `sig_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

        await verifyPayment({
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPack(null);
    }
  };

  const verifyPayment = async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment signature verification failed");
      }

      setCredits(data.current_credits);
      setSuccessMessage(
        `🎉 Payment successful! Added ${data.credits_added} interview credits to your account. Total balance: ${data.current_credits} credits.`
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-10">
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Transparent Student Pricing in INR (₹)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Invest in Your Dream Placement Offer
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          One interview credit grants one full 6-8 question AI mock interview with code execution and structured feedback report. No recurring subscriptions.
        </p>

        {credits !== null && (
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Current Account Balance: {credits} Interview Credits</span>
            </span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-sm flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-semibold">{successMessage}</p>
          </div>
          <Link
            href="/interview/setup"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shrink-0 hover:bg-emerald-700"
          >
            Start Interview &rarr;
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Free Plan */}
        <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Free Trial</h3>
            <p className="text-xs text-slate-500 mt-1">Free for every registered candidate</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹0</span>
              <span className="text-xs text-slate-500">/ 1 credit</span>
            </div>
            <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>1 Full mock interview credit</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Access to any round (DSA, CS, HR)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Detailed feedback report with scores</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Speech-to-text voice input</span>
              </li>
            </ul>
          </div>

          <Link
            href="/interview/setup"
            className="mt-8 block text-center py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
          >
            Claim Free Interview
          </Link>
        </div>

        {/* Starter Pack: 3 interviews for Rs 99 */}
        <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Starter Pack</h3>
            <p className="text-xs text-slate-500 mt-1">3 Full Mock Interviews</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹99</span>
              <span className="text-xs text-slate-500 font-semibold">(₹33 / session)</span>
            </div>
            <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span><strong>3 Interview credits</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Monaco Code Editor + Judge0 CE</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Resume-aware question generator</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>ATS Resume Matcher & Rewriter</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Instant activation via Razorpay</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleBuyPack("pack_3")}
            disabled={loadingPack !== null}
            className="mt-8 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors disabled:opacity-50"
          >
            {loadingPack === "pack_3" ? "Processing..." : "Buy 3 Pack (₹99)"}
          </button>
        </div>

        {/* Placement Pro: 10 interviews for Rs 249 */}
        <div className="relative p-7 rounded-2xl bg-gradient-to-b from-indigo-50/80 to-white dark:from-slate-900 dark:to-slate-900 border-2 border-indigo-500 flex flex-col justify-between shadow-xl shadow-indigo-500/10">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-wider">
            Best Value (Save 25%)
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Placement Pro Pack</h3>
            <p className="text-xs text-slate-500 mt-1">10 Full Mock Interviews</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹249</span>
              <span className="text-xs text-slate-500 font-semibold">(₹24.9 / session)</span>
            </div>
            <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span><strong>10 Interview credits</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Unlimited ATS resume tailor queries</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Progress analytics & Recharts score graph</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Covers TCS, Infosys, Amazon & Startups</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Priority support for placement season</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleBuyPack("pack_10")}
            disabled={loadingPack !== null}
            className="mt-8 w-full py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {loadingPack === "pack_10" ? "Processing..." : "Buy 10 Pack (₹249)"}
          </button>
        </div>
      </div>

      {/* Trust & Security Badge */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            Secure 256-bit encrypted checkout powered by <strong>Razorpay (INR)</strong>. Supports UPI (Google Pay, PhonePe, Paytm), NetBanking, and all major Indian Cards.
          </span>
        </div>
        <div className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          <span>UPI</span>
          <span>•</span>
          <span>Cards</span>
          <span>•</span>
          <span>NetBanking</span>
        </div>
      </div>
    </div>
  );
}
