import { Skeleton, SkeletonText } from "@/components/loading";

export default function InterviewReportLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8" role="status" aria-busy="true">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Score Overview: Gauge + Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score gauge circle */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex flex-col items-center justify-center text-center space-y-4">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>

        {/* 4 category breakdown */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses 2-Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
          <Skeleton className="h-5 w-32" />
          <SkeletonText lines={4} />
        </div>
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
          <Skeleton className="h-5 w-36" />
          <SkeletonText lines={4} />
        </div>
      </div>
      <span className="sr-only">Loading interview report...</span>
    </div>
  );
}
