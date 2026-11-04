# MockMate - AI Mock Interview & Resume Tool for Indian College Placements

MockMate is a full-stack, production-ready AI interview platform built specifically for Indian engineering college students preparing for campus recruitment (TCS, Infosys, Amazon, Microsoft, Swiggy, Zepto, CRED, and startups).

It features one-on-one adaptive AI interviews across 4 rounds (**DSA & Problem Solving**, **CS Fundamentals: OS/DBMS/CN**, **System Design**, and **HR/STAR Behavioral**), a live Monaco code editor with Judge0 test case evaluation, resume-aware questioning, ATS resume tailoring, progress analytics with Recharts, and Razorpay payment integration for interview credit packs.

---

## 🚀 Key Features

1. **Realistic Placement AI Interviewer**:
   - Company-specific evaluation models: **Service-based** (TCS, Infosys, Wipro, Cognizant), **Product-based** (Amazon, Microsoft, Swiggy), and **High-growth Startups** (CRED, Zepto, Razorpay).
   - One question at a time, adaptive follow-ups, short hints on request, under 120 words per response.
   - Strict prompt injection prevention: candidate input and resume text are treated as untrusted data.

2. **Resume-Aware Question Mode**:
   - Upload any PDF resume (parsed via `pdf-parse`, max 5 MB).
   - The AI reads actual projects, tech stacks, internships, and tools to cross-question candidates authentically.

3. **Live DSA Coding Environment**:
   - Monaco Editor with multi-language support: **Python 3**, **C++ (GCC)**, **Java 17**, and **JavaScript (Node)**.
   - Run code against sample and hidden test cases powered by the **Judge0 CE API** (with a built-in zero-dependency local runner fallback).
   - Instant execution results: stdout, stderr, execution time, memory usage, and pass/fail status.
   - Submitting solutions streams the code to the AI interviewer for runtime complexity and algorithmic critique.

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
   - Track session history, peak performance, and average scores.

8. **Razorpay Payments & Credit Management**:
   - **1 Free Interview Credit** granted automatically on signup.
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
- **LLM Provider**: Provider-agnostic wrapper in `/src/lib/llm.ts` (Google Gemini API by default, easily swappable)
- **Code Execution**: Judge0 CE API (`/submissions`) + local execution fallback
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Visuals & Charts**: Recharts, Lucide React
- **Resume Parsing**: `pdf-parse`
- **Payments**: Razorpay Node.js SDK + Razorpay Standard Checkout

---

## 📦 Project Structure

```
mock-interview/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── interview/
│   │   │   │   ├── start/route.ts      # Credit deduction, initial question
│   │   │   │   ├── answer/route.ts     # Conversational follow-ups
│   │   │   │   ├── finish/route.ts     # Structured feedback report generator
│   │   │   │   └── [id]/route.ts       # Get interview state
│   │   │   ├── code/
│   │   │   │   └── run/route.ts        # Judge0 code execution
│   │   │   ├── resume/
│   │   │   │   ├── upload/route.ts     # PDF sanitization and parsing
│   │   │   │   └── tailor/route.ts     # ATS match score & bullet rewriter
│   │   │   ├── payments/
│   │   │   │   ├── create-order/route.ts # Razorpay order creation
│   │   │   │   ├── verify/route.ts     # HMAC-SHA256 signature verification
│   │   │   │   └── webhook/route.ts    # Idempotent payment webhook
│   │   │   └── auth/demo/route.ts      # Demo session management
│   │   ├── dashboard/page.tsx          # Overview, credits & recent sessions
│   │   ├── interview/
│   │   │   ├── setup/page.tsx          # Configure role, company & resume
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Live room (Chat + Monaco + Voice)
│   │   │       └── report/page.tsx     # Structured feedback report
│   │   ├── resume-tailor/page.tsx      # ATS keyword match & XYZ rewriter
│   │   ├── progress/page.tsx           # Recharts score progression
│   │   ├── pricing/page.tsx            # Credit packs & Razorpay checkout
│   │   ├── login/page.tsx              # Auth & 1-click evaluation access
│   │   ├── layout.tsx                  # Global theme, Nav, Footer, Razorpay script
│   │   ├── globals.css                 # Custom scrollbars, animations, colors
│   │   └── page.tsx                    # Landing page
│   ├── components/
│   │   ├── Navbar.tsx                  # Navigation bar with credit badge
│   │   ├── Footer.tsx                  # Placement footer
│   │   ├── ThemeToggle.tsx             # Dark / light switcher
│   │   ├── CodeEditor.tsx              # Monaco editor wrapper
│   │   └── ScoreChart.tsx              # Recharts responsive line chart
│   ├── lib/
│   │   ├── auth.ts                     # Session resolver (Supabase + local)
│   │   ├── dsa-problems.ts             # 20 Placement DSA problems with test cases
│   │   ├── judge0.ts                   # Judge0 API execution + local runner
│   │   ├── llm.ts                      # Gemini API wrapper, Zod schemas, prompt guards
│   │   ├── store.ts                    # In-memory persistence fallback
│   │   ├── utils.ts                    # ClassNames, score colors, time formatters
│   │   └── supabase/
│   │       ├── client.ts               # Browser Supabase client
│   │       ├── server.ts               # Server Supabase client (cookies)
│   │       └── admin.ts                # Service role Supabase admin
│   └── types/
│       └── index.ts                    # Full TypeScript domain contracts
├── supabase/
│   └── migrations/
│       └── 20240101000000_init.sql     # Complete schema, RLS policies & RPCs
├── scripts/
│   └── seed.mjs                        # 20 DSA problems seed script
├── .env.example                        # Documented environment variables
└── README.md
```

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the template file to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> **Instant Demo Mode**: MockMate comes pre-configured with a local mock store and built-in code runner, allowing you to test authentication, take a free interview, run code, view feedback reports, tailor resumes, and test Razorpay payment flows immediately without waiting for API approvals!

