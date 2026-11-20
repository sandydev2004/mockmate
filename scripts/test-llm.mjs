// scripts/test-llm.mjs
// Single-run test script for MockMate Multi-Provider LLM Layer.
// Tests each configured provider with exactly 1 test prompt (NO loops, preserves quota).

import fs from "fs";
import path from "path";

// 1. Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Dynamically import the llm module and zod
const { z } = await import("zod");
const { generate, generateStructuredJSON } = await import("../src/lib/llm.ts");

const TIMEOUT_MS = 20000;

async function fetchWithTimeout(url, init, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Timeout (${timeoutMs / 1000}s)`));
  }, timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function testGroq() {
  const apiKey = (process.env.GROQ_API_KEY || "").trim();
  const model = (process.env.GROQ_MODEL || "").trim();

  if (!apiKey || apiKey.includes("your_")) {
    return { provider: "groq", status: "SKIPPED", reason: "GROQ_API_KEY is not configured in .env.local" };
  }
  if (!model) {
    return { provider: "groq", status: "SKIPPED", reason: "GROQ_MODEL is not configured in .env.local" };
  }

  try {
    const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word: READY" }],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { provider: "groq", model, status: "FAIL", error: `HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return { provider: "groq", model, status: "PASS", reply };
  } catch (err) {
    return { provider: "groq", model, status: "FAIL", error: err.message };
  }
}

