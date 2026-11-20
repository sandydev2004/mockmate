# MockMate - Production AI Mock Interview & Resume Tool for Placement Preparation

MockMate is a full-stack, production-ready AI interview platform built specifically for engineering college students preparing for campus recruitment (TCS, Infosys, Amazon, Microsoft, Swiggy, Zepto, CRED, and high-growth startups).

It features one-on-one adaptive AI interviews across 4 rounds (**DSA & Problem Solving**, **CS Fundamentals: OS/DBMS/CN**, **System Design**, and **HR/STAR Behavioral**), a live Monaco code editor with Judge0 test case evaluation, resume-aware questioning, ATS resume tailoring, progress analytics with Recharts, real Supabase Auth with Google OAuth and email verification, and Razorpay payment integration for interview credit packs.

---

## 🚀 Key Features

1. **Real AI Placement Interviewer (Zero Mock Fallbacks)**:
   - Powered by Google Gemini (`gemini-3.5-flash`) via server-side API routes.
   - Evaluates whether candidate responses are relevant, technical, or nonsense:
     - If an answer is irrelevant, empty, or nonsense (e.g. `"hello"`), the interviewer politely explains why and re-prompts the exact same question without advancing.
     - If the answer is relevant, the interviewer delivers a 1-line targeted reaction and asks a logical follow-up question.
   - Strictly enforces round domains (DSA, HR, CS Fundamentals, System Design).
   - Atomic credit deduction: credits are checked prior to launch and deducted atomically only after the first AI question succeeds.

2. **Resume-Aware Questioning**:
   - Upload any PDF resume (parsed via `pdf-parse`, max 5 MB).
   - The AI inspects candidate projects, tech stacks, internships, and tools to cross-question candidates authentically.

3. **Live DSA Coding Environment (Monaco + Judge0)**:
   - Dynamically loaded Monaco Editor (`ssr: false`) with explicit container height (`h-[500px]`), loading state, and dark mode.
   - Starter code templates provided out of the box for **Python 3**, **C++ (GCC)**, **Java 17**, and **JavaScript (Node.js)**.
   - Compiles and executes code against test cases using the **Judge0 CE API**. If Judge0 API keys are not configured, clear notices with setup instructions are rendered in the Test Results tab instead of failing silently.
   - Submitting solutions sends the code and test run output to the AI interviewer for runtime complexity and algorithmic critique.

4. **Structured Feedback Reports**:
   - Strictly validated JSON output parsed and verified with **Zod** (with 1 automatic retry).
   - Categorical score bars (0–10) for **Correctness**, **Communication**, **Depth**, and **Problem Solving**.
   - Overall Placement Readiness score (0–100) with rating pill, bulleted strengths, actionable improvements, and hiring manager verdict.

5. **ATS Resume Tailor**:
   - Paste job descriptions from campus T&P cells or LinkedIn and pick a saved resume.
   - AI outputs ATS match score (0–100), matched skills, missing high-impact keywords, and metric-driven bullet point rewrites using Google's **XYZ formula** (*"Accomplished [X] as measured by [Y] by doing [Z]"*).

6. **Voice Input Toggle**:
   - Hands-free verbal answering using browser-native **Web Speech API** (`en-IN` recognition).

7. **Progress Analytics & Score Chart**:
   - Interactive line chart over time powered by **Recharts**.
   - Track session history, peak performance, and average scores stored in Supabase PostgreSQL.

8. **Real Supabase Authentication & Abuse Protection**:
   - **Registration (`/register`)**: Full name, email, password strength meter (min 8 chars, mixed case, numbers, symbols), and terms checkbox.
   - **Abuse Protection**: In-memory rate limiting on auth endpoints and blocking of 20+ common disposable/temporary email domains (`mailinator.com`, `tempmail.com`, etc.).
   - **Email Verification (`/verify-email`)**: Requires email confirmation before accessing private routes.
   - **Login (`/login`)**: Email + password login, "Forgot password" link, and "Continue with Google" OAuth.
   - **Password Recovery (`/forgot-password`, `/reset-password`)**: Self-service secure password reset.
   - **Next.js Middleware (`src/middleware.ts`)**: Protects `/dashboard`, `/interview/*`, `/progress`, `/resume-tailor`, and `/pricing`. Redirects unauthenticated users to `/login` and unverified users to `/verify-email`.
   - **Database Protection Trigger**: `profiles` rows with 1 free credit are created automatically via trigger on `auth.users` insert. Direct client modifications to `credits` are blocked via RLS and trigger enforcement.

