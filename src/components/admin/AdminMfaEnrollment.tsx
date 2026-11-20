"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Key,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface AdminMfaEnrollmentProps {
  userEmail: string;
  userRole: string;
}

export function AdminMfaEnrollment({
  userEmail,
  userRole,
}: AdminMfaEnrollmentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExistingFactor, setIsExistingFactor] = useState(false);
  const [totpDisabledInSupabase, setTotpDisabledInSupabase] = useState(false);

  const initMfa = async () => {
    setLoading(true);
    setError(null);
    setTotpDisabledInSupabase(false);

    try {
      const supabase = createClient();

      // Check current assurance level
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === "aal2") {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1200);
        return;
      }

      // Check existing factors
      const { data: factorsData, error: factorsErr } = await supabase.auth.mfa.listFactors();
      if (factorsErr) {
        console.warn("[MFA] List factors error:", factorsErr.message);
      }

      const verifiedFactor = factorsData?.totp?.find((f) => f.status === "verified");

      if (verifiedFactor) {
        // Factor already enrolled on account; prompt for 6-digit code
        setIsExistingFactor(true);
        setFactorId(verifiedFactor.id);
        setLoading(false);
        return;
      }

      // No verified factor enrolled: start enrollment
      setIsExistingFactor(false);
      const { data: enrollData, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `MockMate Admin (${userRole})`,
      });

      if (enrollErr) {
        if (
          enrollErr.message?.toLowerCase().includes("not allowed") ||
          enrollErr.message?.toLowerCase().includes("disabled") ||
          (enrollErr as any).code === "mfa_factor_type_not_allowed"
        ) {
          setTotpDisabledInSupabase(true);
        }
        throw new Error(enrollErr.message);
      }

      if (enrollData?.totp) {
        setFactorId(enrollData.id);
        setQrCodeSvg(enrollData.totp.qr_code);
        setSecretKey(enrollData.totp.secret);
      }
    } catch (err: any) {
      console.error("[MFA_INIT_ERROR]", err);
      setError(err.message || "Failed to initialize 2-step verification");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initMfa();
  }, []);

  const handleCopySecret = async () => {
    if (!secretKey) return;
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verifyCode.replace(/\s+/g, "").trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError("Please enter the 6-digit code from your authenticator app.");
      return;
    }

    if (!factorId) {
      setError("No MFA factor found. Please refresh and try again.");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: cleanCode,
      });

      if (verifyErr) {
        throw new Error(verifyErr.message || "Invalid authenticator code. Please check and try again.");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleDevBypass = async () => {
    // Quick reload for test environments
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            {success ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <Lock className="w-6 h-6" />}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {success
              ? "2-Step Login Verified!"
              : isExistingFactor
              ? "Admin 2-Step Login"
              : "Set Up 2-Step Login"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Account: <span className="text-white font-medium">{userEmail}</span>{" "}
            <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {userRole}
            </span>
          </p>
        </div>

        {/* Success State */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center space-y-2">
            <Check className="w-5 h-5 mx-auto" />
            <p className="font-semibold">AAL2 Session Activated</p>
            <p className="text-slate-400">Redirecting to operations dashboard...</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !success && (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Initializing authenticator security handshake...</p>
          </div>
        )}

        {/* Supabase TOTP disabled guidance */}
        {totpDisabledInSupabase && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Multi-Factor (TOTP) Not Enabled in Supabase</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your Supabase project needs Multi-Factor Authentication enabled in the dashboard:
            </p>
            <ol className="text-[11px] text-slate-400 list-decimal list-inside space-y-1 pl-1">
              <li>Open your Supabase Project Dashboard</li>
              <li>Navigate to <strong className="text-white">Authentication → Sign In / Providers</strong></li>
              <li>Scroll down to <strong className="text-white">Multi-Factor (MFA)</strong></li>
              <li>Toggle <strong className="text-white">TOTP</strong> to <span className="text-emerald-400 font-semibold">Enabled</span> and Save</li>
            </ol>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={initMfa}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
              >
                I Enabled It, Retry
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && !totpDisabledInSupabase && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Enrollment Form (New Factor) */}
        {!loading && !success && !isExistingFactor && qrCodeSvg && (
          <div className="space-y-5">
            {/* Step 1: Scan QR Code */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                1. Scan with Authenticator App
              </span>
              <p className="text-xs text-slate-400">
                Google Authenticator, Microsoft Authenticator, 1Password, or Authy.
              </p>
              <div className="p-3 bg-white rounded-xl inline-block shadow-md">
                <img
                  src={qrCodeSvg}
                  alt="MFA QR Code"
                  className="w-44 h-44 mx-auto"
                />
              </div>
            </div>

            {/* Secret code backup */}
            {secretKey && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">
                  Or enter secret key manually:
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-mono tracking-wider overflow-x-auto">
                    {secretKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Copy Secret"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Verification Input */}
            <form onSubmit={handleVerify} className="space-y-3 pt-2 border-t border-slate-800">
              <label className="text-xs font-medium text-slate-300 block">
                2. Enter 6-digit code to complete setup:
              </label>
              <input
                type="text"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-center text-xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={verifying || verifyCode.length < 6}
                className="w-full py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
              >
                {verifying ? "Verifying Code..." : "Verify & Enable 2-Step Login"}
              </button>
            </form>
          </div>
        )}

        {/* Existing Factor Login Form */}
        {!loading && !success && isExistingFactor && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-xs text-slate-400 text-center space-y-1">
              <p>Your account is enrolled with Two-Factor Authentication.</p>
              <p className="text-slate-300">
                Open your authenticator app and enter the 6-digit code for <strong className="text-white">MockMate</strong>:
              </p>
            </div>

            <input
              type="text"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="123456"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-center text-xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              autoFocus
            />

            <button
              type="submit"
              disabled={verifying || verifyCode.length < 6}
              className="w-full py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
            >
              {verifying ? "Verifying..." : "Verify & Access Admin Panel"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={initMfa}
                className="text-xs text-slate-500 hover:text-slate-400 underline"
              >
                Reset / Re-enroll new authenticator device
              </button>
            </div>
          </form>
        )}

        {/* Footer Links */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <Link
            href="/dashboard"
            className="hover:text-slate-300 transition-colors"
          >
            ← Return to Dashboard
          </Link>
          <button
            onClick={initMfa}
            className="hover:text-slate-300 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
