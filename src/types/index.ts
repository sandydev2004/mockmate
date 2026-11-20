export type Role = "SDE" | "Data/ML" | "Core";
export type CompanyType = "service" | "product" | "startup";
export type Difficulty = "easy" | "medium" | "hard";
export type RoundType = "dsa" | "hr" | "cs_fundamentals" | "system_design";
export type InterviewStatus = "active" | "completed" | "abandoned";
export type SupportedLanguage = "python" | "cpp" | "java" | "javascript";
export type ProctoringMode = "proctored" | "practice";

export type UserRole = "user" | "support" | "admin" | "super_admin";

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  credits: number;
  role?: UserRole;
  is_suspended?: boolean;
  is_deleted?: boolean;
  deleted_at?: string | null;
  admin_session_revoked_at?: string | null;
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
  mode?: ProctoringMode;
  strikes?: number;
  auto_submit_reason?: string | null;
  last_heartbeat_at?: string | null;
  active_session_token?: string | null;
  seed?: number;
  question_started_at?: string | null;
  started_at: string;
  ended_at?: string | null;
  overall_score?: number | null;
  current_question_index: number;
  total_questions: number;
  dsa_problem_id?: string | null;
  admin_reviewed?: boolean;
  admin_notes?: string | null;
  admin_review_verdict?: "approved" | "flagged" | "inconclusive" | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  is_admin_test?: boolean;
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
  authenticity_score?: number; // 0-10
  authenticity_reason?: string;
  risk_score?: number; // 0-100
  top_risk_reasons?: string[];
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
  is_active?: boolean;
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

export type IntegrityEventType =
  | "tab_hidden"
  | "tab_returned"
  | "fullscreen_exit"
  | "fullscreen_returned"
  | "camera_absent"
  | "camera_returned"
  | "camera_blocked"
  | "multiple_faces"
  | "paste_blocked"
  | "strike_added"
  | "auto_submit"
  | "shortcut_blocked"
  | "paste_like"
  | "input_injection"
  | "multiple_monitors"
  | "devtools_open"
  | "suspicious_extension_ui"
  | "duplicate_session"
  | "typing_anomaly"
  // Legacy compatibility
  | "tab_switch"
  | "window_blur"
  | "paste_attempt";

export interface IntegrityEventRecord {
  id: string;
  interview_id: string;
  event_type: IntegrityEventType;
  details?: Record<string, any>;
  created_at: string;
}

export interface TypingIntegrityMetrics {
  characters: number;
  keystrokes: number;
  typing_duration_ms: number;
  avg_speed_cps: number;
  max_speed_cps: number;
  longest_pause_ms: number;
  time_to_first_keystroke_ms: number;
  anomaly_flag?: boolean;
  anomaly_reasons?: string[];
}

export interface IntegritySummary {
  tab_switches: number;
  total_away_seconds: number;
  fullscreen_exits: number;
  total_fullscreen_exit_seconds: number;
  camera_absences: number;
  total_absent_seconds: number;
  multiple_face_events: number;
  paste_attempts: number;
  paste_like_events: number;
  input_injections: number;
  shortcuts_blocked: number;
  typing_anomalies: number;
  multiple_monitors_detected: boolean;
  devtools_detected: boolean;
  duplicate_sessions: number;
  suspicious_extensions: number;
  strikes: number;
  risk_level: "Low" | "Medium" | "High";
  risk_score: number; // 0-100
  top_risk_reasons: string[];
  auto_submit_reason?: string | null;
  mode?: ProctoringMode;
  authenticity_score?: number;
  authenticity_reason?: string;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
  prev_hash?: string | null;
  entry_hash?: string | null;
  created_at: string;
}

export interface PlatformSettings {
  llm_kill_switch: boolean;
  max_daily_interviews_per_user: number;
  max_strikes: number;
  strike_grace_seconds: number;
}

export interface AdminStats {
  totalUsers: number;
  signups7d: number;
  signups30d: number;
  interviewsStarted: number;
  interviewsCompleted: number;
  autoSubmittedCount: number;
  totalRevenueInr: number;
  creditsSold: number;
  creditsUsed: number;
  dailyChart: Array<{
    date: string;
    signups: number;
    interviews: number;
  }>;
  llmStats: {
    todayCalls: number;
    providerCounts: Record<string, number>;
    errorCounts: Record<string, number>;
    cooldowns: Record<string, number>;
    primaryProvider: string;
    fallbackProviders: string[];
    configuredProviders: Array<{
      name: string;
      configured: boolean;
      model: string;
      inCooldown: boolean;
      cooldownRemainingSec: number;
      calls: number;
      errors: number;
    }>;
  };
}