9. **Razorpay Payments & Credit Management**:
   - **1 Free Interview Credit** granted automatically on verified signup.
   - 1 credit is deducted atomically when an interview starts.
   - Razorpay INR checkout for credit packs:
     - **Starter Pack**: 3 interviews for ₹99
     - **Placement Pro Pack**: 10 interviews for ₹249
   - Server-side HMAC-SHA256 signature verification and idempotent webhook handler.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (Dark/Light mode support)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Auth, Storage)
- **Multi-Provider LLM Layer**: Groq, Google Gemini, OpenRouter with automatic retry and chain fallback via `/src/lib/llm.ts`
- **Code Execution**: Judge0 CE API (`/submissions`) via RapidAPI or self-hosted Judge0
- **Editor**: Monaco Editor (`@monaco-editor/react`) loaded client-side
- **Visuals & Charts**: Recharts, Lucide React
- **Resume Parsing**: `pdf-parse`
- **Payments**: Razorpay Node.js SDK + Razorpay Standard Checkout

---

## 📦 Project Structure

```
mock-interview/
├── src/
│   ├── middleware.ts                   # Next.js route protection & session refresh
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts   # Rate limited signup with disposable email check
│   │   │   │   ├── login/route.ts      # Credentials sign-in & verification check
│   │   │   │   ├── logout/route.ts     # Supabase sign-out
│   │   │   │   ├── session/route.ts    # Live authenticated profile & credit query
│   │   │   │   ├── resend/route.ts     # Resend verification email
│   │   │   │   └── callback/route.ts   # Supabase OAuth & email confirmation exchange
│   │   │   ├── interview/
│   │   │   │   ├── start/route.ts      # Real Gemini start & atomic credit deduction
│   │   │   │   ├── answer/route.ts     # Gemini relevance evaluation & adaptive follow-up
│   │   │   │   ├── finish/route.ts     # Real Gemini structured feedback generator
│   │   │   │   └── [id]/route.ts       # Get session details & problem statement
│   │   │   ├── code/
│   │   │   │   └── run/route.ts        # Judge0 code execution against test cases
│   │   │   ├── resume/
│   │   │   │   ├── upload/route.ts     # PDF sanitization and parsing
│   │   │   │   └── tailor/route.ts     # ATS match score & bullet rewriter
│   │   │   └── payments/
│   │   │       ├── create-order/route.ts # Razorpay order creation
│   │   │       ├── verify/route.ts     # HMAC-SHA256 signature verification
│   │   │       └── webhook/route.ts    # Idempotent payment webhook
│   │   ├── auth/
│   │   │   └── callback/route.ts       # Server-side Next.js App Router OAuth callback
│   │   ├── dashboard/page.tsx          # Real user name, credits & past sessions
│   │   ├── register/page.tsx           # Signup with strength meter & Google OAuth
│   │   ├── login/page.tsx              # Signin with Google OAuth & password reset link
│   │   ├── verify-email/page.tsx       # Verification prompt with resend cooldown
│   │   ├── forgot-password/page.tsx    # Password reset email request
│   │   ├── reset-password/page.tsx     # New password update
│   │   ├── interview/
│   │   │   ├── setup/page.tsx          # Role, company, difficulty & resume selector
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Live room (Chat + Monaco + Judge0 + Voice)
│   │   │       └── report/page.tsx     # Structured feedback report
│   │   ├── resume-tailor/page.tsx      # ATS keyword match & XYZ rewriter
│   │   ├── progress/page.tsx           # Recharts score progression over time
│   │   ├── pricing/page.tsx            # Credit packs & Razorpay checkout
│   │   └── page.tsx                    # Landing page
│   ├── components/
│   │   ├── Navbar.tsx                  # Navbar displaying real candidate name & credits
│   │   ├── CodeEditor.tsx              # Dynamic Monaco Editor with explicit height & starter code
│   │   ├── ScoreChart.tsx              # Recharts line chart
│   │   └── ThemeToggle.tsx             # Dark / light switcher
│   └── lib/
│       ├── auth.ts                     # Supabase session resolver & profile query
│       ├── auth-guards.ts              # Disposable email list, rate limiter, password strength
│       ├── llm.ts                      # Gemini API wrapper with evaluation & JSON schema parsing
│       ├── judge0.ts                   # Judge0 API execution with clear error handling
│       ├── dsa-problems.ts             # 20 Placement DSA problems with test cases
│       └── supabase/
│           ├── client.ts               # Browser Supabase client
│           ├── server.ts               # Server Supabase client with cookies
│           └── admin.ts                # Service role Supabase admin client
├── supabase/
│   └── migrations/
│       ├── 20240101000000_init.sql     # Complete schema, RLS policies & RPCs
│       ├── 20240102000000_integrity_events.sql # Proctoring events & session token
│       └── 20240103000000_google_auth_trigger.sql # Google OAuth & 1-credit trigger
├── scripts/
│   ├── seed.mjs                        # 20 DSA problems database seeder
│   ├── test-google-auth-callback.mjs   # Google OAuth callback & open-redirect test suite
│   ├── test-e2e.mjs                    # Complete E2E & proctoring test suite
│   ├── verify-full-flow.mjs            # End-to-end Part D verification script
│   └── test-llm.mjs                    # Multi-provider LLM tester
├── .env.example
└── README.md
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your API credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Multi-Provider LLM Layer
LLM_PROVIDER=groq
LLM_FALLBACK_PROVIDERS=gemini,openrouter

# Provider API Keys & Model Names
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash-lite

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct

JUDGE0_API_KEY=your_rapidapi_judge0_key
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

### 3. Seed 20 Placement DSA Problems into Supabase
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Supabase Configuration Guide

### 1. Database Schema & RLS Setup
1. Go to the **SQL Editor** in your Supabase Dashboard.
2. Run the script [`supabase/migrations/20240101000000_init.sql`](./supabase/migrations/20240101000000_init.sql).
3. This creates:
   - Tables: `profiles`, `resumes`, `interviews`, `messages`, `code_submissions`, `feedback`, `payments`, `dsa_problems`.
   - The `handle_new_user()` trigger on `auth.users` insert (allocates 1 free credit automatically).
   - The `protect_profile_credits()` trigger to prevent clients from updating credits directly.
   - The `deduct_interview_credit` stored procedure for atomic credit deduction.

### 2. Supabase URL & Authentication Configuration
1. In the Supabase Dashboard, go to **Authentication -> URL Configuration**:
   - **Site URL**: `http://localhost:3000` (or `https://your-domain.vercel.app` in production).
   - **Redirect URLs** (Allow List): Add all of the following:
     ```text
     http://localhost:3000/auth/callback
     http://localhost:3000/api/auth/callback
     http://localhost:3000/reset-password
     http://localhost:3000/dashboard
     https://your-domain.vercel.app/auth/callback
     https://your-domain.vercel.app/api/auth/callback
     https://your-domain.vercel.app/reset-password
     https://your-domain.vercel.app/dashboard
     ```
