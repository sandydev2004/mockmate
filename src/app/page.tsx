import Link from "next/link";
import {
  Sparkles,
  PlayCircle,
  Code2,
  FileCheck2,
  Award,
  Zap,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Cpu,
  Building2,
  Mic,
  TrendingUp,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Built Specifically for Indian Campus Placements 2024-2025</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Ace Your Campus Placement Interviews with{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Realistic AI
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Practice one-on-one mock interviews tailored for TCS, Infosys, Amazon, Swiggy, and startups. Live DSA coding with test runner, CS fundamentals (OS/DBMS/CN), and resume-aware project cross-questioning.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/interview/setup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Start Free Interview</span>
              <span className="text-xs py-0.5 px-2 rounded-full bg-white/20">1 Free Credit</span>
            </Link>

            <Link
              href="/resume-tailor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
            >
              <FileCheck2 className="w-5 h-5 text-indigo-500" />
              <span>Tailor Resume for JD</span>
            </Link>
          </div>

          {/* Social Proof Tags */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Service & Product</p>
                <p className="text-[11px] text-slate-500">TCS, Amazon, Startups</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Monaco + Judge0</p>
                <p className="text-[11px] text-slate-500">Python, C++, Java, JS</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Core CS Rounds</p>
                <p className="text-[11px] text-slate-500">OS, DBMS, CN & OOP</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <Mic className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Voice & Text</p>
                <p className="text-[11px] text-slate-500">Real-time speech-to-text</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Why MockMate Works
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Everything you need to secure top campus placement offers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Resume-Aware Interviewing
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Upload your resume PDF. The AI reads your declared projects, internships, and tech stacks, asking deep follow-ups just like a real engineering manager.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Live DSA Code Execution
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Full Monaco code editor with syntax highlighting in Python, C++, Java, and JS. Run code against sample and hidden test cases with Judge0 before submitting.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Structured Feedback Reports
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Get an instant placement readiness score (0-100) with detailed ratings on Correctness, Communication, Depth, and Problem Solving with concrete improvements.
              </p>
            </div>
          </div>

          {/* Resume Tailor Showcase */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bonus Placement Tool</span>
              </div>
              <h3 className="text-2xl font-bold">
                ATS Resume Matcher & Bullet Point Rewriter
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Paste any job description from LinkedIn or campus portal. MockMate reveals missing keywords and rewrites weak resume bullets using the proven Google XYZ formula.
              </p>
            </div>
            <Link
              href="/resume-tailor"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white text-indigo-950 hover:bg-indigo-50 shadow-md shrink-0 transition-all"
            >
              Try Resume Tailor
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Transparent Student Pricing
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Affordable interview packs made for student budgets
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Every new user receives 1 free interview credit upon signup. No recurring subscription.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free Tier */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Free Trial</h3>
                <p className="text-xs text-slate-500 mt-1">Get started right away</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹0</span>
                  <span className="text-xs text-slate-500">/ 1 interview</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 full mock interview</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Choice of any round & company</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complete feedback report</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Voice input toggle</li>
                </ul>
              </div>
              <Link
                href="/interview/setup"
                className="mt-8 block text-center py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
              >
                Claim Free Interview
              </Link>
            </div>

            {/* Starter Pack */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Starter Pack</h3>
                <p className="text-xs text-slate-500 mt-1">3 Full Interviews</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹99</span>
                  <span className="text-xs text-slate-500">(₹33 / interview)</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 3 interview credits</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> DSA code execution via Judge0</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resume-aware question mode</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> ATS resume tailoring</li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="mt-8 block text-center py-2.5 px-4 rounded-xl font-semibold text-sm bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                Buy 3 Pack (₹99)
              </Link>
            </div>

            {/* Placement Pro */}
            <div className="relative p-7 rounded-2xl bg-gradient-to-b from-indigo-50/80 to-white dark:from-slate-900 dark:to-slate-900 border-2 border-indigo-500 flex flex-col justify-between shadow-lg shadow-indigo-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-[11px] font-bold text-white uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Placement Pro</h3>
                <p className="text-xs text-slate-500 mt-1">10 Full Interviews</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹249</span>
                  <span className="text-xs text-slate-500">(₹24.9 / interview)</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 10 interview credits</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Unlimited ATS resume tailoring</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Progress analytics & score chart</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> STAR behavioral coaching</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Full DSA solutions and test cases</li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="mt-8 block text-center py-2.5 px-4 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
              >
                Buy 10 Pack (₹249)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Ready to secure your placement offer?
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm max-w-xl mx-auto">
            Join hundreds of engineering students practicing campus mock interviews. Free credit is already loaded on your account.
          </p>
          <div className="pt-2">
            <Link
              href="/interview/setup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>Launch Your First Interview</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

