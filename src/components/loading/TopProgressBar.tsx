"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * TopProgressBar renders a subtle 2.5px progress bar at the very top of the viewport
 * during client-side route navigation.
 */
export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or search params change, complete navigation
  useEffect(() => {
    if (active) {
      setProgress(100);
      const timer = setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept local link clicks to trigger progress immediately
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Check if it's an internal standard navigation
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("//") &&
        targetAttr !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // Only trigger if destination is different from current URL
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl && !href.startsWith("#")) {
          setActive(true);
          setProgress(25);
          // Increment smoothly
          const t1 = setTimeout(() => setProgress(55), 120);
          const t2 = setTimeout(() => setProgress(75), 350);
          const t3 = setTimeout(() => setProgress(88), 700);
          return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
          };
        }
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!active && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label="Page navigation progress"
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none transition-all duration-200 ease-out"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
      }}
    >
      <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
    </div>
  );
}
