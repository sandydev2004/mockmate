import { Skeleton, SkeletonText } from "@/components/loading";

export default function InterviewRoomLoading() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-[1600px] w-full mx-auto p-3 sm:p-4 gap-4" role="status" aria-busy="true">
      {/* Top Bar Skeleton */}
      <div className="h-14 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-32 sm:w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left: Chat / Dialogue Pane */}
        <div className="flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          {/* Messages conversation */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="p-4 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800/80 max-w-[85%] space-y-2">
              <Skeleton className="h-4 w-28" />
              <SkeletonText lines={3} />
            </div>
            <div className="p-4 rounded-2xl rounded-tr-sm bg-indigo-50 dark:bg-indigo-950/40 ml-auto max-w-[80%] space-y-2">
              <SkeletonText lines={2} />
            </div>
          </div>

          {/* Bottom input bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Right: Code Editor / Problem Pane */}
        <div className="flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden">
          {/* Problem header & language switcher */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          </div>

          {/* Editor Body Placeholder */}
          <div className="flex-1 p-4 bg-slate-900/90 text-slate-400 space-y-3 font-mono text-xs">
            <Skeleton className="h-4 w-1/3 bg-slate-800" />
            <Skeleton className="h-4 w-1/2 bg-slate-800" />
            <Skeleton className="h-4 w-2/5 bg-slate-800" />
            <Skeleton className="h-4 w-3/4 bg-slate-800" />
            <Skeleton className="h-4 w-1/4 bg-slate-800" />
          </div>

          {/* Editor bottom bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading interview room...</span>
    </div>
  );
}
