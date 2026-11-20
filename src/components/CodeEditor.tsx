"use client";

import dynamic from "next/dynamic";
import { SupportedLanguage } from "@/types";

export const DEFAULT_STARTER_CODES: Record<SupportedLanguage, string> = {
  python: `import sys

def solve():
    # Write your solution here
    # Read from sys.stdin if needed
    pass

if __name__ == "__main__":
    solve()
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    // Write your solution here
    return 0;
}
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
    }
}
`,
  javascript: `const fs = require('fs');

function solve() {
    // Write your solution here
}

solve();
`,
};

// Dynamically import Monaco to prevent SSR issues and load client-side only
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 text-xs font-mono space-y-3">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="font-sans text-slate-400">Loading Monaco Editor environment...</span>
    </div>
  ),
});

interface CodeEditorProps {
  language: SupportedLanguage;
  value: string;
  onChange: (value: string) => void;
  isDark?: boolean;
  height?: string;
  onPasteAttempt?: () => void;
}

export function CodeEditor({
  language,
  value,
  onChange,
  isDark = true,
  height = "500px",
  onPasteAttempt,
}: CodeEditorProps) {
  const monacoLanguage = language === "cpp" ? "cpp" : language;

  const handleEditorDidMount = (editor: any) => {
    const domNode = editor.getDomNode();
    if (domNode) {
      // Disallow paste and notify listener
      domNode.addEventListener(
        "paste",
        (e: ClipboardEvent) => {
          e.preventDefault();
          e.stopPropagation();
          onPasteAttempt?.();
        },
        true
      );

      // Disallow drag and drop of external snippets
      domNode.addEventListener(
        "drop",
        (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
        },
        true
      );

      // Disallow right-click context menu
      domNode.addEventListener(
        "contextmenu",
        (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        },
        true
      );
    }
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
      className="h-[500px] min-h-[500px] w-full overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 shadow-inner flex flex-col select-none"
    >
      <MonacoEditor
        height={height}
        language={monacoLanguage}
        theme={isDark ? "vs-dark" : "light"}
        value={value}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
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
          contextmenu: false, // Disable built-in right-click context menu
          dragAndDrop: false, // Disable drag & drop insertion
        }}
      />
    </div>
  );
}
