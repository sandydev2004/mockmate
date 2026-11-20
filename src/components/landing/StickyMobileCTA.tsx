"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayCircle, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const [registerUrl, setRegisterUrl] = useState("/register");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search) setRegisterUrl(`/register${search}`);

      const handleScroll = () => {
        // Show after scrolling past 380px (past hero buttons)
        if (window.scrollY > 380) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-200">
      <Link
        href={registerUrl}
        onClick={() => trackEvent("sticky_mobile_cta_clicked", { destination: registerUrl })}
        className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-indigo-600 active:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/30"
      >
        <div className="flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-indigo-200" />
          <span>Start Free Mock Interview</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-indigo-100 font-semibold">
          <span>1 Free Credit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>
    </div>
  );
}
