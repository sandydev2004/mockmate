"use client";

import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-shimmer rounded bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineClassName?: string;
}

export function SkeletonText({
  lines = 3,
  className = "space-y-2.5",
  lineClassName = "h-4",
}: SkeletonTextProps) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`${lineClassName} ${
            i === lines - 1 && lines > 1 ? "w-3/5" : i % 2 === 1 ? "w-4/5" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };
  return <Skeleton className={`rounded-full shrink-0 ${sizeClasses[size]} ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="pt-2 flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({
  cols = 5,
  className = "",
}: {
  cols?: number;
  className?: string;
}) {
  return (
    <tr className={`border-b border-slate-100 dark:border-slate-800/80 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton
            className={`h-4 ${
              i === 0 ? "w-32" : i === cols - 1 ? "w-16 ml-auto" : "w-20"
            }`}
          />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-6 ${className}`}
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>
      <div className="h-48 flex items-end gap-3 pt-6 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[40, 65, 30, 85, 55, 95, 70, 50, 75, 90].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton
              className="w-full rounded-t"
              style={{ height: `${h}%` }}
            />
            <Skeleton className="h-2.5 w-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
