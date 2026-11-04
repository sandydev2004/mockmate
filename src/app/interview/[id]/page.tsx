"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import {
  InterviewRecord,
  MessageRecord,
  DSAProblem,
  SupportedLanguage,
  TestRunResult,
} from "@/types";
import { formatTime, getDifficultyBadgeColor, getRoleBadgeColor } from "@/lib/utils";
import { CodeEditor } from "@/components/CodeEditor";

export default function InterviewRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const interviewId = params.id;

  // Data state
  const [interview, setInterview] = useState<InterviewRecord | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [dsaProblem, setDsaProblem] = useState<DSAProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat & Answer state
  const [answerText, setAnswerText] = useState("");
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Voice Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Coding round state
  const [codeLanguage, setCodeLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState("");
  const [runningCode, setRunningCode] = useState(false);
  const [testResults, setTestResults] = useState<TestRunResult[] | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"problem" | "editor" | "output">("editor");

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 1. Load Interview session
  useEffect(() => {
    async function loadInterview() {
      try {
        const res = await fetch(`/api/interview/${interviewId}`);
        if (!res.ok) throw new Error("Could not load interview session");
        const data = await res.json();

        setInterview(data.interview);
        setMessages(data.messages || []);
        setIsFinished(data.interview.status === "completed");

        if (data.dsa_problem) {
          setDsaProblem(data.dsa_problem);
          setCode(data.dsa_problem.starter_code.python || "");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadInterview();
  }, [interviewId]);

  // 2. Timer effect
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // 3. Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendingAnswer]);

  // 4. Update starter code when language changes
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setCodeLanguage(newLang);
    if (dsaProblem && dsaProblem.starter_code[newLang]) {
      setCode(dsaProblem.starter_code[newLang]);
    }
  };

  // 5. Browser Web Speech API setup
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
      recognition.lang = "en-IN"; // English (India) for accurate placement interview recognition

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

  // 6. Send Answer to Interviewer
  const handleSendAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!answerText.trim() || sendingAnswer || !interview) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const currentText = answerText.trim();
    setAnswerText("");

    // Optimistically add user message
    const tempUserMsg: MessageRecord = {
      id: crypto.randomUUID(),
      interview_id: interview.id,
      sender: "user",
      content: currentText,
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
          content: currentText,
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

      if (data.is_finished) {
        setIsFinished(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingAnswer(false);
    }
  };

  // 7. Run Code with Judge0
  const handleRunCode = async () => {
    if (!interview || !dsaProblem || runningCode) return;
    setRunningCode(true);
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
      if (!res.ok) throw new Error(data.error || "Failed to execute code");
      setTestResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunningCode(false);
    }
  };

  // 8. Submit Code to Interviewer
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
    // Switch view to chat to see the dialogue
    setActiveCodeTab("problem");
  };

  // 9. Finish Interview and Generate Report
  const handleFinishInterview = async () => {
    if (!interview || finishing) return;
    setFinishing(true);

    try {
      const res = await fetch("/api/interview/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interview_id: interview.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");

      router.push(`/interview/${interview.id}/report`);
    } catch (err: any) {
      setError(err.message);
      setFinishing(false);
    }
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
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950">
      {/* Top Bar: Room Header, Badges, Timer, Question Counter */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
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
        </div>

        {/* Center: Timer & Progress */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>
              Question {interview?.current_question_index} of {interview?.total_questions}
            </span>
            <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{
                  width: `${((interview?.current_question_index || 1) / (interview?.total_questions || 6)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: End Interview Action */}
        <div className="flex items-center gap-2">
          {isFinished ? (
            <button
              onClick={handleFinishInterview}
              disabled={finishing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors animate-pulse"
            >
              <span>{finishing ? "Compiling..." : "View Feedback Report"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinishInterview}
              disabled={finishing}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {finishing ? "Ending..." : "End Session"}
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Chat UI (or Split View in DSA) */}
        <div
          className={`flex flex-col h-full bg-white dark:bg-slate-900 ${
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
                        ? "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80"
                        : "bg-indigo-600 text-white"
                    }`}
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
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2">Evaluating response...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Box & Voice Toggle */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {isFinished ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  🎉 All interview questions completed!
                </p>
                <button
                  onClick={handleFinishInterview}
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
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAnswer();
                      }
                    }}
                    placeholder="Type your answer, or use the voice button to speak... (Press Enter to submit)"
                    className="w-full p-3 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none"
                  />

                  <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      {/* Voice Input Toggle Button */}
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
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
                        onClick={() => {
                          setAnswerText("Could you give me a small hint to point me in the right direction?");
                        }}
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <HelpCircle className="w-3 h-3 text-indigo-500" />
                        <span>Ask for Hint</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={!answerText.trim() || sendingAnswer}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-40"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
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
                  disabled={runningCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-indigo-400" />
                  <span>{runningCode ? "Testing..." : "Run"}</span>
                </button>

                <button
                  onClick={handleSubmitCodeToAI}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to AI</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Problem Statement */}
            {activeCodeTab === "problem" && dsaProblem && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm bg-slate-900 text-slate-200">
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

            {/* Tab 2: Monaco Code Editor */}
            {activeCodeTab === "editor" && (
              <div className="flex-1 p-2 bg-slate-950">
                <CodeEditor
                  language={codeLanguage}
                  value={code}
                  onChange={setCode}
                  isDark={true}
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

                {!testResults && !runningCode && (
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
    </div>
  );
}

