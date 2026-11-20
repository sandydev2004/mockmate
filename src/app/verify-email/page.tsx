"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle2, RotateCw, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend confirmation email");

      setStatusMessage("Verification email resent! Please check your inbox and spam folder.");
      setCooldown(60); // 60s cooldown
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.user && data.user.email_confirmed_at) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setStatusMessage("Email not yet confirmed. Please click the link inside the email we sent you.");
      }
    } catch {
      setStatusMessage("Could not check verification status. Please try refreshing.");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-sm">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Check your Inbox
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We sent a verification link to{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {email || "your email address"}
            </span>
            . Please click the link in that email to activate your account.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 text-xs rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-left">
            {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-left flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Why verify?</span>
          </div>
          <p>
            Verifying your email ensures account security, protects candidate feedback reports, and grants your 1 free interview credit.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCheckStatus}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <span>I've verified my email</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0 || !email}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            <span>
              {cooldown > 0
                ? `Resend available in ${cooldown}s`
                : resending
                ? "Resending email..."
                : "Resend Verification Email"}
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-500 pt-2">
          Wrong email address?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Register again
          </Link>{" "}
          or{" "}
          <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

