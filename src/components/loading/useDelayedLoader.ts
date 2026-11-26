"use client";

import { useEffect, useState } from "react";

interface DelayedLoaderOptions {
  delay?: number;
  minDuration?: number;
}

/**
 * useDelayedLoader avoids UI flicker by delaying the appearance of a loader
 * by `delay` ms (default 200ms). If `loading` turns false before `delay`, the loader
 * is never shown. Once shown, it stays visible for at least `minDuration` ms (default 400ms).
 */
export function useDelayedLoader(
  loading: boolean,
  { delay = 200, minDuration = 400 }: DelayedLoaderOptions = {}
): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout | null = null;
    let minTimer: NodeJS.Timeout | null = null;
    let startTime = 0;

    if (loading) {
      delayTimer = setTimeout(() => {
        startTime = Date.now();
        setShow(true);
      }, delay);
    } else {
      if (show) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDuration - elapsed);
        minTimer = setTimeout(() => {
          setShow(false);
        }, remaining);
      } else {
        setShow(false);
      }
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minTimer) clearTimeout(minTimer);
    };
  }, [loading, delay, minDuration, show]);

  return show;
}
