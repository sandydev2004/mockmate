"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Database,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Server,
  Lock,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminErrorState } from "@/components/admin/AdminErrorState";

interface SystemCheckData {
  status: string;
  timestamp: string;
  admin: {
    email: string;
    role: string;
  };
  tables: Record<
    string,
    { status: "ok" | "error" | "missing"; rowCount: number; verifiedColumns?: string; error?: string }
  >;
  envVars: Array<{ name: string; isSet: boolean }>;
  mfa: { enabled: boolean; note: string };
  idempotentSql: string;
}

export default function AdminSystemCheckPage() {
  const [data, setData] = useState<SystemCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

  const runCheck = async () => {
    if (!data) setLoading(true);
    else setRetrying(true);
    setError(null);
    try {
      const res = await adminFetch<SystemCheckData>("/api/admin/system-check");
      if (res.error) {
        setError(res.error);
        setRequestId(res.requestId);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute system check");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const handleCopySql = () => {
    if (!data?.idempotentSql) return;
    navigator.clipboard.writeText(data.idempotentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-indigo-400" />
            System & Database Diagnostics
          </h1>
          <p className="text-sm text-slate-400">
            Verify tables, columns, Supabase MFA connectivity, and environment variables. (Super Admin only)
          </p>
        </div>
        <button
          type="button"
          onClick={runCheck}
          disabled={loading || retrying}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading || retrying ? "animate-spin" : ""}`} />
          {retrying ? "Running Diagnostics..." : "Run Health Check"}
        </button>
      </div>

      {error ? (
        <AdminErrorState
          title="System Diagnostics Unavailable"
          error={error}
          requestId={requestId}
          onRetry={runCheck}
          isRetrying={retrying}
        />
      ) : loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-28 bg-slate-900 border border-slate-800 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl"></div>
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl"></div>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Diagnostics Completed</p>
                <p className="text-slate-400">Checked at {new Date(data.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="text-slate-400">
              Admin: <span className="text-white font-medium">{data.admin.email}</span> (
              <span className="text-indigo-400 font-semibold">{data.admin.role}</span>)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Tables */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Database Schema Tables
              </h2>
              <div className="space-y-2">
                {Object.entries(data.tables).map(([tableName, info]) => (
                  <div
                    key={tableName}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-mono text-slate-200">{tableName}</div>
                      {info.verifiedColumns && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          cols: {info.verifiedColumns}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="text-slate-400">{info.rowCount} rows</span>
                      {info.status === "ok" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> {info.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Environment Variables & MFA */}
            <div className="space-y-6">
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Environment Secrets Presence (Values Masked)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {data.envVars.map((env) => (
                    <div
                      key={env.name}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                    >
                      <span className="font-mono text-[11px] text-slate-300 truncate mr-2" title={env.name}>
                        {env.name}
                      </span>
                      {env.isSet ? (
                        <span className="text-emerald-400 font-semibold text-[11px]">Configured</span>
                      ) : (
                        <span className="text-rose-400 font-semibold text-[11px]">Missing</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* MFA Handshake */}
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-2 text-xs">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  Supabase Multi-Factor Authentication
                </h2>
                <p className="text-slate-400">{data.mfa.note}</p>
              </div>
            </div>
          </div>

          {/* Idempotent SQL Generator */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Idempotent SQL Fix Script</h2>
                <p className="text-xs text-slate-400">
                  Execute this in the Supabase SQL editor if any database tables or columns are missing.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied SQL!" : "Copy SQL Script"}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64">
              {data.idempotentSql}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
