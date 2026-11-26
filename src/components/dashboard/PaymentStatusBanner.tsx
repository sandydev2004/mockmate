"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, RefreshCw, Zap } from "lucide-react";
import Link from "next/link";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentStatus = searchParams.get("payment");
  const packId = searchParams.get("pack");
  const orderId = searchParams.get("order_id");

  const [visible, setVisible] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [updatedCredits, setUpdatedCredits] = useState<number | null>(null);

  useEffect(() => {
    if (paymentStatus === "success") {
      setVisible(true);

      // Webhook might arrive a few hundred milliseconds after client redirect.
      // Poll session endpoint 3 times with 1.5s delay to ensure credits display updates automatically.
      let attempts = 0;
      const maxAttempts = 3;

      const pollCredits = async () => {
        setRetrying(true);
        try {
          const res = await fetch("/api/auth/session");
          const data = await res.json();
          if (data?.user?.credits !== undefined) {
            setUpdatedCredits(data.user.credits);
            window.dispatchEvent(new Event("auth-state-change"));
          }
        } catch {
        } finally {
          setRetrying(false);
          attempts += 1;
          if (attempts < maxAttempts) {
            setTimeout(pollCredits, 1500);
          } else {
            router.refresh();
          }
        }
      };

      const timer = setTimeout(pollCredits, 500);
      return () => clearTimeout(timer);
    } else if (paymentStatus === "failed") {
      setVisible(true);
    }
  }, [paymentStatus, router]);

  if (!visible) return null;

  if (paymentStatus === "success") {
    const creditsLabel = packId === "pro" ? "10 credits" : "3 credits";

    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-emerald-900 dark:text-emerald-100">
                Payment Successful! {creditsLabel} Added
              </h3>
              {retrying && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              )}
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              Aapka payment verify ho gaya hai. {updatedCredits !== null ? `Current balance: ${updatedCredits} credits.` : "Credits aapke account mein add ho gaye hain."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          <Link
            href="/interview/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Start Mock Interview &rarr;</span>
          </Link>
          <button
            onClick={() => {
              setVisible(false);
              router.replace("/dashboard");
            }}
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline px-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 shadow-sm flex items-center justify-between gap-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Payment Was Not Completed</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Payment cancel ho gaya ya complete nahi hua. Aapke account se koi amount deduct nahi hua hai.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/pricing"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
          >
            Try Again
          </Link>
          <button
            onClick={() => {
              setVisible(false);
              router.replace("/dashboard");
            }}
            className="text-xs text-rose-600 hover:underline px-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export function PaymentStatusBanner() {
  return (
    <Suspense fallback={null}>
      <PaymentStatusContent />
    </Suspense>
  );
}
