"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Video,
  ChevronLeft,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function AdminInterviewDetailPage() {
  const params = useParams();
  const interviewId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sensitive data visibility state (hidden by default to protect candidate privacy)
  const [revealedSensitive, setRevealedSensitive] = useState(false);
  const [revealingLoading, setRevealingLoading] = useState(false);

  // Review verdict state
  const [verdict, setVerdict] = useState<"approved" | "flagged" | "inconclusive">("approved");
  const [notes, setNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const fetchInterview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/interviews/${interviewId}`);
      if (!res.ok) throw new Error("Failed to load interview details");
      const json = await res.json();
      setData(json);
      if (json.interview?.admin_review_verdict) {
        setVerdict(json.interview.admin_review_verdict);
      }
      if (json.interview?.admin_notes) {
        setNotes(json.interview.admin_notes);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load interview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interviewId) fetchInterview();
  }, [interviewId]);

  const handleRevealSensitive = async () => {
    setRevealingLoading(true);
    try {
      // Audit log the sensitive data unmasking action
      const res = await fetch(`/api/admin/interviews/${interviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_sensitive_access",
          type: "all",
        }),
      });

      if (!res.ok) throw new Error("Failed to authenticate access to sensitive logs");
      setRevealedSensitive(true);
    } catch (err: any) {
      alert("Error logging sensitive access: " + err.message);
    } finally {
      setRevealingLoading(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewSuccess(null);
    try {
      const res = await fetch(`/api/admin/interviews/${interviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          verdict,
          notes,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save review");
      setReviewSuccess(`Session reviewed successfully. Verdict: ${verdict.toUpperCase()}`);
      fetchInterview();
    } catch (err: any) {
      alert("Error saving review: " + err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-900 rounded w-1/6"></div>
        <div className="h-36 bg-slate-900 border border-slate-800 rounded-xl"></div>
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl"></div>
      </div>
    );
  }

  if (error || !data?.interview) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-base font-semibold text-white">Interview Not Found</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          href="/admin/interviews"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Interviews
        </Link>
      </div>
    );
  }

  const { interview, feedback, integrityEvents, integritySummary, messages, resume } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/interviews"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Interviews</span>
        </Link>
        <span className="text-xs text-slate-500 font-mono">ID: {interview.id}</span>
      </div>

      {reviewSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{reviewSuccess}</span>
        </div>
      )}

      {/* Session Header Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white uppercase tracking-tight">
                {interview.round} Interview
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                {interview.role}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize bg-slate-800 text-slate-400">
                {interview.company_type}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize bg-slate-800 text-slate-400">
                {interview.difficulty}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Candidate: <span className="text-white font-medium">{interview.profiles?.email}</span> (
              {interview.profiles?.full_name || "Anonymous"})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Performance Score</span>
              <span className="text-2xl font-bold text-indigo-400">
                {interview.overall_score ?? feedback?.overall ?? "—"}
                <span className="text-xs font-normal text-slate-500">/100</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-slate-800">
          <div>
            <span className="text-slate-500 block">Mode</span>
            <span className="font-semibold text-white capitalize">{interview.mode || "proctored"}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Status</span>
            <span className="font-semibold text-white capitalize">{interview.status}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Started</span>
            <span className="font-semibold text-slate-300">
              {new Date(interview.started_at).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Strikes Accumulated</span>
            <span className={`font-semibold ${interview.strikes > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {interview.strikes || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Integrity Signals & Risk Assessment */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h2 className="text-base font-semibold text-white">Integrity & Proctoring Signals</h2>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
              integritySummary.risk_level === "High"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : integritySummary.risk_level === "Medium"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {integritySummary.risk_level} Risk ({integritySummary.risk_score}/100)
          </span>
        </div>

        {interview.auto_submit_reason && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <strong>Auto-Submit Triggered:</strong> {interview.auto_submit_reason}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block">Tab Switches</span>
            <span className="text-sm font-bold text-white">{integritySummary.tab_switches}</span>
            <span className="text-[10px] text-slate-400 block">{integritySummary.total_away_seconds}s away</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block">Fullscreen Exits</span>
            <span className="text-sm font-bold text-white">{integritySummary.fullscreen_exits}</span>
            <span className="text-[10px] text-slate-400 block">{integritySummary.total_fullscreen_exit_seconds}s outside</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block">Camera Absences</span>
            <span className="text-sm font-bold text-white">{integritySummary.camera_absences}</span>
            <span className="text-[10px] text-slate-400 block">{integritySummary.total_absent_seconds}s absent</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block">Blocked Pastes & Shortcuts</span>
            <span className="text-sm font-bold text-white">
              {integritySummary.paste_attempts + integritySummary.shortcuts_blocked}
            </span>
            <span className="text-[10px] text-slate-400 block">Attempted clipboard/devtools</span>
          </div>
        </div>

        {/* Integrity Events Timeline */}
        {integrityEvents.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chronological Integrity Log ({integrityEvents.length} events)
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
              {integrityEvents.map((evt: any) => (
                <div key={evt.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-none">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(evt.created_at).toLocaleTimeString()}
                    </span>
                    <span className="font-medium text-slate-300 capitalize">{evt.event_type.replace(/_/g, " ")}</span>
                  </div>
                  {evt.details && (
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[250px]">
                      {JSON.stringify(evt.details)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SENSITIVE DATA SECTION: Hidden behind audit-logged button */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Protected Candidate Data (Transcript & Resume)</h2>
          </div>
          {!revealedSensitive ? (
            <button
              onClick={handleRevealSensitive}
              disabled={revealingLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{revealingLoading ? "Logging & Unmasking..." : "View Sensitive Data"}</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sensitive access logged to audit trail
            </span>
          )}
        </div>

        {!revealedSensitive ? (
          <div className="p-8 text-center bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
            <Lock className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Candidate responses, problem code, and uploaded resumes contain personal data. Unmasking this section will record your admin ID and timestamp in the permanent audit trail.
            </p>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Resume Text */}
            {resume && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Resume Content ({resume.filename})</span>
                </div>
                <div className="text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto p-3 rounded bg-slate-900 border border-slate-800/80">
                  {resume.text}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Full Dialogue Transcript ({messages.length} messages)</span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto p-4 rounded-lg bg-slate-950 border border-slate-800">
                {messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg text-xs ${
                      msg.sender === "ai"
                        ? "bg-slate-900 text-slate-200 border border-slate-800"
                        : "bg-indigo-950/40 text-indigo-200 border border-indigo-900/40 ml-6"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-semibold uppercase">
                      <span>{msg.sender === "ai" ? "AI Interviewer" : "Candidate Response"}</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Review & Private Notes Form */}
      <form onSubmit={handleSaveReview} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Administrative Review Verdict</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Review Verdict</label>
            <select
              value={verdict}
              onChange={(e) => setVerdict(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="approved">Approved (Clean / Genuine)</option>
              <option value="flagged">Flagged (Unsatisfactory / Cheating Confirmed)</option>
              <option value="inconclusive">Inconclusive (Needs Further Review)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Private Admin Notes (Never visible to candidate)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Candidate exhibited multiple tab switches during question 3; responses resemble external copy-paste."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={reviewLoading}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {reviewLoading ? "Saving Review..." : "Submit Review Verdict"}
          </button>
        </div>
      </form>
    </div>
  );
}

