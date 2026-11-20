import { SupportedLanguage, TestRunResult } from "@/types";

export const JUDGE0_LANGUAGE_IDS: Record<SupportedLanguage, number> = {
  python: 71, // Python (3.8.1)
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

export interface Judge0SubmissionResponse {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
  status?: {
    id: number;
    description: string;
  };
}

/**
 * Execute code against test cases using Judge0 CE API.
 * NO mock evaluator or silent fallback.
 * Throws a clear error if environment variables are missing or Judge0 fails.
 */
export async function executeCodeOnTestCases(
  language: SupportedLanguage,
  code: string,
  testCases: Array<{ input: string; expected_output: string; is_sample?: boolean }>
): Promise<TestRunResult[]> {
  const baseUrl = process.env.JUDGE0_BASE_URL || "https://judge0-ce.p.rapidapi.com";
  const apiKey = process.env.JUDGE0_API_KEY;
  const apiHost = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";

  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_")) {
    const errorMsg =
      "Judge0 API credentials are not configured. To enable live code execution, please provide JUDGE0_API_KEY (from RapidAPI or self-hosted Judge0) in .env.local.";
    console.error(`[JUDGE0_CONFIG_ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const results: TestRunResult[] = [];
  const languageId = JUDGE0_LANGUAGE_IDS[language] || 71;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const endpoint = `${baseUrl}/submissions?base64_encoded=false&wait=true`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": apiHost,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin: tc.input,
        expected_output: tc.expected_output,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[JUDGE0_API_ERROR] Judge0 returned HTTP ${res.status}: ${errText}`);
      throw new Error(`Judge0 API error (${res.status}): ${errText}`);
    }

    const data: Judge0SubmissionResponse = await res.json();
    const stdout = (data.stdout || "").trim();
    const expected = tc.expected_output.trim();
    const passed = stdout === expected && data.status?.id === 3; // 3 is "Accepted"

    results.push({
      test_case_index: i + 1,
      input: tc.input,
      expected: tc.expected_output,
      actual: stdout,
      passed,
      status: data.status?.description || (passed ? "Accepted" : "Wrong Answer"),
      execution_time: data.time ? `${(parseFloat(data.time) * 1000).toFixed(0)}ms` : undefined,
      memory: data.memory ? `${(data.memory / 1024).toFixed(1)}MB` : undefined,
      stderr: data.stderr || data.compile_output || undefined,
    });
  }

  return results;
}
