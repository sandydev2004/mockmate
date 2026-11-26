"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Shield, Copy, Check } from "lucide-react";

interface AdminErrorStateProps {
  title?: string;
  error: string;
  requestId?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function AdminErrorState({
  title = "Failed to Load Admin Data",
  error,
  requestId,
  onRetry,
  isRetrying = false,
}: AdminErrorStateProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyRequestId = () => {
    if (!requestId) return;
    navigator.clipboard.writeText(requestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto my-6 p-4 sm:p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4 min-w-0 break-words">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shrink-0">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1.5 min-w-0">
        <h2 className="text-base font-semibold text-white tracking-tight break-words">{title}</h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto break-words min-w-0">{error}</p>
      </div>

      {requestId && (
        <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 break-all">
          <span className="text-slate-400 shrink-0">Request ID:</span>
          <span className="text-indigo-400 font-semibold break-all">{requestId}</span>
          <button
            type="button"
            onClick={handleCopyRequestId}
            className="p-1 hover:text-white transition-colors min-h-[32px] min-w-[32px] inline-flex items-center justify-center shrink-0"
            title="Copy Request ID"
            aria-label="Copy Request ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 w-full max-w-sm sm:max-w-md mx-auto">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Retrying..." : "Try Again"}
          </button>
        )}

        <Link
          href="/admin/mfa"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Verify 2-Step Login (MFA)</span>
        </Link>
      </div>
    </div>
  );
}
