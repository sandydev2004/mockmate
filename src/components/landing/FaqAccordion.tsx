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
      "Yes. Every new candidate gets 1 full mock interview credit on registration with complete access to real AI interviewers, live code compiler, and an in-depth score report. No credit card or payment info is ever required to practice.",
  },
  {
    id: "faq-camera",
    question: "Do I need a camera?",
    answer:
      "Only if you choose Proctored mode to simulate strict placement portal conditions (like TCS iON or Mercer Mettl). If you prefer practicing casually or don't have a webcam, simply toggle Practice mode, which requires zero camera and no fullscreen enforcement. In Proctored mode, video is analyzed 100% locally on your device — video is never uploaded or saved.",
  },
  {
    id: "faq-resume",
    question: "Is my resume safe?",
    answer:
      "Absolutely. Your resume is parsed strictly in memory to extract your listed projects and technical skills so the AI can ask relevant cross-questions. Your data is encrypted, never shared or sold, and you can delete your uploaded resumes and past interview logs anytime.",
  },
  {
    id: "faq-rounds",
    question: "Which companies and rounds are covered?",
    answer:
      "MockMate covers SDE, Data/ML, and Core engineering placements across service companies (TCS, Infosys, Wipro, Cognizant), product firms (Amazon, Swiggy, Flipkart), and fast-growing tech startups. We support DSA Coding, CS Fundamentals (OS/DBMS/CN), System Design, and HR Behavioral rounds.",
  },
  {
    id: "faq-mobile",
    question: "Does it work on mobile?",
    answer:
      "Yes. MockMate is built mobile-first. You can take conversational and conceptual interviews, dictate code solutions via voice or text, and review detailed placement reports right from your smartphone.",
  },
  {
    id: "faq-hinglish",
    question: "Can I practice in Hinglish?",
    answer:
      "Yes. While professional campus interviews typically use English, the AI interviewer understands natural bilingual technical Hinglish commonly spoken by Indian engineering students. You can ask for problem clarifications or explain your logic in Hinglish without being penalized.",
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
