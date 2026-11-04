import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              MockMate
            </div>
            <p className="text-sm">
              Empowering Indian engineering students to crack dream campus placements at product, service, and tech startup companies.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Interview Rounds
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/interview/setup" className="hover:text-indigo-600 dark:hover:text-indigo-400">DSA & Coding Round</Link></li>
              <li><Link href="/interview/setup" className="hover:text-indigo-600 dark:hover:text-indigo-400">CS Fundamentals (OS/DBMS/CN)</Link></li>
              <li><Link href="/interview/setup" className="hover:text-indigo-600 dark:hover:text-indigo-400">System Design (HLD/LLD)</Link></li>
              <li><Link href="/interview/setup" className="hover:text-indigo-600 dark:hover:text-indigo-400">HR & Behavioral (STAR)</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Company Profiles
            </h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-slate-500">Service: TCS, Infosys, Wipro, Cognizant</span></li>
              <li><span className="text-slate-500">Product: Amazon, Microsoft, Swiggy</span></li>
              <li><span className="text-slate-500">Startups: CRED, Zepto, Razorpay</span></li>
              <li><Link href="/resume-tailor" className="hover:text-indigo-600 dark:hover:text-indigo-400">ATS Resume Tailor</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Placement Packs
            </h4>
            <p className="text-sm mb-3">
              1 Free interview on signup. Extra packs start at just ₹99 for 3 interviews.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Pricing & Credits &rarr;
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MockMate AI. Built for Indian Engineering Students.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for campus placements
          </p>
        </div>
      </div>
    </footer>
  );
}
