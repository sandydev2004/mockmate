import {
  Profile,
  ResumeRecord,
  InterviewRecord,
  MessageRecord,
  FeedbackRecord,
  CodeSubmissionRecord,
  PaymentRecord,
  IntegrityEventRecord,
  IntegritySummary,
} from "@/types";
import { computeServerRiskScore } from "@/lib/risk-config";

export function calculateIntegritySummary(
  events: IntegrityEventRecord[],
  interview?: InterviewRecord | null,
  feedback?: FeedbackRecord | null
): IntegritySummary {
  // Tab switches & away time
  const tabReturnedEvents = events.filter((e) => e.event_type === "tab_returned");
  const legacyTabSwitches = events.filter((e) => e.event_type === "tab_switch" || e.event_type === "tab_hidden");
  const tab_switches = Math.max(tabReturnedEvents.length, legacyTabSwitches.length);

  const total_away_seconds = tabReturnedEvents.reduce((acc, curr) => {
    const s = Number(curr.details?.away_seconds || curr.details?.seconds || 0);
    return acc + (isNaN(s) ? 0 : s);
  }, 0);

  // Fullscreen exits & time outside fullscreen
  const fullscreenExits = events.filter((e) => e.event_type === "fullscreen_exit");
  const fullscreen_exits = fullscreenExits.length;

  const fullscreenReturnedEvents = events.filter((e) => e.event_type === "fullscreen_returned");
  const total_fullscreen_exit_seconds = fullscreenReturnedEvents.reduce((acc, curr) => {
    const s = Number(curr.details?.seconds || curr.details?.duration || 0);
    return acc + (isNaN(s) ? 0 : s);
  }, 0);

  // Camera absences & absent time
  const cameraAbsentEvents = events.filter((e) => e.event_type === "camera_absent" || e.event_type === "camera_blocked");
  const camera_absences = cameraAbsentEvents.length;

  const cameraReturnedEvents = events.filter((e) => e.event_type === "camera_returned");
  const total_absent_seconds = cameraReturnedEvents.reduce((acc, curr) => {
    const s = Number(curr.details?.absent_seconds || curr.details?.seconds || 0);
    return acc + (isNaN(s) ? 0 : s);
  }, 0);

  // Multiple faces
  const multiple_face_events = events.filter((e) => e.event_type === "multiple_faces").length;

  // Paste attempts & new typing / input events
  const paste_attempts = events.filter(
    (e) => e.event_type === "paste_blocked" || e.event_type === "paste_attempt"
  ).length;

  const paste_like_events = events.filter((e) => e.event_type === "paste_like").length;
  const input_injections = events.filter((e) => e.event_type === "input_injection").length;
  const shortcuts_blocked = events.filter((e) => e.event_type === "shortcut_blocked").length;
  const typing_anomalies = events.filter((e) => e.event_type === "typing_anomaly").length;
  const multiple_monitors_detected = events.some((e) => e.event_type === "multiple_monitors");
  const devtools_detected = events.some((e) => e.event_type === "devtools_open");
  const duplicate_sessions = events.filter((e) => e.event_type === "duplicate_session").length;
  const suspicious_extensions = events.filter((e) => e.event_type === "suspicious_extension_ui").length;

  // Strikes
  const strikeEvents = events.filter((e) => e.event_type === "strike_added");
  const strikes = interview?.strikes ?? strikeEvents.length;

  // Auto-submit reason
  const autoSubmitEvent = events.find((e) => e.event_type === "auto_submit");
  const auto_submit_reason =
    interview?.auto_submit_reason || autoSubmitEvent?.details?.reason || null;

  // Server-side weighted risk score calculation (0 - 100 clamped)
  const riskResult = computeServerRiskScore(events, interview, feedback);

  return {
    tab_switches,
    total_away_seconds: Math.round(total_away_seconds),
    fullscreen_exits,
    total_fullscreen_exit_seconds: Math.round(total_fullscreen_exit_seconds),
    camera_absences,
    total_absent_seconds: Math.round(total_absent_seconds),
    multiple_face_events,
    paste_attempts,
    paste_like_events,
    input_injections,
    shortcuts_blocked,
    typing_anomalies,
    multiple_monitors_detected,
    devtools_detected,
    duplicate_sessions,
    suspicious_extensions,
    strikes,
    risk_level: riskResult.risk_level,
    risk_score: riskResult.risk_score,
    top_risk_reasons: riskResult.top_reasons,
    auto_submit_reason,
    mode: interview?.mode || "proctored",
    authenticity_score: feedback?.authenticity_score,
    authenticity_reason: feedback?.authenticity_reason,
  };
}