2. In **Authentication -> Providers -> Email**:
   - **Enable Email provider**: Turn ON.
   - **Confirm email**: Turn ON to enforce email confirmation before access.
   - For custom transactional emails, configure SMTP under **Project Settings -> Authentication -> SMTP Settings**.

### 3. Google OAuth Setup (Google Cloud & Supabase)
1. **Google Cloud Console**:
   - Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
   - Create a project or select your existing project.
   - Configure the **OAuth consent screen**:
     - User type: **External**.
     - App name: `MockMate`.
     - Fill in User support email and Developer contact email.
     - Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
   - Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**:
     - Application type: **Web application**.
     - Name: `MockMate Web Client`.
     - **Authorized JavaScript origins**:
       - `http://localhost:3000`
       - `https://your-domain.vercel.app` (for production)
     - **Authorized redirect URIs**:
       - `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`
   - Click **Create** and copy your **Client ID** and **Client Secret**.

2. **Supabase Provider Activation**:
   - In Supabase Dashboard, navigate to **Authentication -> Providers -> Google**.
   - Toggle **Enable Sign in with Google** to ON.
   - Paste the **Client ID** and **Client Secret** obtained from Google Cloud.
   - Toggle **Skip nonce checks** if needed for standard OAuth web redirection.
   - Click **Save**.

