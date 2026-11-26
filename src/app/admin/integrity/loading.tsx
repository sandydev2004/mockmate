import { Skeleton, SkeletonTableRow } from "@/components/loading";

export default function AdminIntegrityLoading() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Integrity Logs Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4"><Skeleton className="h-3 w-28" /></th>
                <th className="py-3.5 px-4"><Skeleton className="h-3 w-20" /></th>
                <th className="py-3.5 px-4"><Skeleton className="h-3 w-24" /></th>
                <th className="py-3.5 px-4"><Skeleton className="h-3 w-16 ml-auto" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} cols={4} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <span className="sr-only">Loading proctoring integrity events...</span>
    </div>
  );
}
