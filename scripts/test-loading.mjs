import fs from "fs";
import path from "path";
import assert from "assert";

console.log("\n🧪 Running MockMate Loading System Test Suite...\n");

const ROOT = process.cwd();

// 1. Verify Shared Components Exist
const sharedComponents = [
  "src/components/loading/Spinner.tsx",
  "src/components/loading/Skeleton.tsx",
  "src/components/loading/TopProgressBar.tsx",
  "src/components/loading/ButtonLoading.tsx",
  "src/components/loading/TypingDots.tsx",
  "src/components/loading/StepLoader.tsx",
  "src/components/loading/FullPageLoader.tsx",
  "src/components/loading/useDelayedLoader.ts",
  "src/components/loading/index.ts",
];

for (const comp of sharedComponents) {
  const fullPath = path.join(ROOT, comp);
  assert(fs.existsSync(fullPath), `Missing shared loading component: ${comp}`);
  console.log(`  ✓ Shared component exists: ${comp}`);
}

// 2. Verify Route Loading Skeletons Exist
const routeLoaders = [
  "src/app/dashboard/loading.tsx",
  "src/app/interview/setup/loading.tsx",
  "src/app/interview/[id]/loading.tsx",
  "src/app/interview/[id]/report/loading.tsx",
  "src/app/progress/loading.tsx",
  "src/app/resume-tailor/loading.tsx",
  "src/app/pricing/loading.tsx",
  "src/app/admin/loading.tsx",
  "src/app/admin/users/loading.tsx",
  "src/app/admin/interviews/loading.tsx",
  "src/app/admin/payments/loading.tsx",
  "src/app/admin/problems/loading.tsx",
  "src/app/admin/audit/loading.tsx",
  "src/app/admin/ai-settings/loading.tsx",
  "src/app/admin/integrity/loading.tsx",
];

for (const loader of routeLoaders) {
  const fullPath = path.join(ROOT, loader);
  assert(fs.existsSync(fullPath), `Missing route loading skeleton: ${loader}`);
  const content = fs.readFileSync(fullPath, "utf-8");
  assert(
    content.includes("role=\"status\"") || content.includes("aria-busy"),
    `Route skeleton ${loader} should include accessibility role="status" or aria-busy`
  );
  console.log(`  ✓ Route skeleton exists & accessible: ${loader}`);
}

// 3. Verify CSS Shimmer and Prefers-Reduced-Motion
const globalsCss = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf-8");
assert(globalsCss.includes("@keyframes shimmer"), "globals.css missing @keyframes shimmer");
assert(globalsCss.includes("animate-shimmer"), "globals.css missing .animate-shimmer class");
assert(globalsCss.includes("prefers-reduced-motion"), "globals.css missing @media (prefers-reduced-motion: reduce)");
console.log("  ✓ globals.css contains shimmer keyframes and prefers-reduced-motion rules");

// 4. Verify Spinner accessibility attributes
const spinnerCode = fs.readFileSync(path.join(ROOT, "src/components/loading/Spinner.tsx"), "utf-8");
assert(spinnerCode.includes("role=\"status\""), "Spinner missing role=\"status\"");
assert(spinnerCode.includes("aria-live"), "Spinner missing aria-live");
assert(spinnerCode.includes("sr-only"), "Spinner missing sr-only loading text");
console.log("  ✓ Spinner includes role=\"status\", aria-live, and screen-reader label");

// 5. Verify ButtonLoading attributes
const buttonCode = fs.readFileSync(path.join(ROOT, "src/components/loading/ButtonLoading.tsx"), "utf-8");
assert(buttonCode.includes("aria-busy"), "ButtonLoading missing aria-busy attribute");
assert(buttonCode.includes("disabled={disabled || loading}"), "ButtonLoading must disable when loading");
console.log("  ✓ ButtonLoading enforces aria-busy and disabled state while loading");

// 6. Verify TopProgressBar in Layout
const layoutCode = fs.readFileSync(path.join(ROOT, "src/app/layout.tsx"), "utf-8");
assert(layoutCode.includes("TopProgressBar"), "src/app/layout.tsx must render TopProgressBar");
console.log("  ✓ Root layout mounts TopProgressBar");

console.log("\n🎉 All 15 Loading System verification checks passed successfully!\n");
