import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Eye, Trash2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | MockMate",
  description: "Learn how MockMate protects student data, resumes, and on-device camera processing.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </Link>

      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Student Privacy First</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500">Last updated: November 2026</p>
      </div>

      <div className="prose dark:prose-invert text-sm text-slate-700 dark:text-slate-300 space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" /> 1. On-Device Video Processing & Camera Privacy
          </h2>
          <p>
            When participating in <strong>Proctored mode</strong>, your webcam is accessed solely to confirm human presence (single face detection) and monitor focus within the interview room.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Video frames are analyzed strictly on-device</strong> in your local browser using client-side WebAssembly models.</li>
            <li><strong>Zero video or audio streams are ever uploaded, recorded, or stored</strong> on MockMate servers or external cloud storage.</li>
            <li>If you prefer practicing with the camera completely disabled, you can select <strong>Practice mode</strong> on the setup page anytime.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600" /> 2. Resume & Transcript Usage
          </h2>
          <p>
            When you upload an engineering resume (PDF) or complete an interview, your text is used exclusively to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Generate tailored technical cross-questions matching your stated projects and skills.</li>
            <li>Calculate ATS keyword coverage against target placement job descriptions.</li>
            <li>Provide you with structured feedback reports.</li>
          </ul>
          <p>
            We <strong>never sell, lease, or distribute your resume or academic credentials</strong> to third-party advertisers or recruitment agencies without your explicit consent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-indigo-600" /> 3. Data Retention & Deletion
          </h2>
          <p>
            You maintain full ownership of your data. You may delete past interview reports, uploaded resumes, and your complete profile at any time from your account settings.
          </p>
        </section>
      </div>
    </div>
  );
}
