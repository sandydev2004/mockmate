"use client";

import { useEffect, useState } from "react";
import {
  Cpu,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Layers,
  Power,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function AdminAISettingsPage() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [platformSettings, setPlatformSettings] = useState<any>({
    llm_kill_switch: false,
    max_daily_interviews_per_user: 10,
    max_strikes: 3,
    strike_grace_seconds: 15,
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Kill switch confirmation
  const [showKillSwitchConfirm, setShowKillSwitchConfirm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-settings");
      if (!res.ok) throw new Error("Failed to load AI settings");
      const data = await res.json();
      setTelemetry(data.telemetry);
      if (data.platformSettings) {
        setPlatformSettings(data.platformSettings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    setSavingKey(key);
    setSaveSuccess(null);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update setting");

      setPlatformSettings((prev: any) => ({ ...prev, [key]: value }));
      setSaveSuccess(`Setting "${key}" updated and audit logged.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleToggleKillSwitch = () => {
    if (!platformSettings.llm_kill_switch) {
      // Prompt confirm before enabling kill-switch (which stops all interviews)
      setShowKillSwitchConfirm(true);
    } else {
      updateSetting("llm_kill_switch", false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-900 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-900 border border-slate-800 rounded-xl"></div>
          <div className="h-72 bg-slate-900 border border-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Providers & Platform Controls</h1>
          <p className="text-sm text-slate-400">
            Monitor multi-provider fallback health, manage rate-limit cooldowns, and configure emergency overrides.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Emergency Kill-Switch Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
          platformSettings.llm_kill_switch
            ? "bg-rose-950/40 border-rose-500/50 text-rose-200"
            : "bg-slate-900 border-slate-800 text-slate-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              platformSettings.llm_kill_switch
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Platform Interview Kill-Switch</span>
              {platformSettings.llm_kill_switch && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                  Active (Interviews Paused)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              When enabled, candidates cannot start new interviews (returns 503 Maintenance). Useful during LLM outages or billing emergencies.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleKillSwitch}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm ${
            platformSettings.llm_kill_switch
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
          }`}
        >
          {platformSettings.llm_kill_switch ? "Resume Interviews" : "Activate Kill-Switch"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Provider Fleet Status */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-semibold text-white">Configured LLM Fleet</h2>
            </div>
            <span className="text-xs text-slate-400">Primary: {telemetry?.primaryProvider}</span>
          </div>

          <p className="text-xs text-slate-400">
            Fallback Chain:{" "}
            <span className="text-white font-mono">
              {[telemetry?.primaryProvider, ...(telemetry?.fallbackProviders || [])].join(" → ")}
            </span>
          </p>

          <div className="space-y-2.5">
            {telemetry?.configuredProviders.map((provider: any) => (
              <div
                key={provider.name}
                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white capitalize">{provider.name}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        provider.configured
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {provider.configured ? "Key Configured" : "Missing Key"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{provider.model}</div>
                </div>

                <div className="text-right">
                  {provider.inCooldown ? (
                    <span className="text-rose-400 font-semibold block animate-pulse">
                      Cooldown: {provider.cooldownRemainingSec}s
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold block">Available</span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    Calls: {provider.calls} · Errors: {provider.errors}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Policy & Proctoring Limits */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Platform Governance & Proctoring</h2>
          </div>
          <p className="text-xs text-slate-400">
            These parameters dynamically override hardcoded defaults and apply instantly across all active sessions.
          </p>

          <div className="space-y-4 pt-2">
            {/* Daily interview cap */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-white block">
                    Max Daily Interviews Per Candidate
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Prevents automated quota draining or script abuse.
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={platformSettings.max_daily_interviews_per_user}
                  onChange={(e) =>
                    setPlatformSettings((prev: any) => ({
                      ...prev,
                      max_daily_interviews_per_user: parseInt(e.target.value || "1", 10),
                    }))
                  }
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-xs text-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  disabled={savingKey === "max_daily_interviews_per_user"}
                  onClick={() =>
                    updateSetting(
                      "max_daily_interviews_per_user",
                      platformSettings.max_daily_interviews_per_user
                    )
                  }
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50"
                >
                  Save Limit
                </button>
              </div>
            </div>

            {/* Max Strikes */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-white block">
                    Strike Limit Before Auto-Submit
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Proctored interviews auto-submit when candidate reaches this strike threshold.
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={platformSettings.max_strikes}
                  onChange={(e) =>
                    setPlatformSettings((prev: any) => ({
                      ...prev,
                      max_strikes: parseInt(e.target.value || "3", 10),
                    }))
                  }
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-xs text-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  disabled={savingKey === "max_strikes"}
                  onClick={() => updateSetting("max_strikes", platformSettings.max_strikes)}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50"
                >
                  Save Strikes
                </button>
              </div>
            </div>

            {/* Strike Grace Seconds */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-white block">
                    Strike Grace Period (Seconds)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Time candidate has to re-enter fullscreen or camera frame before receiving a strike.
                  </span>
                </div>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={platformSettings.strike_grace_seconds}
                  onChange={(e) =>
                    setPlatformSettings((prev: any) => ({
                      ...prev,
                      strike_grace_seconds: parseInt(e.target.value || "15", 10),
                    }))
                  }
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-xs text-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  disabled={savingKey === "strike_grace_seconds"}
                  onClick={() =>
                    updateSetting("strike_grace_seconds", platformSettings.strike_grace_seconds)
                  }
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50"
                >
                  Save Grace Period
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kill Switch Confirm Dialog */}
      <ConfirmDialog
        isOpen={showKillSwitchConfirm}
        title="Activate Emergency Kill-Switch?"
        message="Activating the kill-switch will immediately halt candidates from starting any new interviews. Existing sessions will finish normally. Do you want to proceed?"
        confirmText="Activate Kill-Switch"
        isDestructive={true}
        onConfirm={() => {
          setShowKillSwitchConfirm(false);
          updateSetting("llm_kill_switch", true);
        }}
        onCancel={() => setShowKillSwitchConfirm(false)}
      />
    </div>
  );
}

