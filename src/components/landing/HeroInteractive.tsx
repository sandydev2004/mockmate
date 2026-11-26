"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Cpu,
  Code2,
  FileText,
  Languages,
} from "lucide-react";
import { trackEvent, trackFunnel } from "@/lib/analytics";

export function HeroInteractive() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [registerUrl, setRegisterUrl] = useState("/register");

  useEffect(() => {
    // Preserve referral & UTM parameters
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search) {
        setRegisterUrl(`/register${search}`);
      }
      trackFunnel("landing_view", { lang });
    }
  }, [lang]);

  const handleHeroCtaClick = () => {
    trackEvent("hero_cta_clicked", { lang, destination: registerUrl });
    router.push(registerUrl);
  };

  const content = {
    en: {
      tag: "Built for Indian Engineering Campus Placements",
      headline: "Crack your campus placement with AI mock interviews",
      subheadline:
        "Practice realistic DSA coding, Core CS, and HR rounds with instant feedback. Practice in English or Hinglish.",
      cta: "Start your free mock interview",
      secondary: "See how it works",
      guarantee: "1 free interview, no card needed",
      problemTitle: "Interview Problem #14: Longest Substring Without Repeating Characters",
      problemBadge: "Medium • Amazon / TCS Digital Style",
      aiMessage:
        "Welcome Rahul! Let's start with a sliding window approach. How would you solve this with O(n) time complexity?",
      userAnswer:
        "We can maintain a hash map of character indices and move the left window pointer whenever a duplicate character is encountered...",
      evalScore: "84 / 100",
      evalStatus: "Shortlist Ready",
    },
    hi: {
      tag: "Desi Engineering Students Ke Campus Placement Ke Liye",
      headline: "Apni campus placement crack karo realistic AI mock interviews ke saath",
      subheadline:
        "DSA coding, CS fundamentals aur HR rounds ki tayaari karo real campus drive atmosphere mein, instant score aur feedback ke saath.",
      cta: "Start your free mock interview",
      secondary: "See how it works",
      guarantee: "1 free interview, bina credit card ke",
      problemTitle: "Interview Problem #14: Longest Substring Without Repeating Characters",
      problemBadge: "Medium • Amazon / TCS Digital Style",
      aiMessage:
        "Welcome Rahul! Sliding window approach se shuru karte hain. O(n) time complexity ke saath kaise solve karoge?",
      userAnswer:
        "Hash map mein character index store karke window update karenge jab bhi duplicate character encounter hoga...",
      evalScore: "84 / 100",
      evalStatus: "Shortlist Ready",
    },
  };

  const t = content[lang];

  return (
    <div className="space-y-10">
      {/* Top Tag & Language Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t.tag}</span>
        </div>

        {/* English / Hinglish Toggle */}
        <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              lang === "en"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang("hi")}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              lang === "hi"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Hinglish
          </button>
        </div>
      </div>

      {/* Hero Headline & Subheadline */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
          {lang === "en" ? (
            <>
              Crack your campus placement interview with{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                AI mock interviews
              </span>
            </>
          ) : (
            <>
              Apni campus placement crack karo{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                realistic AI mock interviews
              </span>{" "}
              ke saath
            </>
          )}
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t.subheadline}
        </p>
      </div>

      {/* Call To Action Buttons */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={handleHeroCtaClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <PlayCircle className="w-5 h-5" />
            <span>{t.cta}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#how-it-works"
            className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-2 rounded-lg transition-colors"
          >
            {t.secondary} &darr;
          </a>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {t.guarantee}
        </p>
      </div>

      {/* Realistic Styled Product Preview (Interview Room + Feedback Card) */}
      <div className="max-w-5xl mx-auto pt-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-left">
          {/* Mock Browser/App Header */}
          <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                mockmate.ai/interview/live-session
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                DSA Round
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Camera: Verified On-Device
              </span>
            </div>
          </div>

          {/* Product UI Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Left Col: Interview Conversation & Code Runner (7 Cols) */}
            <div className="lg:col-span-7 p-5 sm:p-6 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {t.problemBadge}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {t.problemTitle}
                </h2>
              </div>

              {/* AI Interviewer bubble */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">MockMate Interviewer</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {t.aiMessage}
                  </p>
                </div>
              </div>

              {/* Candidate Answer Box / Code Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>solution.cpp (C++20)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                    ✓ All 12/12 Test Cases Passed (4ms)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed border border-slate-800">
                  <p><span className="text-purple-400">int</span> lengthOfLongestSubstring(<span className="text-purple-400">string</span> s) &#123;</p>
                  <p className="pl-4 text-slate-400">// Sliding window with last seen character index map</p>
                  <p className="pl-4">unordered_map&lt;<span className="text-purple-400">char</span>, <span className="text-purple-400">int</span>&gt; last_idx;</p>
                  <p className="pl-4"><span className="text-purple-400">int</span> max_len = 0, left = 0;</p>
                  <p className="pl-4"><span className="text-amber-400">for</span> (<span className="text-purple-400">int</span> right = 0; right &lt; s.size(); right++) &#123;</p>
                  <p className="pl-8"><span className="text-amber-400">if</span> (last_idx.count(s[right])) left = max(left, last_idx[s[right]] + 1);</p>
                  <p className="pl-8">last_idx[s[right]] = right;</p>
                  <p className="pl-8">max_len = max(max_len, right - left + 1);</p>
                  <p className="pl-4">&#125;</p>
                  <p className="pl-4"><span className="text-amber-400">return</span> max_len;</p>
                  <p>&#125;</p>
                </div>
              </div>
            </div>

            {/* Right Col: Instant Evaluation Summary (5 Cols) */}
            <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-950/40 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Instant AI Evaluation
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {t.evalStatus}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Placement Readiness Score</p>
                    <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{t.evalScore}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Algorithm Correctness</span>
                    <span className="font-bold text-slate-900 dark:text-white">9 / 10</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[90%]" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600 dark:text-slate-400">Communication & Explanation</span>
                    <span className="font-bold text-slate-900 dark:text-white">8.5 / 10</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full w-[85%]" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600 dark:text-slate-400">Time Complexity Mastery</span>
                    <span className="font-bold text-slate-900 dark:text-white">8 / 10</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full w-[80%]" />
                  </div>
                </div>
              </div>

              {/* Sample Actionable Insight */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                <p className="font-bold">Interviewer Feedback Tip:</p>
                <p className="text-slate-700 dark:text-slate-300">
                  Explicitly state the O(1) space complexity of the fixed character set before coding to impress interviewers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
