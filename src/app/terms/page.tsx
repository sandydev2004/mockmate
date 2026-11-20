import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Terms of Service | MockMate",
  description: "Terms and conditions for utilizing MockMate's AI placement preparation platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </Link>

      <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-500">Last updated: November 2026</p>
      </div>

      <div className="prose dark:prose-invert text-sm text-slate-700 dark:text-slate-300 space-y-6">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Educational & Preparation Purpose</h2>
          <p>
            MockMate provides automated AI-generated simulation interviews designed for educational practice and interview skill enhancement. MockMate does not guarantee employment, offer letters, or placement drive shortlists from any specific company.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Interview Credits & Purchases</h2>
          <p>
            New accounts receive 1 free interview credit upon registration. Additional interview packs can be acquired via one-time payments through authorized gateways (Razorpay). Purchased credits do not expire as long as your account remains active.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Integrity Signals</h2>
          <p>
            When utilizing Proctored mode, the platform monitors window focus, fullscreen state, and camera presence to provide candidates with authentic assessment rehearsal. These signals are logged strictly to your session report and are never transmitted to third parties without your authorization.
          </p>
        </section>
      </div>
    </div>
  );
}