### 4. Seed 20 DSA Problems
```bash
npm run seed
```

---

## 🔧 Environment Variables Reference

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://your-project.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for server/admin operations) |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `GEMINI_MODEL` | Gemini model (default: `gemini-1.5-flash`) |
| `JUDGE0_BASE_URL` | Judge0 CE Base URL (`https://judge0-ce.p.rapidapi.com`) |
| `JUDGE0_API_KEY` | RapidAPI key for Judge0 CE API |
| `JUDGE0_API_HOST` | RapidAPI host (`judge0-ce.p.rapidapi.com`) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID (`rzp_test_...`) |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (server-side) |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret (server-side signature verification) |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured in Razorpay Webhook Dashboard |
| `NEXT_PUBLIC_APP_URL` | Deployment URL (default: `http://localhost:3000`) |

---

## 🗄️ Supabase Setup & Migrations

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in the Supabase Dashboard.
3. Paste and run the contents of [`supabase/migrations/20240101000000_init.sql`](./supabase/migrations/20240101000000_init.sql).
   - This sets up tables for `profiles`, `resumes`, `interviews`, `messages`, `code_submissions`, `feedback`, `payments`, and `dsa_problems`.
   - Enables Row Level Security (RLS) so candidates can only access their own data.
   - Sets up the `deduct_interview_credit` and `fulfill_payment` stored procedures.
   - Configures the private `resumes` storage bucket with user folder policies.
4. Copy your project URL and keys into `.env.local`.

---

## 💳 Razorpay Test Mode Setup

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com) and switch to **Test Mode**.
2. Go to **Settings -> API Keys** and generate a test Key ID and Key Secret.
3. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` to `.env.local`.
4. Go to **Settings -> Webhooks**, add an endpoint:
   - URL: `https://your-domain.vercel.app/api/payments/webhook`
   - Secret: Set your webhook secret and copy to `RAZORPAY_WEBHOOK_SECRET`.
   - Active Events: `order.paid`, `payment.captured`.

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) -> **Add New Project** -> Select repository.
3. In **Environment Variables**, paste all keys from `.env.local`.
4. Click **Deploy**. Vercel will build and deploy the Next.js App Router application automatically.

---

## 🧪 Testing the Complete Flow End-to-End

1. **Sign In**: Navigate to `/login` and click **"Continue as Guest / Demo Student"** (or use your college email). You are immediately granted 1 free interview credit.
2. **Setup Session**: Navigate to `/interview/setup`, select your target role (SDE), company hiring profile (e.g. Product), difficulty, round (e.g. DSA or CS Fundamentals), and optionally upload a PDF resume.
3. **Interview Room**:
   - The AI interviewer greets you and presents the first targeted question.
   - Toggle **Voice Input** to answer verbally, or type your answer.
   - In DSA rounds, write code in the Monaco editor, click **Run** to execute against Judge0 test cases, and click **Submit to AI** for code evaluation.
4. **Structured Report**: Click **"End Session"** or complete 6 questions to view the detailed evaluation report with score bars (Correctness, Communication, Depth, Problem Solving) and action steps.
5. **Buy Credits**: Go to `/pricing`, choose the ₹99 pack (3 interviews) or ₹249 pack (10 interviews), and complete checkout in test mode. Credits are added instantly.
6. **Resume Tailor**: Go to `/resume-tailor`, paste a job description, and view missing ATS keywords and rewritten STAR bullet points.
7. **Progress Page**: Check `/progress` to see your interview history and Recharts score trajectory.

---

## 📄 License
MIT © MockMate AI. Built for engineering students across India.
