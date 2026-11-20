"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IntegrityEventType, ProctoringMode, TypingIntegrityMetrics } from "@/types";

export interface ProctoringConfig {
  maxStrikes?: number;
  fullscreenGraceSeconds?: number;
  maxAwaySeconds?: number;
  blurGraceSeconds?: number;
  cameraGraceSeconds?: number;
  strictSingleMonitor?: boolean;
}

export interface UseProctoringOptions {
  interviewId: string;
  mode: ProctoringMode;
  isFinished: boolean;
  onAutoSubmit: (reason: string) => Promise<void>;
  config?: ProctoringConfig;
}

export function useProctoring({
  interviewId,
  mode,
  isFinished,
  onAutoSubmit,
  config,
}: UseProctoringOptions) {
  const router = useRouter();

  // Environment / configured thresholds with solid defaults
  const MAX_STRIKES =
    config?.maxStrikes ??
    parseInt(process.env.NEXT_PUBLIC_MAX_STRIKES || "3", 10);
  const FULLSCREEN_GRACE_SECONDS =
    config?.fullscreenGraceSeconds ??
    parseInt(process.env.NEXT_PUBLIC_FULLSCREEN_GRACE_SECONDS || "15", 10);
  const MAX_AWAY_SECONDS =
    config?.maxAwaySeconds ??
    parseInt(process.env.NEXT_PUBLIC_MAX_AWAY_SECONDS || "20", 10);
  const BLUR_GRACE_SECONDS =
    config?.blurGraceSeconds ??
    parseInt(process.env.NEXT_PUBLIC_BLUR_GRACE_SECONDS || "2", 10);
  const CAMERA_GRACE_SECONDS =
    config?.cameraGraceSeconds ??
    parseInt(process.env.NEXT_PUBLIC_CAMERA_GRACE_SECONDS || "10", 10);
  const STRICT_SINGLE_MONITOR =
    config?.strictSingleMonitor ??
    (process.env.NEXT_PUBLIC_STRICT_SINGLE_MONITOR === "true");

  const isProctored = mode === "proctored";

  // Session Token (per tab/device uniqueness)
  const [sessionToken, setSessionToken] = useState<string>("");
  const [isDuplicateBlocked, setIsDuplicateBlocked] = useState<boolean>(false);

  // Shared state
  const [strikes, setStrikes] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
  const [fullscreenCountdown, setFullscreenCountdown] = useState<number | null>(null);
  const [awayCountdown, setAwayCountdown] = useState<number | null>(null);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);

  // Modal & Banner state
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    strikeNumber?: number;
    category: "fullscreen" | "tab" | "camera" | "paste" | "strike" | "session" | "monitor";
  } | null>(null);

  const [activeBanner, setActiveBanner] = useState<{
    message: string;
    countdown?: number;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Tracking refs to ensure exact 1-to-1 event deduplication
  const strikesRef = useRef<number>(0);
  const isAutoSubmittingRef = useRef<boolean>(false);
  const isAppActionRef = useRef<boolean>(false);

  // Fullscreen tracking refs
  const inFullscreenViolationRef = useRef<boolean>(false);
  const fullscreenTargetTimeRef = useRef<number | null>(null);

  // Away / Tab blur tracking refs
  const awayStartTimeRef = useRef<number | null>(null);
  const awayTargetTimeRef = useRef<number | null>(null);
  const inAwayViolationRef = useRef<boolean>(false);

  // Camera tracking refs
  const cameraAbsentStartTimeRef = useRef<number | null>(null);
  const cameraTargetTimeRef = useRef<number | null>(null);
  const inCameraViolationRef = useRef<boolean>(false);

  // Environment checks flags (run once per session)
  const monitorCheckedRef = useRef<boolean>(false);
  const devtoolsLoggedRef = useRef<boolean>(false);
  const extensionUiLoggedRef = useRef<boolean>(false);

  // Typing & Input Integrity Tracking (Aggregates only - NO KEYLOGGING)
  const typingMetricsRef = useRef<{
    keystrokes: number;
    startTime: number | null;
    firstKeystrokeTime: number | null;
    lastKeystrokeTime: number | null;
    longestPauseMs: number;
    recentBurstChars: number;
    lastBurstTime: number;
  }>({
    keystrokes: 0,
    startTime: null,
    firstKeystrokeTime: null,
    lastKeystrokeTime: null,
    longestPauseMs: 0,
    recentBurstChars: 0,
    lastBurstTime: 0,
  });

  // Initialize unique session token in sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `mockmate_session_${interviewId}`;
    let token = sessionStorage.getItem(storageKey);
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem(storageKey, token);
    }
    setSessionToken(token);
  }, [interviewId]);

  // 1. Centralized Log Helper
  const logEvent = useCallback(
    async (eventType: IntegrityEventType, details?: Record<string, any>) => {
      try {
        await fetch("/api/interview/integrity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interview_id: interviewId,
            event_type: eventType,
            details,
          }),
        });
      } catch (err) {
        // Network blip, continue
      }
    },
    [interviewId]
  );

  // 2. Centralized Auto-Submit Trigger (Idempotent single execution)
  const triggerAutoSubmit = useCallback(
    async (reason: string) => {
      if (isAutoSubmittingRef.current || isFinished) return;
      isAutoSubmittingRef.current = true;
      isAppActionRef.current = true;

      setWarningModal(null);
      setActiveBanner(null);

      await logEvent("auto_submit", { reason, strikes: strikesRef.current });
      await onAutoSubmit(reason);
    },
    [isFinished, logEvent, onAutoSubmit]
  );

  // 3. Centralized Strike Manager
  const addStrike = useCallback(
    (reason: string, category: "fullscreen" | "tab" | "camera" | "paste" | "strike" | "session" | "monitor") => {
      if (!isProctored || isFinished || isAutoSubmittingRef.current) return;

      const newStrikes = strikesRef.current + 1;
      strikesRef.current = newStrikes;
      setStrikes(newStrikes);

      logEvent("strike_added", { strikes: newStrikes, reason, category });

      if (newStrikes >= MAX_STRIKES) {
        triggerAutoSubmit("auto_submitted_strikes");
      } else {
        setWarningModal({
          isOpen: true,
          title: newStrikes === MAX_STRIKES - 1 ? "Final Warning!" : "Integrity Warning",
          message: `${reason} This has been recorded as Strike ${newStrikes} of ${MAX_STRIKES}.`,
          strikeNumber: newStrikes,
          category,
        });
      }
    },
    [isProctored, isFinished, MAX_STRIKES, logEvent, triggerAutoSubmit]
  );

  // 4. Request Fullscreen Handler (compliant user gesture)
  const requestFullscreen = useCallback(async () => {
    isAppActionRef.current = true;
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      inFullscreenViolationRef.current = false;
      fullscreenTargetTimeRef.current = null;
      setFullscreenCountdown(null);
      setActiveBanner(null);
    } catch (err) {
      // Continue even if rejected
    } finally {
      setTimeout(() => {
        isAppActionRef.current = false;
      }, 500);
    }
  }, []);

  // 5. Clear leftover copied text on interview start gesture
  const clearClipboardSilently = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText("");
      }
    } catch {
      // Ignore failures silently
    }
  }, []);

  // 6. COPY / SHORTCUT PROTECTION
  useEffect(() => {
    if (isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Blocked keyboard shortcuts:
      // Ctrl/Cmd + C, X, P, S, U
      // F12
      // Ctrl+Shift+I, J, C
      const isDevToolsCombo =
        e.key === "F12" ||
        (isCtrlOrMeta && e.shiftKey && ["i", "j", "c"].includes(key));
      const isProhibitedCtrl =
        isCtrlOrMeta && !e.shiftKey && ["c", "x", "p", "s", "u"].includes(key);

      if (isDevToolsCombo || isProhibitedCtrl) {
        e.preventDefault();
        e.stopPropagation();

        if (isProctored) {
          logEvent("shortcut_blocked", {
            key: e.key,
            ctrl: isCtrlOrMeta,
            shift: e.shiftKey,
          });
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isFinished, isProctored, logEvent]);

  // 7. ENVIRONMENT CHECKS (Extended Display, DevTools Heuristic, Injected Overlays)
  useEffect(() => {
    if (isFinished || !isProctored) return;

    // Check 1: Multi-Monitor Extended Screen
    if (!monitorCheckedRef.current && typeof window !== "undefined") {
      const screenAny = window.screen as any;
      if (screenAny?.isExtended === true) {
        monitorCheckedRef.current = true;
        logEvent("multiple_monitors", { isExtended: true });

        if (STRICT_SINGLE_MONITOR) {
          addStrike("Multiple monitors detected while strict single-monitor mode is required.", "monitor");
        } else {
          setWarningModal({
            isOpen: true,
            title: "Multiple Monitors Detected",
            message:
              "An extended display was detected. In official placement tests, please disconnect secondary monitors to avoid proctoring flags.",
            category: "monitor",
          });
        }
      }
    }

    // Check 2: Automation detection
    if (navigator.webdriver && !extensionUiLoggedRef.current) {
      extensionUiLoggedRef.current = true;
      logEvent("suspicious_extension_ui", { reason: "navigator.webdriver is active" });
    }

    // Check 3: DevTools Window Size Differential Heuristic
    const checkDevTools = () => {
      if (devtoolsLoggedRef.current) return;
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        devtoolsLoggedRef.current = true;
        logEvent("devtools_open", {
          outerWidth: window.outerWidth,
          innerWidth: window.innerWidth,
          outerHeight: window.outerHeight,
          innerHeight: window.innerHeight,
        });
      }
    };

    const devtoolsInterval = setInterval(checkDevTools, 2000);

    // Check 4: Injected Extension Overlay DOM MutationObserver
    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver((mutations) => {
        for (const mut of mutations) {
          for (const node of Array.from(mut.addedNodes)) {
            if (node instanceof HTMLElement) {
              const tag = node.tagName.toLowerCase();
              const id = (node.id || "").toLowerCase();
              const cls = (node.className || "").toString().toLowerCase();

              // Ignore known framework/app tags
              if (
                tag === "script" ||
                tag === "style" ||
                id.includes("next") ||
                cls.includes("monaco") ||
                cls.includes("lucide")
              ) {
                continue;
              }

              // Flag obvious external extension overlays
              if (
                id.includes("extension") ||
                cls.includes("extension") ||
                id.includes("copilot") ||
                cls.includes("ai-assistant") ||
                node.getAttribute("data-extension-id")
              ) {
                if (!extensionUiLoggedRef.current) {
                  extensionUiLoggedRef.current = true;
                  logEvent("suspicious_extension_ui", {
                    tag,
                    id: id.slice(0, 30),
                    className: cls.slice(0, 30),
                  });
                }
              }
            }
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      clearInterval(devtoolsInterval);
      observer?.disconnect();
    };
  }, [isFinished, isProctored, STRICT_SINGLE_MONITOR, logEvent, addStrike]);

  // 8. TYPING & INPUT INTEGRITY HELPERS (No Keylogging)
  const recordKeystroke = useCallback(() => {
    const now = Date.now();
    const t = typingMetricsRef.current;
    t.keystrokes += 1;
    if (!t.startTime) t.startTime = now;
    if (!t.firstKeystrokeTime) t.firstKeystrokeTime = now;

    if (t.lastKeystrokeTime) {
      const pause = now - t.lastKeystrokeTime;
      if (pause > t.longestPauseMs) {
        t.longestPauseMs = pause;
      }
    }
    t.lastKeystrokeTime = now;
  }, []);

  const recordInputEvent = useCallback(
    (inputType: string, insertedLength: number, totalLength: number) => {
      if (isFinished || !isProctored) return;
      const now = Date.now();
      const t = typingMetricsRef.current;

      // 1. Detect paste-like input events
      if (
        inputType === "insertFromPaste" ||
        inputType === "insertFromDrop" ||
        inputType === "insertReplacementText"
      ) {
        logEvent("paste_like", { inputType, length: insertedLength });
      }

      // 2. Detect bulk text injection without matching keystrokes
      if (insertedLength >= 20 && t.keystrokes < 3) {
        logEvent("input_injection", {
          char_count: insertedLength,
          keystrokes: t.keystrokes,
          inputType,
        });
      }

      // 3. Track burst timing
      t.recentBurstChars += insertedLength;
      if (now - t.lastBurstTime > 1000) {
        t.recentBurstChars = insertedLength;
        t.lastBurstTime = now;
      }
    },
    [isFinished, isProctored, logEvent]
  );

  const getTypingAggregates = useCallback(
    (finalLength: number, questionStartedAt?: string | null): TypingIntegrityMetrics => {
      const t = typingMetricsRef.current;
      const now = Date.now();
      const durationMs = t.startTime ? now - t.startTime : 0;
      const durationSec = Math.max(1, durationMs / 1000);
      const avgSpeedCps = Number((finalLength / durationSec).toFixed(2));

      const timeToFirstKeystrokeMs =
        t.firstKeystrokeTime && questionStartedAt
          ? Math.max(0, t.firstKeystrokeTime - new Date(questionStartedAt).getTime())
          : 0;

      const anomalyReasons: string[] = [];

      // Flag sustained typing speed above human threshold (>12 cps)
      if (avgSpeedCps > 12 && finalLength > 60) {
        anomalyReasons.push(`Sustained typing speed of ${avgSpeedCps} chars/sec exceeded human threshold`);
      }

      // Flag long idle (>10s) followed by a burst of >50 chars in <1s
      if (t.longestPauseMs > 10000 && t.recentBurstChars > 50) {
        anomalyReasons.push("Long idle period followed by sudden high-volume burst");
      }

      const anomalyFlag = anomalyReasons.length > 0;
      if (anomalyFlag && isProctored) {
        logEvent("typing_anomaly", {
          avg_speed_cps: avgSpeedCps,
          longest_pause_ms: t.longestPauseMs,
          reasons: anomalyReasons,
        });
      }

      return {
        characters: finalLength,
        keystrokes: t.keystrokes,
        typing_duration_ms: durationMs,
        avg_speed_cps: avgSpeedCps,
        max_speed_cps: Math.max(avgSpeedCps, Number((t.recentBurstChars / 1).toFixed(2))),
        longest_pause_ms: t.longestPauseMs,
        time_to_first_keystroke_ms: timeToFirstKeystrokeMs,
        anomaly_flag: anomalyFlag,
        anomaly_reasons: anomalyReasons,
      };
    },
    [isProctored, logEvent]
  );

  const resetTypingMetrics = useCallback(() => {
    typingMetricsRef.current = {
      keystrokes: 0,
      startTime: null,
      firstKeystrokeTime: null,
      lastKeystrokeTime: null,
      longestPauseMs: 0,
      recentBurstChars: 0,
      lastBurstTime: 0,
    };
  }, []);

  // 9. Fullscreen Change Detector
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);

      if (active) {
        if (inFullscreenViolationRef.current) {
          const exitDuration = fullscreenTargetTimeRef.current
            ? Math.round((Date.now() - (fullscreenTargetTimeRef.current - FULLSCREEN_GRACE_SECONDS * 1000)) / 1000)
            : 0;
          logEvent("fullscreen_returned", { seconds: Math.max(1, exitDuration) });
        }
        inFullscreenViolationRef.current = false;
        fullscreenTargetTimeRef.current = null;
        setFullscreenCountdown(null);
        setActiveBanner(null);
      } else {
        if (isFinished || isAppActionRef.current || inFullscreenViolationRef.current) return;
        inFullscreenViolationRef.current = true;
        fullscreenTargetTimeRef.current = Date.now() + FULLSCREEN_GRACE_SECONDS * 1000;
        setFullscreenCountdown(FULLSCREEN_GRACE_SECONDS);

        logEvent("fullscreen_exit", { timestamp: Date.now() });

        if (isProctored) {
          addStrike("Leaving fullscreen mode violates placement proctoring rules.", "fullscreen");
        } else {
          setWarningModal({
            isOpen: true,
            title: "Fullscreen Mode Exited (Practice)",
            message: "You exited fullscreen. In Proctored Mode, this incurs an official strike.",
            category: "fullscreen",
          });
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isFinished, isProctored, FULLSCREEN_GRACE_SECONDS, logEvent, addStrike]);

  // Fullscreen Countdown Interval
  useEffect(() => {
    if (fullscreenCountdown === null || fullscreenCountdown <= 0) return;
    const interval = setInterval(() => {
      if (!fullscreenTargetTimeRef.current) return;
      const remaining = Math.max(0, Math.ceil((fullscreenTargetTimeRef.current - Date.now()) / 1000));
      setFullscreenCountdown(remaining);

      if (remaining > 0) {
        setActiveBanner({
          message: `You are not in fullscreen. Return in ${remaining}s or your interview will be submitted automatically.`,
          countdown: remaining,
          actionLabel: "Enter Fullscreen",
          onAction: requestFullscreen,
        });
      } else {
        clearInterval(interval);
        setActiveBanner(null);
        if (isProctored) {
          triggerAutoSubmit("auto_submitted_fullscreen");
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [fullscreenCountdown, isProctored, requestFullscreen, triggerAutoSubmit]);

  // 10. Tab Visibility & Away Detector
  useEffect(() => {
    if (isFinished) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (inAwayViolationRef.current) return;
        inAwayViolationRef.current = true;
        awayStartTimeRef.current = Date.now();
        awayTargetTimeRef.current = Date.now() + MAX_AWAY_SECONDS * 1000;
        setAwayCountdown(MAX_AWAY_SECONDS);
        logEvent("tab_hidden", { timestamp: Date.now() });
      } else {
        if (!inAwayViolationRef.current) return;
        const awayDurationSec = awayStartTimeRef.current
          ? (Date.now() - awayStartTimeRef.current) / 1000
          : 0;

        inAwayViolationRef.current = false;
        awayStartTimeRef.current = null;
        awayTargetTimeRef.current = null;
        setAwayCountdown(null);

        logEvent("tab_returned", { away_seconds: Math.round(awayDurationSec) });

        if (awayDurationSec >= BLUR_GRACE_SECONDS) {
          if (isProctored) {
            addStrike(`You were away from the assessment for ${Math.round(awayDurationSec)}s.`, "tab");
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isFinished, isProctored, BLUR_GRACE_SECONDS, MAX_AWAY_SECONDS, logEvent, addStrike]);

  // 11. Camera State Reporter
  const reportCameraState = useCallback(
    (state: "PRESENT" | "ABSENT" | "MULTIPLE" | "CAMERA_BLOCKED", isLowLight: boolean) => {
      if (isFinished || !isProctored) return;

      if (state === "PRESENT") {
        if (inCameraViolationRef.current) {
          const absentDuration = cameraAbsentStartTimeRef.current
            ? Math.round((Date.now() - cameraAbsentStartTimeRef.current) / 1000)
            : 0;
          logEvent("camera_returned", { absent_seconds: absentDuration });
          inCameraViolationRef.current = false;
          cameraAbsentStartTimeRef.current = null;
          cameraTargetTimeRef.current = null;
          setCameraCountdown(null);
          setActiveBanner(null);
        }
      } else if (state === "MULTIPLE") {
        logEvent("multiple_faces", { timestamp: Date.now() });
      } else if (state === "ABSENT" || state === "CAMERA_BLOCKED") {
        if (!inCameraViolationRef.current) {
          inCameraViolationRef.current = true;
          cameraAbsentStartTimeRef.current = Date.now();
          cameraTargetTimeRef.current = Date.now() + CAMERA_GRACE_SECONDS * 1000;
          setCameraCountdown(CAMERA_GRACE_SECONDS);

          logEvent(state === "ABSENT" ? "camera_absent" : "camera_blocked", { timestamp: Date.now() });
          addStrike("Candidate face was absent from camera frame.", "camera");
        }
      }
    },
    [isFinished, isProctored, CAMERA_GRACE_SECONDS, logEvent, addStrike]
  );

  // Camera Countdown Interval
  useEffect(() => {
    if (cameraCountdown === null || cameraCountdown <= 0) return;
    const interval = setInterval(() => {
      if (!cameraTargetTimeRef.current) return;
      const remaining = Math.max(0, Math.ceil((cameraTargetTimeRef.current - Date.now()) / 1000));
      setCameraCountdown(remaining);

      if (remaining > 0) {
        setActiveBanner({
          message: `Camera absence detected. Please face your webcam. Returning in ${remaining}s or interview will auto-submit.`,
          countdown: remaining,
        });
      } else {
        clearInterval(interval);
        setActiveBanner(null);
        if (isProctored) {
          triggerAutoSubmit("auto_submitted_camera");
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [cameraCountdown, isProctored, triggerAutoSubmit]);

  // 12. Clipboard / Paste Blocker Handler
  const reportPasteBlocked = useCallback(
    (target: string) => {
      logEvent("paste_blocked", { target });
      setWarningModal({
        isOpen: true,
        title: "Pasting is Disabled",
        message: `Direct clipboard pasting into ${target} is prohibited during the assessment. Please type your code or answer directly.`,
        category: "paste",
      });
    },
    [logEvent]
  );

  // 13. Server Heartbeat & Session Token Locking
  useEffect(() => {
    if (isFinished || !sessionToken) return;

    const pingHeartbeat = async (attach = false) => {
      try {
        const res = await fetch("/api/interview/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interview_id: interviewId,
            session_token: sessionToken,
            attach_session: attach,
          }),
        });
        const data = await res.json();

        if (res.status === 409 && data.duplicate_session) {
          setIsDuplicateBlocked(true);
          setWarningModal({
            isOpen: true,
            title: "Simultaneous Session Blocked",
            message:
              "This interview has been opened in another window or device. Multiple simultaneous sessions are strictly prohibited.",
            category: "session",
          });
          return;
        }

        if (data.status === "completed" && data.auto_submit_reason) {
          triggerAutoSubmit(data.auto_submit_reason);
        }
      } catch (err) {
        // Network blip, continue
      }
    };

    // Attach active session on mount
    pingHeartbeat(true);
    const interval = setInterval(() => pingHeartbeat(false), 10000);
    return () => clearInterval(interval);
  }, [interviewId, sessionToken, isFinished, triggerAutoSubmit]);

  // 14. Navigation Guard (beforeunload warning)
  useEffect(() => {
    if (isFinished) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAppActionRef.current) return;
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your interview timer will continue running.";
      logEvent("tab_hidden", { reason: "beforeunload_navigation" });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFinished, logEvent]);

  // 15. Close Warning Modal Handler (Escape key / X button)
  const closeWarningModal = useCallback(() => {
    // If blocked by duplicate session, do not allow dismissing
    if (isDuplicateBlocked) return;
    setWarningModal((prev) => (prev ? { ...prev, isOpen: false } : null));
  }, [isDuplicateBlocked]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && warningModal?.isOpen && !isDuplicateBlocked) {
        closeWarningModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [warningModal, isDuplicateBlocked, closeWarningModal]);

  return {
    strikes,
    maxStrikes: MAX_STRIKES,
    isProctored,
    isFullscreen,
    isLocked: (isProctored && !isFullscreen) || isDuplicateBlocked,
    isDuplicateBlocked,
    fullscreenCountdown,
    awayCountdown,
    cameraCountdown,
    warningModal,
    activeBanner,
    sessionToken,
    requestFullscreen,
    reportCameraState,
    reportPasteBlocked,
    clearClipboardSilently,
    recordKeystroke,
    recordInputEvent,
    getTypingAggregates,
    resetTypingMetrics,
    triggerAutoSubmit,
    closeWarningModal,
  };
}
