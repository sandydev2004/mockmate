"use client";

import React from "react";
import Spinner from "./Spinner";

interface FullPageLoaderProps {
  message?: string;
  submessage?: string;
}

export default function FullPageLoader({
  message = "Loading MockMate...",
  submessage = "Preparing your interview workspace",
}: FullPageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
          <Spinner size="lg" className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-indigo-500/10 blur-sm -z-10 animate-pulse" />
      </div>
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
        {message}
      </h2>
      {submessage && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          {submessage}
        </p>
      )}
      <span className="sr-only">Page content is loading</span>
    </div>
  );
}
