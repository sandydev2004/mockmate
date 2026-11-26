"use client";

import React, { useEffect, useState } from "react";
import Spinner from "./Spinner";

export interface StepItem {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "error";
}

interface StepLoaderProps {
  title?: string;
  steps: StepItem[];
  onRetry?: () => void;
  timeoutSeconds?: number;
  className?: string;
}

export default function StepLoader({
  title = "Processing with AI...",
  steps,
  onRetry,
  timeoutSeconds = 30,
  className = "",
}: StepLoaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLongWait = elapsed >= 8 && elapsed < timeoutSeconds;
  const isTimedOut = elapsed >= timeoutSeconds;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-w-md w-full mx-auto space-y-5 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
          <Spinner size="md" className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isTimedOut
              ? "Request timed out"
              : isLongWait
              ? "Taking longer than usual..."
              : "Please keep this tab open"}
          </p>
        </div>
      </div>

      {/* Step checklist */}
      <div className="space-y-3 pt-1">
        {steps.map((step) => {
          return (
            <div key={step.id} className="flex items-center gap-3 text-xs sm:text-sm">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {step.status === "completed" ? (
                  <svg
                    className="w-4 h-4 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : step.status === "running" ? (
                  <Spinner size="sm" className="text-indigo-600 dark:text-indigo-400" />
                ) : step.status === "error" ? (
                  <svg
                    className="w-4 h-4 text-rose-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                )}
              </div>
              <span
                className={
                  step.status === "completed"
                    ? "text-slate-500 dark:text-slate-400 line-through"
                    : step.status === "running"
                    ? "text-indigo-600 dark:text-indigo-400 font-medium"
                    : step.status === "error"
                    ? "text-rose-600 dark:text-rose-400 font-medium"
                    : "text-slate-400 dark:text-slate-500"
                }
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 8-second delay reassurance */}
      {isLongWait && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
          Almost there! AI is analyzing your responses in detail.
        </div>
      )}

      {/* 30-second timeout recovery */}
      {isTimedOut && (
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            This step is taking longer than expected. You can retry the request or refresh.
          </p>
          {onRetry && (
            <button
              onClick={() => {
                setElapsed(0);
                onRetry();
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Retry Step
            </button>
          )}
        </div>
      )}
    </div>
  );
}
