"use client";

import { useState, useEffect, useRef, Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  HelpCircle,
  Terminal,
  Code2,
  FileCode,
  User,
  Bot,
  Zap,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  AlertTriangle,
  Timer,
  X,
  Camera,
  CameraOff,
} from "lucide-react";
import {
  InterviewRecord,
  MessageRecord,
  DSAProblem,
  SupportedLanguage,
  TestRunResult,
  ProctoringMode,
} from "@/types";
import { formatTime, getDifficultyBadgeColor, getRoleBadgeColor } from "@/lib/utils";
import { CodeEditor, DEFAULT_STARTER_CODES } from "@/components/CodeEditor";
import { useProctoring } from "@/hooks/useProctoring";
import { CameraSelfView } from "@/components/CameraSelfView";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import { Spinner, TypingDots } from "@/components/loading";

function InterviewRoomContent({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Configurable per-question timer (default 3 minutes)
  const timerParam = searchParams.get("timer");
  const timerMinutes = timerParam ? parseInt(timerParam, 10) || 3 : 3;
  const questionDurationSeconds = Math.max(1, timerMinutes) * 60;

  // Proctoring mode from query or interview record
  const modeParam = (searchParams.get("mode") as ProctoringMode) || null;
  const [mode, setMode] = useState<ProctoringMode>(modeParam || "proctored");

  // Data state
  const [interview, setInterview] = useState<InterviewRecord | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [dsaProblem, setDsaProblem] = useState<DSAProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat & Answer state
  const [answerText, setAnswerText] = useState("");
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [answerWaitSeconds, setAnswerWaitSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Voice Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Session & Question Timers
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionSecondsRemaining, setQuestionSecondsRemaining] = useState<number>(questionDurationSeconds);

  // Coding round state
  const [codeLanguage, setCodeLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState(DEFAULT_STARTER_CODES.python);
  const [runningCode, setRunningCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestRunResult[] | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"problem" | "editor" | "output">("editor");

  // Consent & Calibration Overlay State
  const [consentCompleted, setConsentCompleted] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [calibrationConfirmed, setCalibrationConfirmed] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const autoSubmitTriggeredRef = useRef<boolean>(false);

  // Finish interview handler with auto-submit reason support
  const handleFinishInterview = async (autoSubmitReason?: string) => {
    if (!interview || finishing) return;
    setFinishing(true);

    try {
      const res = await fetch("/api/interview/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_id: interview.id,
          auto_submit_reason: autoSubmitReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");

      router.push(`/interview/${interview.id}/report`);
    } catch (err: any) {
      setError(err.message);
      setFinishing(false);
    }
  };

  // Unified Proctoring Hook
  const {
    strikes,
    maxStrikes,
    isProctored,
    isFullscreen,
    isLocked,
    isDuplicateBlocked,
    fullscreenCountdown,
    awayCountdown,
    cameraCountdown,
    warningModal,
    activeBanner,
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
  } = useProctoring({
    interviewId,
    mode,
    isFinished,
    onAutoSubmit: async (reason) => {
      await handleFinishInterview(reason);
    },
  });

  // 1. Load Interview session & restore server state on refresh
  useEffect(() => {
    async function loadInterview() {
      try {
        const res = await fetch(`/api/interview/${interviewId}`);
        if (!res.ok) throw new Error("Could not load interview session");
        const data = await res.json();

        setInterview(data.interview);
        if (data.interview.mode) {
          setMode(data.interview.mode);
        }
        setMessages(data.messages || []);
        setIsFinished(data.interview.status === "completed");

        // Restore remaining question timer based on server question_started_at
        if (data.interview.question_started_at) {
          const elapsedSec = Math.floor(
            (Date.now() - new Date(data.interview.question_started_at).getTime()) / 1000
          );
          const remaining = Math.max(1, questionDurationSeconds - elapsedSec);
          setQuestionSecondsRemaining(remaining);
        }

        // Restore overall session elapsed timer based on server started_at
        if (data.interview.started_at) {
          const totalElapsed = Math.floor(
            (Date.now() - new Date(data.interview.started_at).getTime()) / 1000
          );
          setElapsedSeconds(Math.max(0, totalElapsed));
        }

        if (data.dsa_problem) {
          setDsaProblem(data.dsa_problem);
          setCode(data.dsa_problem.starter_code?.python || DEFAULT_STARTER_CODES.python);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadInterview();
  }, [interviewId, questionDurationSeconds]);

  // 2. Session Elapsed Timer
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // 3. Per-Question Timer (Auto-submits when countdown reaches 0)
  useEffect(() => {
    if (isFinished || sendingAnswer || isLocked || !consentCompleted) return;

    const interval = setInterval(() => {
      setQuestionSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (!autoSubmitTriggeredRef.current) {
            autoSubmitTriggeredRef.current = true;
            handleSendAnswer(undefined, true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinished, sendingAnswer, isLocked, consentCompleted]);

  // Reset question timer whenever the question advances
  useEffect(() => {
    setQuestionSecondsRemaining(questionDurationSeconds);
    autoSubmitTriggeredRef.current = false;
  }, [interview?.current_question_index, questionDurationSeconds]);

  // Track answer waiting duration for progressive feedback (8s, 30s)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (sendingAnswer) {
      setAnswerWaitSeconds(0);
      timer = setInterval(() => {
        setAnswerWaitSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setAnswerWaitSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sendingAnswer]);

  // 4. Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendingAnswer]);

  // 5. Update starter code when language changes
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setCodeLanguage(newLang);
    if (dsaProblem && dsaProblem.starter_code && dsaProblem.starter_code[newLang]) {
      setCode(dsaProblem.starter_code[newLang]);
    } else {
      setCode(DEFAULT_STARTER_CODES[newLang] || "");
    }
  };

  // 6. Browser Web Speech API setup
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setAnswerText((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech API start failed:", err);
      setIsRecording(false);
    }
  };

  // 7. Send Answer to Interviewer (supports normal send & auto-submit on timeout)
  const handleSendAnswer = async (e?: React.FormEvent, isAutoSubmit = false) => {
    if (e) e.preventDefault();
    if (sendingAnswer || !interview || isLocked) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    let currentText = answerText.trim();
    if (!currentText && isAutoSubmit) {
      currentText = "Time expired before a written response was provided.";
    }

    if (!currentText) return;

    // Compute input aggregates per answer without keylogging
    getTypingAggregates(currentText.length, interview?.question_started_at);
    resetTypingMetrics();

    setAnswerText("");

    // Optimistically add user message
    const tempUserMsg: MessageRecord = {
      id: crypto.randomUUID(),
      interview_id: interview.id,
      sender: "user",
      content: isAutoSubmit ? `[Auto-Submitted: Time Expired] ${currentText}` : currentText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSendingAnswer(true);

    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_id: interview.id,
          content: tempUserMsg.content,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit answer");

      // Append AI response
      const aiMsg: MessageRecord = {
        id: crypto.randomUUID(),
        interview_id: interview.id,
        sender: "ai",
        content: data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Update question counter
      setInterview((prev) =>
        prev
          ? {
              ...prev,
              current_question_index: data.current_question,
            }
          : null
      );

      // Reset timer for next question
      setQuestionSecondsRemaining(questionDurationSeconds);
      autoSubmitTriggeredRef.current = false;

      if (data.is_finished) {
        setIsFinished(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingAnswer(false);
    }
  };

  // 8. Run Code with Judge0
  const handleRunCode = async () => {
    if (!interview || !dsaProblem || runningCode || isLocked) return;
    setRunningCode(true);
    setCodeError(null);
    setActiveCodeTab("output");

    try {
      const res = await fetch("/api/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_id: interview.id,
          problem_id: dsaProblem.id,
          language: codeLanguage,
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.details || data.error || "Failed to execute code";
        setCodeError(errMsg);
        return;
      }
      setTestResults(data.results);
    } catch (err: any) {
      setCodeError(err.message || "Failed to communicate with code execution service");
    } finally {
      setRunningCode(false);
    }
  };

  // 9. Submit Code to Interviewer
  const handleSubmitCodeToAI = async () => {
    if (!testResults || !dsaProblem) {
      await handleRunCode();
    }

    const passedCount = testResults?.filter((r) => r.passed).length ?? 0;
    const totalCount = testResults?.length ?? dsaProblem?.test_cases.length ?? 0;

    const submissionDescription = `I have written and tested my ${codeLanguage.toUpperCase()} solution for ${dsaProblem?.title}.
Test Results: ${passedCount}/${totalCount} test cases passed.
Code snippet:
\`\`\`${codeLanguage}
${code}
\`\`\`
I am ready for your critique and complexity evaluation.`;

    setAnswerText(submissionDescription);
    setActiveCodeTab("problem");
  };

  // Switch to practice mode if camera is denied
  const handleSwitchToPracticeMode = () => {
    setMode("practice");
    setCameraPermissionDenied(false);
    setCalibrationConfirmed(true);
    setAgreeTerms(true);
  };

  // Complete consent and calibration
  const handleBeginAssessment = async () => {
    // Attempt to silently clear leftover copied text on user gesture
    await clearClipboardSilently();
    try {
      await requestFullscreen();
    } catch (err) {
      // Continue even if fullscreen rejected
    }
    setConsentCompleted(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Entering interview room...
        </p>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Interview Not Found</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <button
          onClick={() => router.push("/interview/setup")}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white"
        >
          Back to Setup
        </button>
      </div>
    );
  }

  const isDsaRound = interview?.round === "dsa";

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
      {/* 1. CONSENT & STARTUP CALIBRATION MODAL */}
      {!consentCompleted && !isFinished && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-sm">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {isProctored ? "AI Placement Assessment — Proctoring Verification" : "Placement Practice Assessment"}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {isProctored
                  ? "Campus placement integrity protocols are active. Please review the terms and complete startup calibration."
                  : "Practice mode is active. You can solve problems without camera verification or automatic submission."}
              </p>
            </div>

            {/* Proctored Mode Camera / Calibration Section */}
            {isProctored ? (
              cameraPermissionDenied ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                    <CameraOff className="w-4 h-4 shrink-0" />
                    <span>Camera Permission Required for Proctored Mode</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    Proctored Mode verifies candidate presence entirely on-device using your webcam. If you do not have a working camera or prefer not to grant camera access, you can switch to Practice Mode.
                  </p>
                  <button
                    onClick={handleSwitchToPracticeMode}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-all"
                  >
                    Switch to Practice Mode (No Camera Required)
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Presence Calibration Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Camera className="w-4 h-4 text-indigo-600" />
                        <span>Step 1: On-Device Presence Calibration</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {calibrationConfirmed ? "✓ Calibrated" : "Sit in frame"}
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <CameraSelfView
                        isCalibrating={true}
                        onStateChange={reportCameraState}
                        onCalibrationConfirmed={() => setCalibrationConfirmed(true)}
                        onPermissionDenied={() => setCameraPermissionDenied(true)}
                      />
                    </div>
                  </div>

                  {/* Consent & Privacy Terms Checkbox */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong>I agree to the proctoring guidelines:</strong> Camera is used only to check presence; video is processed on-device in the browser and never uploaded or stored; keystroke counts, typing speed aggregates, and window signals are monitored for placement integrity (keystroke contents are NEVER logged or stored); only event logs are saved; tab switching, leaving fullscreen or leaving the camera frame can end the interview. Backgrounding the app on mobile counts as leaving.
                      </span>
                    </label>
                  </div>
                </div>
              )
            ) : (
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Practice Mode Enabled</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Camera checking and automatic auto-submit locks are disabled. You will receive standard guidance, code execution, and interview questions.
                </p>
              </div>
            )}

            {/* Begin Button */}
            <div className="pt-2">
              <button
                onClick={handleBeginAssessment}
                disabled={isProctored && (!agreeTerms || !calibrationConfirmed || cameraPermissionDenied)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                <span>
                  {isProctored
                    ? calibrationConfirmed
                      ? "Enter Fullscreen & Begin Assessment"
                      : "Calibrating Face Presence..."
                    : "Enter Fullscreen & Start Practice"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. STICKY TOP WARNING BANNER (When out of fullscreen or away) */}
      {activeBanner && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-200 z-40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 animate-pulse" />
            <span>{activeBanner.message}</span>
          </div>
          {activeBanner.actionLabel && activeBanner.onAction && (
            <button
              onClick={activeBanner.onAction}
              className="ml-3 px-3 py-1 rounded-lg bg-white text-rose-700 font-bold hover:bg-rose-50 text-[11px] shrink-0 shadow-sm"
            >
              {activeBanner.actionLabel}
            </button>
          )}
        </div>
      )}

      {/* 3. UNIFIED WARNING MODAL (With (X) close & Esc key support) */}
      {warningModal?.isOpen && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* (X) Close button: closes modal only without stopping countdown */}
            <button
              onClick={() => closeWarningModal()}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {isProctored
                    ? `Strike ${warningModal.strikeNumber || strikes} of ${maxStrikes}`
                    : "Practice Mode Notice"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {warningModal.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {warningModal.message}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>Recorded Strikes:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {strikes} / {maxStrikes}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Mode:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {isProctored ? "Strict Proctored" : "Practice Mode"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                closeWarningModal();
                requestFullscreen().catch(() => {});
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              I Understand, Return to Interview
            </button>
          </div>
        </div>
      )}

      {/* 3b. DUPLICATE SESSION BLOCK MODAL (Unclosable when second session active) */}
      {isDuplicateBlocked && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Simultaneous Session Blocked</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Multiple Windows Prohibited
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This interview has been opened in another window or device. Multiple simultaneous sessions are strictly prohibited and this session has been locked to protect placement integrity.
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              Please close this window and return to your active assessment session.
            </p>
          </div>
        </div>
      )}

      {/* 4. Top Navigation Bar: Badges, Timers, Strikes, Actions */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadgeColor(interview?.role || "SDE")}`}>
            {interview?.role}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {interview?.company_type}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getDifficultyBadgeColor(interview?.difficulty || "medium")}`}>
            {interview?.difficulty}
          </span>
          <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            {interview?.round.toUpperCase()}
          </span>
        </div>

        {/* Center: Session Timer, Per-Question Countdown Timer & Strikes Badge */}
        <div className="flex items-center gap-3">
          {/* Overall Elapsed Timer */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg" title="Overall Session Time">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Per-Question Timer Pill */}
          <div
            className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors ${
              questionSecondsRemaining <= 30
                ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse font-bold"
                : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 font-semibold"
            }`}
            title={`Per-Question Timer (${timerMinutes} min limit). Auto-submits on expiry.`}
          >
            <Timer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Q: {formatTime(questionSecondsRemaining)}</span>
          </div>

          {/* Unified Strikes / Mode Badge */}
          {isProctored ? (
            <div
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                strikes >= 2
                  ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 animate-pulse"
                  : strikes === 1
                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800"
                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
              title={`Proctored Mode: ${strikes} of ${maxStrikes} strikes recorded`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Strikes {strikes}/{maxStrikes}</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              title="Practice Mode: No locks or auto-submits active"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Practice Mode</span>
            </div>
          )}

          {/* Question Counter & Progress Bar */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>
              Q {interview?.current_question_index} / {interview?.total_questions}
            </span>
            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{
                  width: `${((interview?.current_question_index || 1) / (interview?.total_questions || 6)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: End Interview Action & Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <button
              onClick={requestFullscreen}
              title="Enter Fullscreen"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {isFinished ? (
            <button
              onClick={() => handleFinishInterview()}
              disabled={finishing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors animate-pulse"
            >
              <span>{finishing ? "Compiling..." : "View Feedback Report"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => handleFinishInterview()}
              disabled={finishing}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {finishing ? "Ending..." : "End Session"}
            </button>
          )}
        </div>
      </header>

      {/* 5. Main Workspace Body (Locked & Blurred when out of fullscreen in proctored mode) */}
      <div className={`flex-1 flex overflow-hidden relative ${isLocked ? "filter blur-sm pointer-events-none opacity-50" : ""}`}>
        {/* Anti-Cheating Visual Watermark (Faint, repeating, non-interactive) */}
        <WatermarkOverlay email={interview?.user_id} interviewId={interviewId} />

        {/* Left Pane: Chat UI (or Split View in DSA) */}
        <div
          className={`flex flex-col h-full bg-white dark:bg-slate-900 relative z-10 ${
            isDsaRound ? "w-full lg:w-[45%] border-r border-slate-200 dark:border-slate-800" : "w-full max-w-4xl mx-auto border-x border-slate-200 dark:border-slate-800"
          }`}
        >
          {/* Chat Messages Transcript */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-sm ${isAi ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                      isAi
                        ? "bg-indigo-600 shadow-md shadow-indigo-600/20"
                        : "bg-slate-800 dark:bg-slate-700"
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
                      isAi
                        ? "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 select-none"
                        : "bg-indigo-600 text-white select-text"
                    }`}
                    onCopy={isAi ? (e) => e.preventDefault() : undefined}
                    onCut={isAi ? (e) => e.preventDefault() : undefined}
                    onDragStart={isAi ? (e) => e.preventDefault() : undefined}
                    onContextMenu={isAi ? (e) => e.preventDefault() : undefined}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1 opacity-70">
                      <span className="font-semibold">{isAi ? "Interviewer" : "You"}</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              );
            })}

            {sendingAnswer && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <TypingDots label="Interviewer is evaluating response..." />
                </div>
                {answerWaitSeconds >= 8 && answerWaitSeconds < 30 && (
                  <div className="ml-11 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                    Taking longer than usual... AI is generating comprehensive feedback.
                  </div>
                )}
                {answerWaitSeconds >= 30 && (
                  <div className="ml-11 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 space-y-2">
                    <p className="font-semibold">Evaluation is taking unusually long.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSendingAnswer(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                    >
                      Retry sending answer
                    </button>
                  </div>
                )}
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Box & Voice Toggle with Anti-Cheat Event Guards */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {isFinished ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  🎉 All interview questions completed!
                </p>
                <button
                  onClick={() => handleFinishInterview()}
                  disabled={finishing}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
                >
                  {finishing ? "Generating Report..." : "Generate Structured Report"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendAnswer} className="space-y-2">
                <div className="relative rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                  <textarea
                    rows={3}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    onKeyDown={(e) => {
                      recordKeystroke();
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAnswer();
                      }
                    }}
                    onInput={(e: any) => {
                      const inputType = e.nativeEvent?.inputType || "insertText";
                      const inserted = e.nativeEvent?.data?.length || 1;
                      recordInputEvent(inputType, inserted, answerText.length);
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      reportPasteBlocked("Answer input box");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      recordInputEvent("insertFromDrop", 10, answerText.length);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                    }}
                    placeholder="Type your answer, or click Voice Input... (Pasting is disabled for assessment integrity)"
                    className="w-full p-3 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none select-text"
                    disabled={isLocked}
                  />

                  <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      {/* Voice Input Toggle Button */}
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        disabled={isLocked}
                        aria-label="Toggle voice input"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isRecording
                            ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/20"
                            : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        <span>{isRecording ? "Listening (Click to stop)" : "Voice Input"}</span>
                      </button>

                      {/* Request Hint Quick Button */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          setAnswerText("Could you give me a small hint to point me in the right direction?");
                        }}
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <HelpCircle className="w-3 h-3 text-indigo-500" />
                        <span>Ask for Hint</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
                        {formatTime(questionSecondsRemaining)} left
                      </span>
                      <button
                        type="submit"
                        disabled={!answerText.trim() || sendingAnswer || isLocked}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-40"
                      >
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Pane: DSA Problem + Monaco Editor + Judge0 Runner (Only for DSA Round) */}
        {isDsaRound && (
          <div className="hidden lg:flex flex-col flex-1 h-full bg-slate-900 text-white overflow-hidden">
            {/* Editor Top Bar */}
            <div className="h-12 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setActiveCodeTab("problem")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    activeCodeTab === "problem" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Problem
                </button>
                <button
                  onClick={() => setActiveCodeTab("editor")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    activeCodeTab === "editor" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Code Editor
                </button>
                <button
                  onClick={() => setActiveCodeTab("output")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    activeCodeTab === "output" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Test Results
                </button>
              </div>

              {/* Language Selector & Execution Buttons */}
              <div className="flex items-center gap-2">
                <select
                  value={codeLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                  className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="java">Java 17</option>
                  <option value="javascript">JavaScript (Node)</option>
                </select>

                <button
                  onClick={handleRunCode}
                  disabled={runningCode || isLocked}
                  aria-busy={runningCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition-colors disabled:opacity-50"
                >
                  {runningCode ? (
                    <Spinner size="sm" className="text-indigo-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-indigo-400" />
                  )}
                  <span>{runningCode ? "Executing..." : "Run"}</span>
                </button>

                <button
                  onClick={handleSubmitCodeToAI}
                  disabled={isLocked}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to AI</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Problem Statement (Protected against copy/cut/drag) */}
            {activeCodeTab === "problem" && dsaProblem && (
              <div
                className="flex-1 overflow-y-auto p-6 space-y-5 text-sm bg-slate-900 text-slate-200 select-none"
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{dsaProblem.title}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getDifficultyBadgeColor(dsaProblem.difficulty)}`}>
                      {dsaProblem.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-400">{dsaProblem.category}</p>
                </div>

                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-sans text-slate-300">
                  {dsaProblem.description}
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setActiveCodeTab("editor")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Open Editor to Solve</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Monaco Code Editor with Anti-Cheat Guards */}
            {activeCodeTab === "editor" && (
              <div className="flex-1 p-3 bg-slate-950 flex flex-col h-[520px] min-h-[500px]">
                <CodeEditor
                  language={codeLanguage}
                  value={code}
                  onChange={setCode}
                  isDark={true}
                  height="100%"
                  onPasteAttempt={() => reportPasteBlocked("Monaco Code Editor")}
                />
              </div>
            )}

            {/* Tab 3: Judge0 Test Results */}
            {activeCodeTab === "output" && (
              <div className="flex-1 overflow-y-auto p-5 bg-slate-900 text-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span>Judge0 Test Execution Output</span>
                  </h3>
                  {testResults && (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        testResults.every((r) => r.passed)
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                          : "bg-rose-950/60 text-rose-400 border border-rose-800"
                      }`}
                    >
                      {testResults.filter((r) => r.passed).length} / {testResults.length} Passed
                    </span>
                  )}
                </div>

                {codeError && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-400">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Judge0 Execution Notice</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{codeError}</p>
                    {codeError.includes("Judge0 API") && (
                      <div className="text-[11px] text-slate-400 pt-1.5 border-t border-rose-900/50">
                        To enable live execution, provide <code className="text-amber-300">JUDGE0_API_KEY</code> in <code className="text-amber-300">.env.local</code>.
                      </div>
                    )}
                  </div>
                )}

                {!testResults && !runningCode && !codeError && (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    Click "Run" above to compile and execute your code against test cases with Judge0.
                  </div>
                )}

                {runningCode && (
                  <div className="p-8 text-center text-xs text-indigo-400 border border-slate-800 rounded-xl space-y-2">
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Executing code on Judge0 sandbox runner...</p>
                  </div>
                )}

                {testResults && (
                  <div className="space-y-3">
                    {testResults.map((tr) => (
                      <div
                        key={tr.test_case_index}
                        className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                          tr.passed
                            ? "bg-emerald-950/20 border-emerald-800/60 text-emerald-300"
                            : "bg-rose-950/20 border-rose-800/60 text-rose-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-sans">
                            Test Case #{tr.test_case_index}: {tr.status}
                          </span>
                          <span className="text-[11px] opacity-70">
                            {tr.execution_time} • {tr.memory}
                          </span>
                        </div>
                        <div className="space-y-1 text-slate-300">
                          <div>
                            <span className="text-slate-500">Input:</span> {tr.input.replace(/\n/g, " ")}
                          </div>
                          <div>
                            <span className="text-slate-500">Expected:</span> {tr.expected}
                          </div>
                          <div>
                            <span className="text-slate-500">Actual:</span> {tr.actual || "(empty)"}
                          </div>
                          {tr.stderr && (
                            <div className="text-rose-400 font-sans text-[11px] mt-1 p-2 bg-rose-950/40 rounded">
                              Stderr: {tr.stderr}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <button
                        onClick={handleSubmitCodeToAI}
                        className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
                      >
                        Submit Solution to Interviewer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Floating Self-View in Proctored Mode */}
      {isProctored && consentCompleted && !isFinished && (
        <div className="fixed bottom-4 right-4 z-40">
          <CameraSelfView
            onStateChange={reportCameraState}
            isCalibrating={false}
          />
        </div>
      )}
    </div>
  );
}

export default function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Initializing assessment room...
          </p>
        </div>
      }
    >
      <InterviewRoomContent interviewId={id} />
    </Suspense>
  );
}
