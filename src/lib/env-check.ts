/**
 * Startup Environment Variables Checker
 * Validates required configuration on server boot and prints a formatted diagnostic report.
 */

let hasRunCheck = false;

export function runStartupEnvCheck() {
  if (hasRunCheck) return;
  hasRunCheck = true;

  const primaryProvider = (process.env.LLM_PROVIDER || "groq").trim().toLowerCase();
  const fallbackProviders = (process.env.LLM_FALLBACK_PROVIDERS || "gemini,openrouter")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const requiredVars = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", desc: "Supabase Project URL" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", desc: "Supabase Public Anonymous Key" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", desc: "Supabase Service Role Key (Admin)" },
  ];

  const optionalVars = [
    { name: "JUDGE0_API_KEY", desc: "RapidAPI Key for Judge0 CE API Code Execution" },
    { name: "JUDGE0_BASE_URL", desc: "Judge0 CE Endpoint URL" },
    { name: "RAZORPAY_KEY_ID", desc: "Razorpay Test/Live Key ID" },
    { name: "RAZORPAY_KEY_SECRET", desc: "Razorpay Secret Key" },
  ];

  const missingRequired = requiredVars.filter(
    (v) => !process.env[v.name] || process.env[v.name]?.trim() === "" || process.env[v.name]?.includes("your_")
  );

  const missingOptional = optionalVars.filter(
    (v) => !process.env[v.name] || process.env[v.name]?.trim() === "" || process.env[v.name]?.includes("your_")
  );

  // Check LLM Provider Keys
  const providersToCheck = [
    {
      name: "Groq",
      keyName: "GROQ_API_KEY",
      modelName: "GROQ_MODEL",
      hasKey: Boolean(process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes("your_")),
      model: process.env.GROQ_MODEL || "(none)",
    },
    {
      name: "Gemini",
      keyName: "GEMINI_API_KEY",
      modelName: "GEMINI_MODEL",
      hasKey: Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your_")),
      model: process.env.GEMINI_MODEL || "(none)",
    },
    {
      name: "OpenRouter",
      keyName: "OPENROUTER_API_KEY",
      modelName: "OPENROUTER_MODEL",
      hasKey: Boolean(process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes("your_")),
      model: process.env.OPENROUTER_MODEL || "(none)",
    },
    {
      name: "NVIDIA",
      keyName: "NVIDIA_API_KEY",
      modelName: "NVIDIA_MODEL",
      hasKey: Boolean(process.env.NVIDIA_API_KEY && !process.env.NVIDIA_API_KEY.includes("your_")),
      model: process.env.NVIDIA_MODEL || "(none)",
    },
    {
      name: "Cloudflare Workers AI",
      keyName: "CLOUDFLARE_API_TOKEN",
      modelName: "CLOUDFLARE_MODEL",
      hasKey: Boolean(process.env.CLOUDFLARE_API_TOKEN && !process.env.CLOUDFLARE_API_TOKEN.includes("your_")),
      model: process.env.CLOUDFLARE_MODEL || "(none)",
    },
    {
      name: "Cerebras",
      keyName: "CEREBRAS_API_KEY",
      modelName: "CEREBRAS_MODEL",
      hasKey: Boolean(process.env.CEREBRAS_API_KEY && !process.env.CEREBRAS_API_KEY.includes("your_")),
      model: process.env.CEREBRAS_MODEL || "(none)",
    },
    {
      name: "Mistral",
      keyName: "MISTRAL_API_KEY",
      modelName: "MISTRAL_MODEL",
      hasKey: Boolean(process.env.MISTRAL_API_KEY && !process.env.MISTRAL_API_KEY.includes("your_")),
      model: process.env.MISTRAL_MODEL || "(none)",
    },
  ];

  const hasAtLeastOneLLM = providersToCheck.some((p) => p.hasKey);

  console.log("\n============================================================");
  console.log("🚀 MOCKMATE STARTUP ENVIRONMENT CHECK");
  console.log("============================================================");

  if (missingRequired.length === 0 && hasAtLeastOneLLM) {
    console.log("✅ Core database & authentication configuration is verified.");
  } else {
    console.error("❌ CRITICAL: Missing required environment variables:");
    for (const v of missingRequired) {
      console.error(`   - ${v.name}: ${v.desc}`);
    }
    if (!hasAtLeastOneLLM) {
      console.error("   - No LLM provider configured (GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY required)");
    }
  }

  console.log(`🤖 Primary LLM Provider: ${primaryProvider}`);
  console.log(`🔄 Fallback Providers: ${fallbackProviders.join(" -> ")}`);
  for (const p of providersToCheck) {
    const status = p.hasKey ? `READY (Model: ${p.model})` : "MISSING KEY (will skip if unconfigured)";
    console.log(`   • ${p.name}: ${status}`);
  }

  if (missingOptional.length > 0) {
    console.warn("\n⚠️  Optional integrations missing keys (feature-specific):");
    for (const v of missingOptional) {
      console.warn(`   - ${v.name}: ${v.desc}`);
    }
  }

  console.log("============================================================\n");
}
