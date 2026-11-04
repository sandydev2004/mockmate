export type Role = "SDE" | "Data/ML" | "Core";
export type CompanyType = "service" | "product" | "startup";
export type Difficulty = "easy" | "medium" | "hard";
export type RoundType = "dsa" | "hr" | "cs_fundamentals" | "system_design";
export type InterviewStatus = "active" | "completed" | "abandoned";
export type SupportedLanguage = "python" | "cpp" | "java" | "javascript";

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  credits: number;
  target_role?: Role;
  target_company_type?: CompanyType;
  created_at: string;
  updated_at?: string;
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  extracted_text: string;
  file_size?: number;
  created_at: string;
}

export interface InterviewRecord {
  id: string;
  user_id: string;
  role: Role;
  company_type: CompanyType;
  difficulty: Difficulty;
  round: RoundType;
  resume_id?: string | null;
  status: InterviewStatus;
  started_at: string;
  ended_at?: string | null;
  overall_score?: number | null;
  current_question_index: number;
  total_questions: number;
  dsa_problem_id?: string | null;
}

export interface MessageRecord {
  id: string;
  interview_id: string;
  sender: "ai" | "user" | "system";
  content: string;
  created_at: string;
}

export interface FeedbackScores {
  correctness: number; // 0-10
  communication: number; // 0-10
  depth: number; // 0-10
  problem_solving: number; // 0-10
}

export interface FeedbackRecord {
  id: string;
  interview_id: string;
  scores: FeedbackScores;
  overall: number; // 0-100
  strengths: string[];
  improvements: string[];
  summary: string;
  created_at: string;
}

export interface DSATestCase {
  input: string;
  expected_output: string;
  is_sample?: boolean;
}

export interface DSAProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  description: string;
  starter_code: Record<SupportedLanguage, string>;
  test_cases: DSATestCase[];
}

export interface TestRunResult {
  test_case_index: number;
  input: string;
  expected: string;
  actual?: string;
  passed: boolean;
  status: string; // "Accepted", "Wrong Answer", "Runtime Error", "Time Limit Exceeded"
  execution_time?: string;
  memory?: string;
  stderr?: string;
}

export interface CodeSubmissionRecord {
  id: string;
  interview_id: string;
  language: SupportedLanguage;
  code: string;
  test_results: TestRunResult[];
  execution_status: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  amount: number;
  credits_added: number;
  status: "created" | "paid" | "failed";
  created_at: string;
}

export interface TailorBulletSuggestion {
  original: string;
  improved: string;
  reason: string;
}

export interface TailorResult {
  match_score: number; // 0-100
  matched_skills: string[];
  missing_keywords: string[];
  bullet_suggestions: TailorBulletSuggestion[];
  summary: string;
  action_plan: string[];
}

