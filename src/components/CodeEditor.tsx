"use client";

import dynamic from "next/dynamic";
import { SupportedLanguage } from "@/types";

// Dynamically import Monaco to prevent SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-400 text-xs font-mono">
      Loading Monaco Editor...
    </div>
  ),
});

interface CodeEditorProps {
  language: SupportedLanguage;
  value: string;
  onChange: (value: string) => void;
  isDark?: boolean;
}

export function CodeEditor({ language, value, onChange, isDark = true }: CodeEditorProps) {
  const monacoLanguage = language === "cpp" ? "cpp" : language;

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-slate-700/80">
      <MonacoEditor
        height="100%"
        language={monacoLanguage}
        theme={isDark ? "vs-dark" : "light"}
        value={value}
        onChange={(val) => onChange(val || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 13.5,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          lineNumbers: "on",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 4,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