3. **Google User Profile & 1 Free Credit Trigger**:
   - Go to Supabase **SQL Editor** and run [`supabase/migrations/20240103000000_google_auth_trigger.sql`](./supabase/migrations/20240103000000_google_auth_trigger.sql).
   - **Guarantees**:
     - Extracts the candidate's full name from Google metadata (`full_name` or `name`).
     - Grants new Google candidates exactly 1 free placement interview credit.
     - Prevents duplicate profile creation and credit inflation if an existing email/password user logs in with the same Gmail.
     - Google accounts are email-verified at the provider level, skipping manual email verification gates.

4. **Testing Google OAuth & Callback Route**:
   Run the dedicated callback test suite:
   ```bash
   node --env-file=.env.local scripts/test-google-auth-callback.mjs
   ```
   **Assertions Verified**:
   - Open-redirect protection on the `next` param (blocks absolute external URLs, protocol-relative `//evil.com`, backslash bypasses, and javascript URIs; preserves legitimate relative paths).
   - Missing/invalid OAuth code error handling and provider error passthrough back to `/login?error=...`.
   - Brand new Google user profile creation with 1 free credit.
   - Existing Gmail user credit retention (no second profile or duplicated credits).
   - Skipping email confirmation for pre-verified Google accounts.

---

## 🤖 Multi-Provider LLM Configuration (Groq, Gemini, OpenRouter)

MockMate features a unified, multi-provider LLM layer (`src/lib/llm.ts`) with automatic fallback and retry capabilities. If your primary provider experiences a rate limit (HTTP 429), server error (5xx), request timeout (20s), or empty reply, it retries once and seamlessly falls back to secondary providers in order.

### Where to Obtain Provider API Keys

