"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Spinner } from "@/components/loading";

export function DeleteInterviewButton({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interview/${interviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete interview");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete interview");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
        >
          {loading && <Spinner size="sm" className="text-white" />}
          <span>Confirm</span>
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title="Delete unfinished interview"
      aria-label="Delete unfinished interview"
      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

