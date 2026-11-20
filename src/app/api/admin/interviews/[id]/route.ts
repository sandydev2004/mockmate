import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { appStore, calculateIntegritySummary } from "@/lib/store";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(async (adminUser, req: NextRequest) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const interviewId = segments[segments.length - 1];

  if (!interviewId) {
    return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    const { data: interview, error: intErr } = await supabase
      .from("interviews")
      .select("*, profiles:user_id(id, email, full_name)")
      .eq("id", interviewId)
      .single();

    if (intErr || !interview) {
      const local = appStore.getInterview(interviewId);
      if (!local) {
        return NextResponse.json({ error: "Interview not found" }, { status: 404 });
      }
      return NextResponse.json({
        interview: local,
        feedback: appStore.getFeedback(interviewId),
        integrityEvents: appStore.getIntegrityEvents(interviewId),
        integritySummary: appStore.getIntegritySummary(interviewId),
        messages: appStore.getInterviewMessages(interviewId),
        resume: null,
      });
    }

    // Feedback
    const { data: feedback } = await supabase
      .from("feedback")
      .select("*")
      .eq("interview_id", interviewId)
      .single();

    // Integrity Events
    const { data: integrityEvents } = await supabase
      .from("integrity_events")
      .select("*")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: true });

    // Messages (for sensitive data view)
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: true });

    // Resume (if attached)
    let resumeText: string | null = null;
    let resumeFilename: string | null = null;
    if (interview.resume_id) {
      const { data: resumeData } = await supabase
        .from("resumes")
        .select("filename, extracted_text")
        .eq("id", interview.resume_id)
        .single();
      if (resumeData) {
        resumeFilename = resumeData.filename;
        resumeText = resumeData.extracted_text;
      }
    }

    // Compute unified integrity summary
    const integritySummary = calculateIntegritySummary(
      integrityEvents || [],
      interview,
      feedback
    );

    return NextResponse.json({
      interview,
      feedback,
      integrityEvents: integrityEvents || [],
      integritySummary,
      messages: messages || [],
      resume: resumeText ? { filename: resumeFilename, text: resumeText } : null,
    });
  } catch (err: any) {
    console.error("[ADMIN_INTERVIEW_DETAIL_ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch interview", details: err.message }, { status: 500 });
  }
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("log_sensitive_access"),
    type: z.enum(["transcript", "resume", "all"]),
  }),
  z.object({
    action: z.literal("review"),
    verdict: z.enum(["approved", "flagged", "inconclusive"]),
    notes: z.string().optional().default(""),
  }),
]);

export const POST = withAdminApi(async (adminUser, req: NextRequest) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const interviewId = segments[segments.length - 1];

  const body = await req.json().catch(() => null);
  const validated = actionSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validated.error.format() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const payload = validated.data;

  if (payload.action === "log_sensitive_access") {
    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "interview.sensitive_data_viewed",
      targetType: "interview",
      targetId: interviewId,
      details: {
        dataType: payload.type,
      },
      req,
    });

    return NextResponse.json({ success: true, logged: true });
  }

  if (payload.action === "review") {
    const { error: updateErr } = await supabase
      .from("interviews")
      .update({
        admin_reviewed: true,
        admin_notes: payload.notes,
        admin_review_verdict: payload.verdict,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", interviewId);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update review", details: updateErr.message }, { status: 500 });
    }

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "interview.reviewed",
      targetType: "interview",
      targetId: interviewId,
      details: {
        verdict: payload.verdict,
        notes: payload.notes,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Interview marked as reviewed with verdict: ${payload.verdict}`,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});

