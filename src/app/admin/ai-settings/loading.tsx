import { Skeleton } from "@/components/loading";

export default function AdminAISettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl" role="status" aria-busy="true">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Settings Cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="pt-2 flex justify-end">
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading AI settings...</span>
    </div>
  );
}
