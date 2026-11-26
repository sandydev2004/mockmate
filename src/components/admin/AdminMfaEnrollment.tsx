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
import { Spinner, ButtonLoading } from "@/components/loading";

interface AdminMfaEnrollmentProps {
  userEmail: string;
  userRole: string;
  redirectPath?: string;
  forceSetup?: boolean;
}

export function AdminMfaEnrollment({
  userEmail,
  userRole,
  redirectPath = "/admin",
  forceSetup = false,
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

      // Check current assurance level (if already AAL2 and not explicitly re-enrolling)
      if (!forceSetup) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.currentLevel === "aal2") {
          setSuccess(true);
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 800);
          return;
        }
      }

      // Check existing factors
      const { data: factorsData, error: factorsErr } = await supabase.auth.mfa.listFactors();
      if (factorsErr) {
        console.warn("[MFA] List factors error:", factorsErr.message);
      }

      const verifiedFactor = factorsData?.totp?.find((f) => f.status === "verified");

      if (verifiedFactor && !forceSetup) {
        // Factor already enrolled on account; prompt for 6-digit code
        setIsExistingFactor(true);
        setFactorId(verifiedFactor.id);
        setLoading(false);
        return;
      }

      // Clean up stale or existing factors before starting new enrollment
      if (factorsData?.all) {
        for (const factor of factorsData.all) {
          if (factor.status === "unverified" || (forceSetup && factor.status === "verified")) {
            await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => {});
          }
        }
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

  const handleUnenrollAndReEnroll = async () => {
    if (
      !window.confirm(
        "Are you sure you want to re-enroll? This will remove existing factors and generate a new QR code for Google Authenticator."
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      if (factorsData?.all) {
        for (const factor of factorsData.all) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id }).catch(() => {});
        }
      }
      setIsExistingFactor(false);
      setFactorId(null);
      setQrCodeSvg(null);
      setSecretKey(null);
      setVerifyCode("");
      await initMfa();
    } catch (err: any) {
      setError(err.message || "Failed to reset authenticator factor");
      setLoading(false);
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
        window.location.href = redirectPath;
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
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
          <div className="py-12 text-center space-y-3" role="status" aria-busy="true">
            <Spinner size="lg" className="text-indigo-400 mx-auto" />
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
                type="button"
                onClick={initMfa}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors"
              >
                I Enabled It, Retry
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && !totpDisabledInSupabase && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {!qrCodeSvg && !isExistingFactor && (
              <button
                type="button"
                onClick={initMfa}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Setup
              </button>
            )}
          </div>
        )}

        {/* Fallback prompt if enrollment returned without QR code or factor */}
        {!loading && !success && !isExistingFactor && !qrCodeSvg && !totpDisabledInSupabase && !error && (
          <div className="text-center py-6 space-y-4">
            <p className="text-xs text-slate-400">
              Ready to configure your authenticator device for two-step security.
            </p>
            <button
              type="button"
              onClick={initMfa}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate Authenticator QR Code</span>
            </button>
          </div>
        )}

        {/* Enrollment Form (New Factor) */}
        {!loading && !success && !isExistingFactor && qrCodeSvg && (
          <div className="space-y-5">
            {/* Step 1: Scan QR Code */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                1. Scan QR Code with Google Authenticator
              </span>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Open <strong className="text-white">Google Authenticator</strong> (or any TOTP app), tap the <strong className="text-white">(+)</strong> button, and choose <strong className="text-indigo-400">Scan a QR code</strong>.
              </p>
              <div className="p-3 bg-white rounded-xl inline-block shadow-md">
                {qrCodeSvg.includes("<svg") ? (
                  <div
                    className="w-48 h-48 mx-auto flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{
                      __html: qrCodeSvg.slice(qrCodeSvg.indexOf("<svg")),
                    }}
                  />
                ) : (
                  <img
                    src={
                      qrCodeSvg.startsWith("data:")
                        ? qrCodeSvg
                        : `data:image/svg+xml;utf-8,${encodeURIComponent(qrCodeSvg)}`
                    }
                    alt="Google Authenticator QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                )}
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
              <ButtonLoading
                type="submit"
                loading={verifying}
                loadingText="Verifying Code..."
                disabled={verifyCode.length < 6}
                className="w-full py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <span>Verify & Enable 2-Step Login</span>
              </ButtonLoading>
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

            <ButtonLoading
              type="submit"
              loading={verifying}
              loadingText="Verifying..."
              disabled={verifyCode.length < 6}
              className="w-full py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <span>Verify & Access Admin Panel</span>
            </ButtonLoading>

            <div className="pt-3 text-center border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleUnenrollAndReEnroll}
                className="inline-flex items-center justify-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-2 px-3 rounded-lg hover:bg-slate-800 border border-slate-800"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Lost or need new QR code? Re-scan with Google Authenticator</span>
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
