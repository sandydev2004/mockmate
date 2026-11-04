import {
  Profile,
  ResumeRecord,
  InterviewRecord,
  MessageRecord,
  FeedbackRecord,
  CodeSubmissionRecord,
  PaymentRecord,
} from "@/types";

// In-memory demo store for seamless offline/local development
class MockMateStore {
  private profiles: Map<string, Profile> = new Map();
  private resumes: Map<string, ResumeRecord> = new Map();
  private interviews: Map<string, InterviewRecord> = new Map();
  private messages: Map<string, MessageRecord[]> = new Map();
  private feedback: Map<string, FeedbackRecord> = new Map();
  private submissions: Map<string, CodeSubmissionRecord[]> = new Map();
  private payments: Map<string, PaymentRecord> = new Map();

  constructor() {
    // Default demo profile for quick testing
    this.profiles.set("demo-user-123", {
      id: "demo-user-123",
      email: "student@placement.edu.in",
      full_name: "Rahul Sharma",
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
        "Strong performance overall. Rahul demonstrated solid grasp of hash table indexing and delivered clean, readable solution code with great communication clarity.",
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
        created_at: new Date().toISOString(),
      };
      this.profiles.set(userId, p);
    }
    return p;
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
}

// Global singleton instance
const globalForStore = globalThis as unknown as { mockMateStore: MockMateStore };
export const appStore = globalForStore.mockMateStore || new MockMateStore();
if (process.env.NODE_ENV !== "production") globalForStore.mockMateStore = appStore;
