import { Skeleton, SkeletonTableRow } from "@/components/loading";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4"><Skeleton className="h-3 w-28" /></th>
                <th className="py-3.5 px-4"><Skeleton className="h-3 w-16" /></th>
                <th className="py-3.5 px-4"><Skeleton className="h-3 w-14" /></th>
                <th className="py-3.5 px-4"><Skeleton className="h-3 w-16" /></th>
                <th className="py-3.5 px-4"><Skeleton className="h-3 w-14 ml-auto" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonTableRow key={i} cols={5} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <span className="sr-only">Loading users...</span>
    </div>
  );
}
