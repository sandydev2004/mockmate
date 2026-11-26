"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Spinner, ButtonLoading } from "@/components/loading";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedNotice, setVerifiedNotice] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setVerifiedNotice(true);
    }
    // Extract error from query params or URL hash fragment
    let errParam =
      searchParams.get("error_description") ||
      searchParams.get("error") ||
      searchParams.get("message");

    if (!errParam && typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      errParam =
        hashParams.get("error_description") ||
        hashParams.get("error") ||
        hashParams.get("message");
    }

    if (errParam) {
      const decoded = decodeURIComponent(errParam.replace(/\+/g, " "));
      if (decoded.includes("Database error saving new user")) {
        setError(
          "Account creation issue: The database trigger encountered a constraint error saving your profile. Please report this to the administrator or try logging in again."
        );
      } else {
        setError(decoded);
      }
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
          return;
        }
        throw new Error(data.error || "Login failed");
      }

      // Successful login
      window.dispatchEvent(new Event("auth-state-change"));
      const redirectPath = searchParams.get("redirect") || "/dashboard";
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
      const redirectTarget = searchParams.get("redirect") || searchParams.get("next");
      const redirectQuery =
        redirectTarget && redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
          ? `?next=${encodeURIComponent(redirectTarget)}`
          : "";

      const { error: supaErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback${redirectQuery}`,
        },
      });

      if (supaErr) {
        throw supaErr;
      }
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Log in to MockMate
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Access your placement preparation dashboard and resume evaluations.
          </p>
        </div>

        {verifiedNotice && (
          <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Email successfully verified! You can now log in.</span>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu.in"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <ButtonLoading
            type="submit"
            loading={loading}
            loadingText="Signing in..."
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <span>Log In</span>
            <ArrowRight className="w-4 h-4" />
          </ButtonLoading>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-all disabled:opacity-50"
        >
          {googleLoading ? (
            <>
              <Spinner size="sm" className="text-indigo-600" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
          New here? An account is created automatically with 1 free interview credit.
        </p>

        <p className="text-center text-xs text-slate-500">
          Don't have an account yet?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
