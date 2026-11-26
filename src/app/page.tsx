import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { HeroInteractive } from "@/components/landing/HeroInteractive";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import {
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  Code2,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  Award,
  BarChart3,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // If candidate is already authenticated, directly redirect them to dashboard
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  // Structured Data / JSON-LD for SEO & Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://mockmate.ai/#website",
        "url": "https://mockmate.ai",
        "name": "MockMate AI",
        "description": "AI-powered mock placement interviews and instant evaluation for engineering students.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://mockmate.ai/?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://mockmate.ai/#software",
        "name": "MockMate",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "All modern web browsers",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        },
        "description": "Realistic campus placement technical & HR mock interviews with on-device proctoring and comprehensive scoring."
      },
      {
        "@type": "FAQPage",
        "@id": "https://mockmate.ai/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Is it really free?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, completely! Every new engineering student gets 1 free full-length mock interview credit right upon signup. You get full access to the AI interviewer, live code editor, proctoring simulation, and the complete 100-point performance feedback report. No credit card, debit card, or UPI details are ever asked."
            }
          },
          {
            "@type": "Question",
            "name": "Do I need a camera?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No, a camera is never mandatory! You can choose between two modes: Practice Mode (100% camera-free, relaxed) or Proctored Mode (simulates strict placement tests like TCS iON). Even in Proctored Mode, face and presence detection is processed purely on-device in your browser. Video is never recorded, uploaded, or stored on servers."
            }
          },
          {
            "@type": "Question",
            "name": "Is my resume safe?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "100% safe and private. When you upload your resume (PDF), our parser strictly extracts your listed projects and technical skills in memory so the AI interviewer can ask relevant cross-questions. Your data is encrypted, never shared or sold, and you can delete your uploaded resumes and interview logs anytime."
            }
          },
          {
            "@type": "Question",
            "name": "Which companies and rounds are covered?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "MockMate covers Service Giants (TCS NQT/Digital, Infosys DSE/SP, Wipro Turbo, Cognizant GenC), Tier-1 Product Companies (Amazon, Microsoft, Swiggy), and Tech Startups (CRED, Zepto, Razorpay). We support DSA Coding, CS Fundamentals (OS/DBMS/CN), System Design (HLD/LLD), and HR / Behavioral rounds (STAR framework)."
            }
          },
          {
            "@type": "Question",
            "name": "Does it work on mobile?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! MockMate is designed mobile-first. You can comfortably take conversational CS fundamentals and HR rounds directly from your smartphone browser (Chrome, Safari, Brave), using voice dictation or text, and view your scorecards anywhere."
            }
          },
          {
            "@type": "Question",
            "name": "Can I practice in Hinglish?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Haan bilkul! Indian campus placement interviewers test technical concepts, not Shakespearean English. MockMate's AI understands natural technical Hinglish. You can speak or type in English or Hinglish without penalty — evaluation focuses on problem-solving logic and core concepts."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Structured data injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b border-slate-900">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HeroInteractive />
        </div>
      </section>

      {/* 2. PROBLEM / BENEFIT STRIP */}
      <section className="py-12 bg-slate-900/50 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-base">Practice Without Nervousness</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Simulate high-pressure campus placement rounds in private until your responses feel natural and confident.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-base">Know Exactly What to Fix</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Get actionable metrics on structure, code complexity, and clarity instead of vague polite rejection emails.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 text-base">DSA + HR + Core CS Coverage</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Target service drive patterns (TCS, Infosys) or deep product problem solving (Amazon, startups) with one tool.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (3 STEPS) */}
      <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            Simple 3-Step Routine
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            How to prepare with MockMate
          </h2>
          <p className="text-slate-400 mt-3 text-base sm:text-lg">
            Go from zero confidence to interview-ready in three straightforward steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="flex flex-col p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg mb-5 shadow-lg shadow-indigo-600/30">
              1
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Choose your target drive</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pick your target role (Software Engineer, Backend, Frontend, QA), company type (Service or Product), and difficulty level.
            </p>
            <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-indigo-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Tailors questions to campus syllabus
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg mb-5 shadow-lg shadow-indigo-600/30">
              2
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Take the AI interview</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Speak or type answers, write live code, and respond to smart follow-up questions tailored to your previous responses.
            </p>
            <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-indigo-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Practice mode or Proctored mode
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg mb-5 shadow-lg shadow-indigo-600/30">
              3
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Get score & improvement report</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Review your composite score out of 100, spot logical flaws, inspect ideal solution references, and practice again.
            </p>
            <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-indigo-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Instant feedback within 30 seconds
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES GRID (MAX 6 CARDS) */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 mb-3">
              Engineered For Campus Placement
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Everything you need to clear the round
            </h2>
            <p className="text-slate-400 mt-2 text-base">
              Designed specifically around the hiring rounds of top tier recruiters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition group">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">Live Coding & DSA Editor</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Write, run, and debug your code live in Python, Java, C++, or JavaScript with syntax highlight.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition group">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">Real Proctoring Simulation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Simulate actual company test environments with tab-switch limits, fullscreen locks, and strike counters.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition group">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">Context-Aware Follow-ups</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The AI probes your time complexity and edge cases like an interviewer rather than reading static scripts.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition group">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">Instant 100-Point Report</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Inspect clear metrics for technical correctness, clarity, and foundational CS concepts.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition group">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">Resume-Based Questioning</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload your resume to receive tailored questions on your exact projects, tech stack, and internships.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition group">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1.5">Available 24/7 On Any Device</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Practice late at night before your campus drive from any mobile phone, tablet, or laptop browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SAMPLE FEEDBACK REPORT PREVIEW */}
      <section id="sample-report" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            Transparency
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            What your feedback report looks like
          </h2>
          <p className="text-slate-400 mt-2 text-base">
            Every mock interview generates a detailed report within 30 seconds of submission.
          </p>
        </div>

        {/* Report Card Mockup */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 overflow-hidden relative">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                Sample report
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Frontend & DSA Mock Interview — SDE-1
              </h3>
              <p className="text-xs text-slate-400">Duration: 24 mins • Target: Tier-1 Product Company</p>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs text-slate-400 font-medium">Composite Score</div>
                <div className="text-2xl font-bold text-emerald-400">84 / 100</div>
              </div>
              <Award className="w-7 h-7 text-emerald-400 shrink-0" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="text-xs text-slate-400">Problem Solving & DSA</div>
              <div className="text-lg font-bold text-white mt-0.5">88%</div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="w-[88%] h-full bg-emerald-500 rounded-full" />
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="text-xs text-slate-400">Technical Clarity & Core CS</div>
              <div className="text-lg font-bold text-white mt-0.5">82%</div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="w-[82%] h-full bg-indigo-500 rounded-full" />
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="text-xs text-slate-400">Communication & Structure</div>
              <div className="text-lg font-bold text-white mt-0.5">81%</div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="w-[81%] h-full bg-cyan-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* 3 Actionable Tips */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Top 3 Specific Improvement Tips
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-sm">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div className="text-slate-300 leading-snug">
                  <strong className="text-white font-medium">State time & space bounds first:</strong> In the Two-Pointer question, you jumped directly into code. State your proposed O(N) time and O(1) auxiliary space before typing.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-sm">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div className="text-slate-300 leading-snug">
                  <strong className="text-white font-medium">Cover boundary edge cases explicitly:</strong> Make sure to mention behavior on empty arrays and duplicate values before concluding your solution.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-sm">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div className="text-slate-300 leading-snug">
                  <strong className="text-white font-medium">Structure HR questions with STAR:</strong> When asked about your final year project conflict, describe the specific Situation and measurable Result rather than generic teamwork statements.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRUST & PRIVACY */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <Lock className="w-3.5 h-3.5" /> Honest Privacy Guarantee
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Your privacy always comes first
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              We build tools to empower students, not to harvest sensitive personal recordings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">On-Device Face Processing</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  In Proctored Mode, camera frames are evaluated locally in your browser. Video streams are never sent or stored on our servers.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Practice Mode Without Camera</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Prefer practicing with zero camera permissions? Switch to Practice Mode anytime with a single toggle.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">Standard Integrity Signals</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Only metadata (tab switch count, fullscreen status) is logged to build your report. No background keylogging.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-white">You Control Your History</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Delete your past interview records, resumes, or profile data whenever you wish directly from your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            Transparent Indian Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Affordable for every student budget
          </h2>
          <p className="text-slate-400 mt-2 text-base">
            Start completely free. Pay only as you practice more. No recurring monthly subscriptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1: Free Trial */}
          <div className="flex flex-col p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 relative hover:border-slate-700 transition">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Free Trial
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">₹0</span>
              <span className="text-sm text-slate-400">/ forever</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Ideal to experience an authentic AI interview before your drive.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                1 complete mock interview credit
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Instant 100-point feedback report
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Practice & Proctored mode access
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                No credit/debit card required
              </li>
            </ul>

            <div className="mt-8 pt-4 border-t border-slate-800">
              <Link
                href="/register"
                className="block w-full py-2.5 px-4 rounded-xl text-center font-medium text-sm bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Sign up free
              </Link>
            </div>
          </div>

          {/* Tier 2: Starter Pack (Highlighted) */}
          <div className="flex flex-col p-6 sm:p-8 rounded-2xl bg-indigo-950/30 border-2 border-indigo-500 relative shadow-xl shadow-indigo-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white">
              Most Popular
            </div>
            <div className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
              Starter Pack
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">₹99</span>
              <span className="text-sm text-slate-400">one-time</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Great for cracking 1-2 upcoming company placement drives.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <strong>3 full-length interview credits</strong>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Just ₹33 per full interview
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                All technical & HR rounds
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Credits never expire
              </li>
            </ul>

            <div className="mt-8 pt-4 border-t border-indigo-900/60">
              <Link
                href="/register?plan=starter"
                className="block w-full py-2.5 px-4 rounded-xl text-center font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30"
              >
                Get 3 interviews for ₹99
              </Link>
            </div>
          </div>

          {/* Tier 3: Placement Pro */}
          <div className="flex flex-col p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 relative hover:border-slate-700 transition">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Placement Pro
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-white">₹249</span>
              <span className="text-sm text-slate-400">one-time</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Complete season preparation covering service and product companies.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <strong>10 full-length interview credits</strong>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Just ₹24.9 per full interview
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Resume Tailor analysis included
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Priority AI response generation
              </li>
            </ul>

            <div className="mt-8 pt-4 border-t border-slate-800">
              <Link
                href="/register?plan=pro"
                className="block w-full py-2.5 px-4 rounded-xl text-center font-medium text-sm bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Get 10 interviews for ₹249
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SOCIAL PROOF SECTION (Strictly conditionally rendered) */}
      <SocialProofSection />

      {/* 9. FAQ ACCORDION (6 precise items) */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 mb-3">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 mt-2 text-base">
            Everything you need to know about MockMate before taking your first interview.
          </p>
        </div>

        <FaqAccordion />
      </section>

      {/* 10. FINAL CALL-TO-ACTION BAND */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-indigo-950/40 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Crack your campus placement with confidence
          </h2>
          <p className="text-slate-300 mt-4 max-w-xl mx-auto text-base sm:text-lg">
            Join thousands of engineering students practicing technical and HR rounds on MockMate.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-base bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 group"
            >
              Start your free mock interview
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            1 free interview credit included • No credit or debit card required
          </p>
        </div>
      </section>

      {/* Sticky Mobile CTA for mobile viewports */}
      <StickyMobileCTA />
    </div>
  );
}
