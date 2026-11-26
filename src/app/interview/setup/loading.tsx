import { Skeleton, SkeletonText } from "@/components/loading";

export default function InterviewSetupLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8" role="status" aria-busy="true">
      {/* Header */}
      <div className="text-center space-y-3">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 sm:w-96 mx-auto" />
      </div>

      {/* Target Role Cards */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Company Type & Target Company */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Interview Round */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Skeleton className="h-5 w-24" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      </div>

      {/* Resume Upload Box */}
      <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center py-10 space-y-3 text-center">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-2">
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
      <span className="sr-only">Loading interview setup...</span>
    </div>
  );
}
