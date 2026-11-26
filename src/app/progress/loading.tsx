import { Skeleton, SkeletonText, SkeletonTableRow } from "@/components/loading";

export default function ProgressLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8" role="status" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 sm:w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Placement Readiness Banner + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
          <Skeleton className="h-5 w-44" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trajectory Chart Skeleton */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
        <div className="h-56 flex items-end gap-3 pt-6 border-b border-slate-200 dark:border-slate-800 pb-2">
          {[45, 60, 55, 70, 65, 80, 85].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
              <Skeleton className="h-2.5 w-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Topic Breakdown Cards */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {["DSA", "OS", "DBMS", "CN", "HR"].map((topic) => (
            <div key={topic} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3 px-4"><Skeleton className="h-3 w-24" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-16" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-16" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-12" /></th>
                <th className="py-3 px-4"><Skeleton className="h-3 w-16 ml-auto" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonTableRow key={i} cols={5} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <span className="sr-only">Loading progress dashboard...</span>
    </div>
  );
}
