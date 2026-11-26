import { Skeleton, SkeletonText } from "@/components/loading";

export default function PricingLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-12" role="status" aria-busy="true">
      {/* Top Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-7 w-48 mx-auto rounded-full" />
        <Skeleton className="h-9 w-72 sm:w-96 mx-auto" />
        <Skeleton className="h-4 w-80 sm:w-96 mx-auto" />
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`p-6 sm:p-8 rounded-2xl border ${
              i === 2
                ? "border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 shadow-md"
                : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70"
            } space-y-6 flex flex-col justify-between`}
          >
            <div className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <SkeletonText lines={2} />
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading pricing plans...</span>
    </div>
  );
}
