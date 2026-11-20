import { ShieldAlert } from "lucide-react";

export function PrivacyBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>
          <strong>Admin Privacy Notice:</strong> Candidate interview transcripts, resumes, and proctoring logs contain confidential personal data. All administrator views and modifications are permanently logged for audit compliance.
        </span>
      </div>
      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
        Confidential Data
      </span>
    </div>
  );
}