1. **Groq (Recommended for Ultra-Fast Interview Responses)**:
   - **Get API Key**: Create a free account at [console.groq.com/keys](https://console.groq.com/keys).
   - **Supported Models**: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`.
   - **Configuration**:
     ```env
     LLM_PROVIDER=groq
     GROQ_API_KEY=gsk_your_key_here
     GROQ_MODEL=llama-3.3-70b-versatile
     ```

2. **Google Gemini**:
   - **Get API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - **Supported Models**: `gemini-2.5-flash-lite`, `gemini-2.0-flash`, `gemini-1.5-flash`.
   - **Configuration**:
     ```env
     GEMINI_API_KEY=AIzaSy_your_key_here
     GEMINI_MODEL=gemini-2.5-flash-lite
     ```

3. **OpenRouter (Unified Gateway to Hundreds of Open & Closed Models)**:
   - **Get API Key**: Sign up at [openrouter.ai/keys](https://openrouter.ai/keys).
   - **Supported Models**: `meta-llama/llama-3.3-70b-instruct`, `google/gemini-2.0-flash-001`, `deepseek/deepseek-chat`, `mistralai/mistral-7b-instruct`.
   - **Configuration**:
     ```env
     OPENROUTER_API_KEY=sk-or-v1-your_key_here
     OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
     ```

4. **NVIDIA Build**:
   - **Get API Key**: Generate key at [build.nvidia.com](https://build.nvidia.com).
   - **Supported Models**: `meta/llama-3.1-70b-instruct`, `mistralai/mixtral-8x22b-instruct-v0.1`.
   - **Configuration**:
     ```env
     NVIDIA_API_KEY=nvapi-...
     NVIDIA_MODEL=meta/llama-3.1-70b-instruct
     ```
   *(Note: Do not put `nvidia` in the default fallback list; configure explicitly when needed)*

5. **Cloudflare Workers AI**:
   - **Get API Token & Account ID**: Cloudflare Dashboard -> Workers AI.
   - **Supported Models**: `@cf/meta/llama-3.3-70b-instruct-fp8`, `@cf/meta/llama-3.1-8b-instruct`.
   - **Configuration**:
     ```env
     CLOUDFLARE_API_TOKEN=your_token
     CLOUDFLARE_ACCOUNT_ID=your_account_id
     CLOUDFLARE_MODEL=@cf/meta/llama-3.3-70b-instruct-fp8
     ```

6. **Cerebras**:
   - **Get API Key**: Register at [cloud.cerebras.ai](https://cloud.cerebras.ai).
   - **Supported Models**: `llama3.1-70b`, `llama3.1-8b`.
   - **Configuration**:
     ```env
     CEREBRAS_API_KEY=csk-...
     CEREBRAS_MODEL=llama3.1-70b
     ```

7. **Mistral AI**:
   - **Get API Key**: Obtain API key at [console.mistral.ai](https://console.mistral.ai).
   - **Supported Models**: `mistral-large-latest`, `codestral-latest`, `mistral-small-latest`.
   - **Configuration**:
     ```env
     MISTRAL_API_KEY=your_key
     MISTRAL_MODEL=mistral-large-latest
     ```

> [!IMPORTANT]
> **Model Name Matching**: Model names are read directly from environment variables (`GROQ_MODEL`, `GEMINI_MODEL`, `OPENROUTER_MODEL`, `NVIDIA_MODEL`, `CLOUDFLARE_MODEL`, `CEREBRAS_MODEL`, `MISTRAL_MODEL`) and are **never hardcoded**. Ensure the model string matches the provider's active model list. Providers with empty keys are automatically skipped.

### Fallback Order & Safety Guarantees
- The provider order is defined by:
  ```env
  LLM_PROVIDER=groq
  LLM_FALLBACK_PROVIDERS=gemini,openrouter
  ```
- **10-Minute Cooldown**: Any provider that returns HTTP 429 or quota exhaustion errors is automatically placed in an in-memory 10-minute cooldown and temporarily bypassed in favor of remaining providers.
- If all configured providers fail, a clear error message is returned to the UI detailing which providers failed and why.
- No interview question will be advanced and **no interview credits will be deducted** on LLM failure.

---

## 💻 Judge0 Code Execution Setup

1. Sign up on [RapidAPI](https://rapidapi.com/) and subscribe to the [Judge0 CE API](https://rapidapi.com/hermanzdosilovic/api/judge0-ce).
2. Copy your RapidAPI Key into `.env.local`:
   ```env
   JUDGE0_API_KEY=your_key_here
   JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
   ```
3. If no key is set, the Monaco Code Editor displays a clear configuration guide in the "Test Results" tab instead of failing silently.

---

## 💳 Razorpay Payments Setup

1. Create a free account at [dashboard.razorpay.com](https://dashboard.razorpay.com) and switch to **Test Mode**.
2. Under **Account & Settings -> API Keys**, generate test keys.
3. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```
4. For Webhooks:
   - Endpoint URL: `https://your-domain.vercel.app/api/payments/webhook`
   - Active Events: `order.paid`, `payment.captured`.
   - Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`.

---

## 🧪 Verification & Automated Testing

To run the complete automated test suite verifying all 4 phases:
```bash
node --env-file=.env.local scripts/verify-full-flow.mjs
```
The test verifies:
- Abuse protection: Rejection of disposable email domains (`@mailinator.com`).
- Password validation: Rejection of weak passwords (< 8 characters).
- Registration flow & password strength meter.
- Email verification enforcement (blocking login until confirmed).
- Authenticated session fetching with real candidate name and credits.
- Starting interview with real Gemini AI (`gemini-3.5-flash`).
- Gemini evaluation of nonsense input (`"hello"`): politely requests candidate's technical approach and keeps question index at 1.
- Gemini evaluation of real technical answer: gives 1-line reaction and advances question index to 2.
- Monaco Code Editor execution with Judge0 integration notice.
- Generating and storing structured feedback report in Supabase.

---

## 🛡️ Secure Admin Operations Portal (`/admin`)

MockMate includes a production-grade operations and security panel located at `/admin`, built with zero security bypasses, strict 404 masking, and tamper-resistant audit trails.

### Access Control & First Admin Setup
- Access to `/admin` and every `/api/admin/*` endpoint is verified **strictly on the server** using Supabase session authentication, role hierarchy (`support`, `admin`, `super_admin`), and mandatory MFA (AAL2).
- **404 Reconnaissance Masking**: Any unauthenticated visitor, non-admin candidate (`role = 'user'`), or admin without MFA enrolled accessing `/admin` or `/api/admin/*` immediately receives an HTTP `404 Not Found` response. Admin entry points are never disclosed or leaked in robots.txt.
- **Promoting the First Super Administrator**: Admin privileges cannot be registered through the public UI. The first administrator must be promoted directly in the Supabase SQL Editor:
  ```sql
  -- Run this in the Supabase SQL Editor to grant super_admin access to your account:
  UPDATE public.profiles 
  SET role = 'super_admin' 
  WHERE email = 'your-email@example.com';
  ```
- **Mandatory MFA (Supabase TOTP) & Recovery**:
  - Every account with an administrative role (`support`, `admin`, `super_admin`) is required to have Supabase TOTP enrolled.
  - Unenrolled admins visiting the portal are restricted to `/admin/mfa` until their session reaches Authenticator Assurance Level 2 (AAL2).
  - **Emergency MFA Recovery**: If an administrator loses their TOTP device, a database superuser can reset the MFA factor via SQL:
    ```sql
    DELETE FROM auth.mfa_factors 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
    ```
- **Role Hierarchy & Least Privilege (Configured in `src/lib/admin-permissions.ts`)**:
  - `user`: Candidate. No admin access.
  - `support`: Read users/interviews, adjust small credits (≤ 10 credits) with mandatory reason. Cannot suspend, delete, export, or change settings/roles.
  - `admin`: Moderate operations, suspend users, soft-delete, restore within 14-day grace period, and view general settings.
  - `super_admin`: Platform governance, manage admin roles, toggle platform settings & emergency kill-switches, approve high-volume requests, view raw candidate data, and verify audit log hash chains.
  - **Self-Escalation & Last Admin Safeguards**: Admins can never alter their own role, and the system strictly prevents removing or demoting the last `super_admin`.

### Step-Up Re-Authentication & Dual Approvals
- **Fresh Step-Up Auth**: Destructive actions (deleting users, granting ≥ 20 credits, changing roles, modifying kill-switches, data exports) require fresh re-authentication (password or TOTP within 5 minutes) and a typed confirmation phrase (`confirm: "CONFIRM_DELETE"`).
- **Dual Approval Workflow**: Granting > 50 credits or deleting multiple users at once cannot be completed unilaterally. The request enters a pending state (`admin_approvals`) and must be reviewed and approved by a second `super_admin` (`approver_id !== requester_id`).

### Daily Limits & Privacy-Preserving Security Alerts
- **Daily Caps**: Per-admin daily limits (100 credits granted, 10 users deleted, 5 data exports per calendar day). Exceeding limits blocks the action and generates a security alert.
- **Anomaly Alerts**: Configurable via `ALERT_EMAIL` or `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`. Alerts are dispatched on failed logins, role changes, deletions, exports, and kill-switch changes. **Alerts strictly strip all candidate personal data** (no emails, names, transcripts, or resumes).

### Tamper-Proof Audit Trail with Cryptographic Hash Chain
- **Append-Only Database Enforcement**: Database triggers and RLS policies strictly reject any `UPDATE` or `DELETE` statements on `public.audit_logs`.
- **SHA-256 Hash Chain**: Every audit entry stores a deterministic hash of its predecessor (`prev_hash`) and its contents (`entry_hash`).
- **Log Verification Tool**: Super administrators can trigger `/api/admin/audit/verify` to detect any altered records, broken pointers, or missing entries.

### Network Hardening & Session Security
- **Short Sessions**: 30-minute idle timeout with 8-hour maximum session lifetime.
- **Global Signout**: "Sign Out Everywhere" endpoint (`POST /api/admin/auth/signout-all`) invalidates all active sessions for the administrator.
- **Optional IP Allowlist**: Controlled via `ADMIN_ALLOWED_IPS=127.0.0.1,192.168.1.100`. In emergencies, super admins can bypass the allowlist using the secret `x-admin-recovery-token` matching `ADMIN_RECOVERY_KEY`.
- **Security Headers**: Admin routes enforce strict `Content-Security-Policy`, `X-Frame-Options: DENY`, `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, and CSRF/Origin validation on state-changing requests.

### Admin Features & Capabilities
1. **Overview Dashboard (`/admin`)**:
   - Total users, 7-day and 30-day signup velocity.
   - Interviews started, completed, and auto-submitted.
   - Total paid revenue (INR) and credit supply vs consumption.
   - Interactive Recharts activity trend line over the past 14 days.
   - Real-time AI provider telemetry: active primary provider, fallback chain, cooldown indicators, and error counts.
2. **Users & Credits Management (`/admin/users`, `/admin/users/[id]`)**:
   - Paginated candidate search and status filtering (active / suspended).
   - **Credit Quota Adjustments**: Adding or deducting credits strictly requires a detailed administrative reason and is permanently recorded in `audit_logs`.
   - **Account Suspension**: Suspended accounts are immediately blocked with HTTP `403 Forbidden` from initiating interviews.
   - Resend email verifications and permanent account deletion with confirmation dialogs.
3. **Interview Sessions & Integrity Auditing (`/admin/interviews`, `/admin/interviews/[id]`)**:
   - Filter by round, difficulty, status, risk rating, and auto-submit triggers.
   - Session breakdown: score breakdown, strikes accumulated, and chronological proctoring events.
   - **Protected Candidate Data**: Interview transcripts and resume texts are concealed behind an explicit *"View Sensitive Data"* gate. Unmasking sensitive personal data triggers an audit log record.
   - Private administrative review verdicts (`Approved`, `Flagged`, `Inconclusive`) with internal notes.
4. **Integrity Review Queue (`/admin/integrity`)**:
   - Dedicated priority queue for all sessions flagged with Medium/High integrity risk or triggered auto-submits awaiting review.
   - One-click Approve / Flag review workflow.
5. **Payments & Billing (`/admin/payments`)**:
   - Audit Razorpay order IDs, payment IDs, amounts in INR, and fulfillment statuses.
   - Manual credit fulfillment modal with mandatory justification for verified offline or failed webhook transactions.
6. **AI Fleet & Platform Controls (`/admin/ai-settings`)**:
   - Live status of all 7 AI providers (Groq, Gemini, OpenRouter, NVIDIA, Cloudflare, Cerebras, Mistral) without exposing API secret keys.
   - **Emergency Kill-Switch**: Administrative toggle to pause candidate interview launches during provider maintenance or outages.
   - Dynamic platform overrides: max daily interviews, strike thresholds, and grace periods saved to `platform_settings`.
7. **DSA Problem Bank (`/admin/problems`)**:
   - Manage coding interview challenges, test cases, and starter templates.
   - Activate/deactivate problems from candidate rotation and batch import via JSON.
8. **Audit Trail (`/admin/audit`)**:
   - Searchable, filterable immutable log of administrative actions, targets, timestamps, IP addresses, and before/after states.
9. **Secure CSV Export (`/api/admin/export`)**:
   - Streamed CSV exports for users, interviews, and payments (secrets and raw resumes omitted).

### Testing Admin Security & Functionality
Run the specialized administrative test suite:
```bash
node --env-file=.env.local scripts/test-admin.mjs
```

---

## 🌐 Deployment to Vercel

1. Push your code to GitHub.
2. In Vercel, click **Add New Project** and select the repository.
3. In **Environment Variables**, add all keys from `.env.local`.
4. Click **Deploy**. Next.js App Router will build and deploy cleanly.
