import { Skeleton, SkeletonText } from "@/components/loading";

export default function ResumeTailorLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8" role="status" aria-busy="true">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Split upload and JD inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Resume */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center space-y-3 text-center">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>

        {/* Right: Job Description */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>

      {/* Action button */}
      <div className="flex justify-center pt-2">
        <Skeleton className="h-12 w-52 rounded-xl" />
      </div>
      <span className="sr-only">Loading resume tailor...</span>
    </div>
  );
}
