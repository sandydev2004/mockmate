"use client";

import React from "react";

interface TypingDotsProps {
  label?: string;
  className?: string;
}

export default function TypingDots({
  label = "Interviewer is thinking",
  className = "",
}: TypingDotsProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium border border-slate-200/60 dark:border-slate-700/60 shadow-sm ${className}`}
    >
      <span>{label}</span>
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        <span
          className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce"
          style={{ animationDuration: "0.8s", animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce"
          style={{ animationDuration: "0.8s", animationDelay: "160ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce"
          style={{ animationDuration: "0.8s", animationDelay: "320ms" }}
        />
      </span>
      <span className="sr-only">Interviewer is generating a response</span>
    </div>
  );
}
