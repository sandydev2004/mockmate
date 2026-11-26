"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  Check,
  ShieldCheck,
  CreditCard,
  Languages,
  CheckCircle2,
} from "lucide-react";
import { BuyButton } from "@/components/BuyButton";
import { CREDIT_PACKS } from "@/lib/razorpay";
import { trackEvent } from "@/lib/analytics";
import { isAdminRole } from "@/lib/admin-permissions";

export default function PricingPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [user, setUser] = useState<{ id: string; email: string; full_name?: string | null } | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Load session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setCredits(data.user.credits);
          setUserRole(data.user.role || "user");
        }
      })
      .catch(() => {});

    // Track pricing viewed
    trackEvent("pricing_viewed", { lang });
  }, [lang]);

  const starter = CREDIT_PACKS.starter;
  const pro = CREDIT_PACKS.pro;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 space-y-12">
      {/* Top Banner & Language Selector */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>
              {lang === "hi"
                ? "Transparent Student Pricing in INR (₹) • No Subscriptions"
                : "Transparent Student Pricing in INR (₹) • One-Time Payment"}
            </span>
          </div>

          {/* Language Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                lang === "en"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400"
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
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Hinglish
            </button>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          {lang === "hi" ? (
            <>
              Apne Campus Placement Ke Liye{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Affordable Packs
              </span>
            </>
          ) : (
            <>
              Affordable Credit Packs for{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Engineering Placements
              </span>
            </>
          )}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          {lang === "hi"
            ? "Har credit se aap ek complete 6-8 question technical/HR mock interview le sakte hain with code runner aur instant placement score card. Koi monthly recharge ya subscription nahi."
            : "1 interview credit unlocks 1 complete mock interview session (DSA, CS Fundamentals, or HR) with code execution and comprehensive feedback report. Credits never expire."}
        </p>

        {/* User credits status banner */}
        {user && credits !== null && (
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shadow-sm">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>
                {isAdminRole(userRole)
                  ? "Admin account: Unlimited interview credits active"
                  : `Your Balance: ${credits} Interview ${credits === 1 ? "Credit" : "Credits"} Available`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {/* Card 1: Free Trial (Always 1 free credit for new users) */}
        <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {lang === "hi" ? "Har Naye User Ke Liye" : "Free Onboarding"}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {lang === "hi" ? "Free Mock Trial" : "Free Trial"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === "hi"
                  ? "Sign up karte hi 1 free credit milta hai bina card details ke."
                  : "Every registered engineering candidate gets 1 free interview."}
              </p>
            </div>

            <div className="flex items-baseline gap-1 pt-2">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹0</span>
              <span className="text-xs text-slate-500 font-medium">/ 1 Free Credit</span>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {lang === "hi" ? "Isme kya included hai:" : "Includes:"}
              </span>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                {[
                  lang === "hi" ? "1 Full Mock Interview (Kisi bhi round ka)" : "1 Full 6-8 question mock interview",
                  lang === "hi" ? "DSA Code Editor + Judge0 execution" : "Monaco editor + test case runner",
                  lang === "hi" ? "Instant Placement Score & Weakness analysis" : "Instant score report & feedback",
                  lang === "hi" ? "English ya Hinglish mode" : "English & Hinglish dual input",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4">
            {user ? (
              <Link
                href="/interview/setup"
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
              >
                {lang === "hi" ? "Interview Shuru Karein" : "Start Mock Interview"}
              </Link>
            ) : (
              <Link
                href="/register"
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
              >
                {lang === "hi" ? "Sign Up & Get 1 Free Credit" : "Sign Up & Claim 1 Free Credit"}
              </Link>
            )}
          </div>
        </div>

        {/* Card 2: Starter Pack (₹99 = 3 Credits) */}
        <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {lang === "hi" ? "Popular for Quick Practice" : "Best for Upcoming Drive"}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {lang === "hi" ? starter.nameHinglish : starter.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === "hi" ? starter.descriptionHinglish : starter.description}
              </p>
            </div>

            <div className="flex items-baseline gap-1.5 pt-2">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹{starter.price}</span>
              <span className="text-xs text-slate-500 font-semibold">
                (₹{Math.round(starter.price / starter.credits)} / interview)
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {lang === "hi" ? "Included Features:" : "What's included:"}
              </span>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                {(lang === "hi" ? starter.featuresHinglish : starter.features).map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4">
            {isAdminRole(userRole) ? (
              <div className="py-3 px-4 rounded-xl text-center text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Admin: Unlimited Access
              </div>
            ) : (
              <BuyButton
                packId="starter"
                user={user}
                isLoggedIn={Boolean(user?.id)}
                lang={lang}
                variant="outline"
                className="py-3 px-4 text-xs font-bold"
              />
            )}
          </div>
        </div>

        {/* Card 3: Pro Pack (₹249 = 10 Credits + Unlocks Resume Tailor) */}
        <div className="p-7 rounded-2xl bg-gradient-to-b from-indigo-50/80 via-white to-purple-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/20 border-2 border-indigo-600 dark:border-indigo-500 shadow-xl shadow-indigo-600/10 flex flex-col justify-between space-y-6 relative">
          {/* Most Popular Badge */}
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
            <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-600 text-white shadow-md uppercase tracking-wider">
              <Sparkles className="w-3 h-3 fill-white" />
              {lang === "hi" ? "Placement Pro Pack" : "Most Popular"}
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {lang === "hi" ? "Full Preparation Suite" : "Maximum Value"}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {lang === "hi" ? pro.nameHinglish : pro.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === "hi" ? pro.descriptionHinglish : pro.description}
              </p>
            </div>

            <div className="flex items-baseline gap-1.5 pt-2">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹{pro.price}</span>
              <span className="text-xs text-slate-500 font-semibold">
                (₹{Math.round(pro.price / pro.credits)} / interview)
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {lang === "hi" ? "Sabhi Pro Features Included:" : "Everything in Starter plus:"}
              </span>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                {(lang === "hi" ? pro.featuresHinglish : pro.features).map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span className={feat.includes("Resume") ? "font-bold text-slate-900 dark:text-white" : ""}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4">
            {isAdminRole(userRole) ? (
              <div className="py-3 px-4 rounded-xl text-center text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Admin: Unlimited Access
              </div>
            ) : (
              <BuyButton
                packId="pro"
                user={user}
                isLoggedIn={Boolean(user?.id)}
                lang={lang}
                variant="primary"
                className="py-3 px-4 text-xs font-bold"
              />
            )}
          </div>
        </div>
      </div>

      {/* Trust & Guarantee strip */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">UPI, Cards & Netbanking</h4>
            <p className="text-[11px] text-slate-500">Pay securely via Razorpay standard gateway</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Zero Hidden Charges</h4>
            <p className="text-[11px] text-slate-500">One-time payment, no recurring auto-debit</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Credits Never Expire</h4>
            <p className="text-[11px] text-slate-500">Practice whenever your campus placement drives happen</p>
          </div>
        </div>
      </div>
    </div>
  );
}
