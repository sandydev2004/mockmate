"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-free",
    question: "Is it really free?",
    answer:
      "Yes, completely! Every new engineering student gets 1 free full-length mock interview credit right upon signup. You get full access to the AI interviewer, live code editor, proctoring simulation, and the complete 100-point performance feedback report. No credit card, debit card, or UPI details are ever asked.",
  },
  {
    id: "faq-camera",
    question: "Do I need a camera?",
    answer:
      "No, a camera is never mandatory! You can choose between two modes before starting: 1) Practice Mode: 100% camera-free and relaxed, with no fullscreen locks — perfect for quick practice in your hostel room or on mobile. 2) Proctored Mode: Simulates strict campus test conditions (like TCS iON or Mercer Mettl). Even in Proctored Mode, face and presence detection is processed purely on-device inside your browser. Your camera video is NEVER recorded, uploaded, or stored on our servers.",
  },
  {
    id: "faq-resume",
    question: "Is my resume safe?",
    answer:
      "100% safe and private. When you upload your resume (PDF), our parser strictly extracts your listed projects, technical skills, and internships in memory so the AI interviewer can ask relevant cross-questions — exactly like a real hiring manager would. Your resume data is encrypted, never shared or sold to third-party recruiters, and you can delete your uploaded resumes and interview logs anytime with one click.",
  },
  {
    id: "faq-rounds",
    question: "Which companies and rounds are covered?",
    answer:
      "MockMate covers tailored interview styles across both Service and Product company hiring patterns: Service Giants (TCS NQT/Digital, Infosys DSE/SP, Wipro Turbo, Cognizant GenC), Tier-1 Product Companies (Amazon, Microsoft, Swiggy), and High-growth Tech Startups (CRED, Zepto, Razorpay). We support DSA Coding rounds (with in-browser compilation), CS Fundamentals (OS, DBMS, Networks, OOPs), System Design (HLD/LLD), and HR / Behavioral rounds (STAR framework).",
  },
  {
    id: "faq-mobile",
    question: "Does it work on mobile?",
    answer:
      "Yes! MockMate is designed mobile-first. You can comfortably take conversational CS fundamentals and HR rounds directly from your smartphone browser (Chrome, Safari, Brave). You can type or use voice dictation to answer questions, and view your interactive scorecards anywhere. For hands-on coding rounds, a laptop is recommended for typing code, but you can still practice problem analysis and logic on phone.",
  },
  {
    id: "faq-hinglish",
    question: "Can I practice in Hinglish?",
    answer:
      "Haan bilkul! Indian campus placement drives mein interviewer technical concepts test karte hain, na ki Shakespearean English. MockMate's AI interviewer is trained to understand everyday technical Hinglish (e.g., 'Maine pehle brute force socha, fir hashmap se O(n) optimize kiya'). You can speak or type in English or Hinglish without any penalty — our evaluation focuses on your problem-solving logic, communication clarity, and core concepts.",
  },
];

export function FaqAccordion() {
  const [openId, setOpenId] = useState<string | null>("faq-free");

  const toggleFaq = (id: string) => {
    const nextState = openId === id ? null : id;
    setOpenId(nextState);
    if (nextState) {
      trackEvent("faq_opened", { faq_id: id });
    }
  };

  return (
    <div className="space-y-3 max-w-3xl mx-auto text-left">
      {FAQS.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden transition-colors"
          >
            <button
              type="button"
              onClick={() => toggleFaq(faq.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 gap-4"
            >
              <span>{faq.question}</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 mt-1 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