async function testGemini() {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  const model = (process.env.GEMINI_MODEL || "").trim();

  if (!apiKey || apiKey.includes("your_")) {
    return { provider: "gemini", status: "SKIPPED", reason: "GEMINI_API_KEY is not configured in .env.local" };
  }
  if (!model) {
    return { provider: "gemini", status: "SKIPPED", reason: "GEMINI_MODEL is not configured in .env.local" };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Reply with the single word: READY" }] }],
        generationConfig: { maxOutputTokens: 20, temperature: 0.1 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { provider: "gemini", model, status: "FAIL", error: `HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return { provider: "gemini", model, status: "PASS", reply };
  } catch (err) {
    return { provider: "gemini", model, status: "FAIL", error: err.message };
  }
}

async function testOpenRouter() {
  const apiKey = (process.env.OPENROUTER_API_KEY || "").trim();
  const model = (process.env.OPENROUTER_MODEL || "").trim();

  if (!apiKey || apiKey.includes("your_")) {
    return { provider: "openrouter", status: "SKIPPED", reason: "OPENROUTER_API_KEY is not configured in .env.local" };
  }
  if (!model) {
    return { provider: "openrouter", status: "SKIPPED", reason: "OPENROUTER_MODEL is not configured in .env.local" };
  }

  try {
    const res = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "MockMate Test",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word: READY" }],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { provider: "openrouter", model, status: "FAIL", error: `HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return { provider: "openrouter", model, status: "PASS", reply };
  } catch (err) {
    return { provider: "openrouter", model, status: "FAIL", error: err.message };
  }
}

async function testNvidia() {
  const apiKey = (process.env.NVIDIA_API_KEY || "").trim();
  const model = (process.env.NVIDIA_MODEL || "").trim();

  if (!apiKey || apiKey.includes("your_")) {
    return { provider: "nvidia", status: "SKIPPED", reason: "NVIDIA_API_KEY is not configured in .env.local" };
  }
  if (!model) {
    return { provider: "nvidia", status: "SKIPPED", reason: "NVIDIA_MODEL is not configured in .env.local" };
  }

  try {
    const res = await fetchWithTimeout("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word: READY" }],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { provider: "nvidia", model, status: "FAIL", error: `HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return { provider: "nvidia", model, status: "PASS", reply };
  } catch (err) {
    return { provider: "nvidia", model, status: "FAIL", error: err.message };
  }
}

async function testCloudflare() {
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || "").trim();
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const model = (process.env.CLOUDFLARE_MODEL || "").trim();

  if (!apiToken || apiToken.includes("your_")) {
    return { provider: "cloudflare", status: "SKIPPED", reason: "CLOUDFLARE_API_TOKEN is not configured in .env.local" };
  }
  if (!accountId || accountId.includes("your_")) {
    return { provider: "cloudflare", status: "SKIPPED", reason: "CLOUDFLARE_ACCOUNT_ID is not configured in .env.local" };
  }
  if (!model) {
    return { provider: "cloudflare", status: "SKIPPED", reason: "CLOUDFLARE_MODEL is not configured in .env.local" };
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word: READY" }],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { provider: "cloudflare", model, status: "FAIL", error: `HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return { provider: "cloudflare", model, status: "PASS", reply };
  } catch (err) {
    return { provider: "cloudflare", model, status: "FAIL", error: err.message };
  }
}

async function testCerebras() {
  const apiKey = (process.env.CEREBRAS_API_KEY || "").trim();
  const model = (process.env.CEREBRAS_MODEL || "").trim();

  if (!apiKey || apiKey.includes("your_")) {
    return { provider: "cerebras", status: "SKIPPED", reason: "CEREBRAS_API_KEY is not configured in .env.local" };
  }
  if (!model) {
    return { provider: "cerebras", status: "SKIPPED", reason: "CEREBRAS_MODEL is not configured in .env.local" };
  }

  try {
    const res = await fetchWithTimeout("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word: READY" }],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { provider: "cerebras", model, status: "FAIL", error: `HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return { provider: "cerebras", model, status: "PASS", reply };
  } catch (err) {
    return { provider: "cerebras", model, status: "FAIL", error: err.message };
  }
}

async function testMistral() {
  const apiKey = (process.env.MISTRAL_API_KEY || "").trim();
  const model = (process.env.MISTRAL_MODEL || "").trim();

  if (!apiKey || apiKey.includes("your_")) {
    return { provider: "mistral", status: "SKIPPED", reason: "MISTRAL_API_KEY is not configured in .env.local" };
  }
  if (!model) {
    return { provider: "mistral", status: "SKIPPED", reason: "MISTRAL_MODEL is not configured in .env.local" };
  }

  try {
    const res = await fetchWithTimeout("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word: READY" }],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { provider: "mistral", model, status: "FAIL", error: `HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return { provider: "mistral", model, status: "PASS", reply };
  } catch (err) {
    return { provider: "mistral", model, status: "FAIL", error: err.message };
  }
}

async function run() {
  console.log("===============================================================");
  console.log("     MOCKMATE MULTI-PROVIDER LLM DIAGNOSTIC SUITE              ");
  console.log("===============================================================\n");

  console.log(`Primary Provider:     ${process.env.LLM_PROVIDER || "groq"}`);
  console.log(`Fallback Providers:   ${process.env.LLM_FALLBACK_PROVIDERS || "gemini,openrouter"}\n`);

  console.log("--- 1. Testing Individual Providers (1 request each) ---");

  const [
    groqRes,
    geminiRes,
    openrouterRes,
    nvidiaRes,
    cloudflareRes,
    cerebrasRes,
    mistralRes,
  ] = await Promise.all([
    testGroq(),
    testGemini(),
    testOpenRouter(),
    testNvidia(),
    testCloudflare(),
    testCerebras(),
    testMistral(),
  ]);

  for (const r of [
    groqRes,
    geminiRes,
    openrouterRes,
    nvidiaRes,
    cloudflareRes,
    cerebrasRes,
    mistralRes,
  ]) {
    if (r.status === "PASS") {
      console.log(`✅ [PASS] ${r.provider.toUpperCase()} (${r.model}): "${r.reply}"`);
    } else if (r.status === "SKIPPED") {
      console.log(`⚠️  [SKIPPED] ${r.provider.toUpperCase()}: ${r.reason}`);
    } else {
      console.log(`❌ [FAIL] ${r.provider.toUpperCase()} (${r.model}): ${r.error}`);
    }
  }

  console.log("\n--- 2. Testing Universal Fallback generate() Pipeline ---");
  try {
    const text = await generate({
      system: "You are a concise placement test assistant.",
      messages: [{ role: "user", content: "Reply with the word CONFIRMED." }],
      maxTokens: 25,
      temperature: 0.1,
    });
    console.log(`\n🎉 generate() succeeded!\nResponse: "${text}"`);
  } catch (err) {
    console.error(`\n❌ generate() failed across all configured fallback providers:\n${err.message}`);
  }

  console.log("\n--- 3. Testing Structured JSON Generation & Zod Validation ---");
  const testSchema = z.object({
    status: z.string(),
    verified: z.boolean(),
  });
  try {
    const jsonRes = await generateStructuredJSON(
      'Return a JSON object with status "ok" and verified true.',
      testSchema,
      "You are a test evaluator returning RFC 8259 JSON."
    );
    console.log(`\n🎉 generateStructuredJSON() succeeded!\nParsed result:`, jsonRes);
  } catch (err) {
    console.error(`\n❌ generateStructuredJSON() failed:`, err.message);
  }

  console.log("\n===============================================================");
  console.log("     LLM DIAGNOSTIC COMPLETED                                  ");
  console.log("===============================================================");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