// In-memory demo store for seamless offline/local development
class MockMateStore {
  private profiles: Map<string, Profile> = new Map();
  private resumes: Map<string, ResumeRecord> = new Map();
  private interviews: Map<string, InterviewRecord> = new Map();
  private messages: Map<string, MessageRecord[]> = new Map();
  private feedback: Map<string, FeedbackRecord> = new Map();
  private submissions: Map<string, CodeSubmissionRecord[]> = new Map();
  private payments: Map<string, PaymentRecord> = new Map();
  private integrityEvents: Map<string, IntegrityEventRecord[]> = new Map();

  constructor() {
    // Default demo profile for quick testing
    this.profiles.set("demo-user-123", {
      id: "demo-user-123",
      email: "candidate@placement.edu.in",
      full_name: "Candidate",
      credits: 2,
      target_role: "SDE",
      target_company_type: "product",
      created_at: new Date().toISOString(),
    });

    // Sample prior interview for progress chart demo
    const sampleId = "sample-interview-001";
    this.interviews.set(sampleId, {
      id: sampleId,
      user_id: "demo-user-123",
      role: "SDE",
      company_type: "product",
      difficulty: "medium",
      round: "dsa",
      status: "completed",
      started_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      ended_at: new Date(Date.now() - 86400000 * 3 + 1800000).toISOString(),
      overall_score: 82,
      current_question_index: 6,
      total_questions: 6,
      dsa_problem_id: "two-sum",
    });

    this.feedback.set(sampleId, {
      id: "sample-feedback-001",
      interview_id: sampleId,
      scores: {
        correctness: 8,
        communication: 9,
        depth: 8,
        problem_solving: 8,
      },
      overall: 82,
      strengths: [
        "Structured approach using hash map for O(n) lookup time complexity",
        "Clear step-by-step communication while explaining the complement logic",
        "Proactively considered duplicate elements and negative integer edge cases",
      ],
      improvements: [
        "State space complexity trade-offs upfront before diving into the code",
        "Dry-run with a minimal failure test case before declaring the solution final",
      ],
      summary:
        "Strong performance overall. The candidate demonstrated solid grasp of hash table indexing and delivered clean, readable solution code with great communication clarity.",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    });

    const sampleId2 = "sample-interview-002";
    this.interviews.set(sampleId2, {
      id: sampleId2,
      user_id: "demo-user-123",
      role: "SDE",
      company_type: "service",
      difficulty: "easy",
      round: "cs_fundamentals",
      status: "completed",
      started_at: new Date(Date.now() - 86400000).toISOString(),
      ended_at: new Date(Date.now() - 86400000 + 1500000).toISOString(),
      overall_score: 75,
      current_question_index: 6,
      total_questions: 6,
    });

    this.feedback.set(sampleId2, {
      id: "sample-feedback-002",
      interview_id: sampleId2,
      scores: {
        correctness: 7,
        communication: 8,
        depth: 7,
        problem_solving: 8,
      },
      overall: 75,
      strengths: [
        "Solid conceptual foundation of DBMS ACID properties and indexing",
        "Good real-world analogy explaining TCP 3-way handshake",
      ],
      improvements: [
        "Deepen understanding of B+ Tree page splits and disk I/O bottlenecks",
        "Review virtual memory paging vs segmentation trade-offs",
      ],
      summary:
        "Good interview demonstration for entry-level service company placement. Refresh core OS memory management to score even higher.",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    });
  }

  // Profile operations
  getProfile(userId: string): Profile {
    let p = this.profiles.get(userId);
    if (!p) {
      p = {
        id: userId,
        email: `${userId}@mockmate.ai`,
        full_name: "Candidate",
        credits: 1, // 1 free interview on signup!
        role: "user",
        is_suspended: false,
        is_deleted: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
      };
      this.profiles.set(userId, p);
    }
    return p;
  }

  getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  deleteProfile(userId: string): boolean {
    return this.profiles.delete(userId);
  }

  softDeleteProfile(userId: string): Profile {
    return this.updateProfile(userId, {
      is_deleted: true,
      is_suspended: true,
      deleted_at: new Date().toISOString(),
    });
  }

  restoreProfile(userId: string): Profile {
    return this.updateProfile(userId, {
      is_deleted: false,
      is_suspended: false,
      deleted_at: null,
    });
  }

  updateProfile(userId: string, updates: Partial<Profile>): Profile {
    const existing = this.getProfile(userId);
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.profiles.set(userId, updated);
    return updated;
  }

  // Atomic credit deduction
  deductCredit(userId: string): boolean {
    const profile = this.getProfile(userId);
    if (profile.credits < 1) {
      return false;
    }
    profile.credits -= 1;
    this.profiles.set(userId, profile);
    return true;
  }

  // Atomic credit addition
  addCredits(userId: string, credits: number): number {
    const profile = this.getProfile(userId);
    profile.credits += credits;
    this.profiles.set(userId, profile);
    return profile.credits;
  }

  // Resumes
  saveResume(record: ResumeRecord): void {
    this.resumes.set(record.id, record);
  }

  getResume(id: string): ResumeRecord | undefined {
    return this.resumes.get(id);
  }

  getUserResumes(userId: string): ResumeRecord[] {
    return Array.from(this.resumes.values()).filter((r) => r.user_id === userId);
  }

  // Interviews
  saveInterview(record: InterviewRecord): void {
    this.interviews.set(record.id, record);
  }

  getInterview(id: string): InterviewRecord | undefined {
    return this.interviews.get(id);
  }

  getUserInterviews(userId: string): InterviewRecord[] {
    return Array.from(this.interviews.values())
      .filter((i) => i.user_id === userId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }

  getAllInterviews(): InterviewRecord[] {
    return Array.from(this.interviews.values()).sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }

  getAllPayments(): PaymentRecord[] {
    return Array.from(this.payments.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // Messages
  addMessage(record: MessageRecord): void {
    const list = this.messages.get(record.interview_id) || [];
    list.push(record);
    this.messages.set(record.interview_id, list);
  }

  getInterviewMessages(interviewId: string): MessageRecord[] {
    return (this.messages.get(interviewId) || []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  // Code submissions
  addSubmission(record: CodeSubmissionRecord): void {
    const list = this.submissions.get(record.interview_id) || [];
    list.push(record);
    this.submissions.set(record.interview_id, list);
  }

  getSubmissions(interviewId: string): CodeSubmissionRecord[] {
    return this.submissions.get(interviewId) || [];
  }

  // Feedback
  saveFeedback(record: FeedbackRecord): void {
    this.feedback.set(record.interview_id, record);
  }

  getFeedback(interviewId: string): FeedbackRecord | undefined {
    return this.feedback.get(interviewId);
  }

  // Payments
  savePayment(record: PaymentRecord): void {
    this.payments.set(record.razorpay_order_id, record);
  }

  getPayment(orderId: string): PaymentRecord | undefined {
    return this.payments.get(orderId);
  }

  // Integrity Events
  addIntegrityEvent(record: IntegrityEventRecord): void {
    const list = this.integrityEvents.get(record.interview_id) || [];
    list.push(record);
    this.integrityEvents.set(record.interview_id, list);
  }

  getIntegrityEvents(interviewId: string): IntegrityEventRecord[] {
    return (this.integrityEvents.get(interviewId) || []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  getIntegritySummary(interviewId: string): IntegritySummary {
    return calculateIntegritySummary(this.getIntegrityEvents(interviewId));
  }
}

// Global singleton instance across all environments & Next.js chunks
const globalForStore = globalThis as unknown as { mockMateStore: MockMateStore };
if (!globalForStore.mockMateStore) {
  globalForStore.mockMateStore = new MockMateStore();
}
export const appStore = globalForStore.mockMateStore;

