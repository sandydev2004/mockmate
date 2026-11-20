import { NextRequest, NextResponse } from "next/server";
import { appStore, calculateIntegritySummary } from "@/lib/store";
import { getProblemByIdOrSlug } from "@/lib/dsa-problems";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;
    const supabase = createAdminClient();

    // 1. Fetch interview
    let interview: any = null;
    const { data: dbInterview } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interviewId)
      .single();

    if (dbInterview) {
      interview = dbInterview;
    }

    const localInterview = appStore.getInterview(interviewId);
    if (localInterview) {
      interview = interview ? { ...interview, ...localInterview } : localInterview;
    }

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // 2. Fetch messages
    let messages: any[] = [];
    const { data: dbMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: true });

    if (dbMessages && dbMessages.length > 0) {
      messages = dbMessages;
    } else {
      messages = appStore.getInterviewMessages(interviewId);
    }

    // 3. Fetch feedback
    let feedback: any = null;
    const { data: dbFeedback } = await supabase
      .from("feedback")
      .select("*")
      .eq("interview_id", interviewId)
      .single();
    if (dbFeedback) {
      feedback = dbFeedback;
    } else {
      feedback = appStore.getFeedback(interviewId);
    }

    // 4. Fetch submissions
    let submissions: any[] = [];
    const { data: dbSubmissions } = await supabase
      .from("code_submissions")
      .select("*")
      .eq("interview_id", interviewId);
    if (dbSubmissions && dbSubmissions.length > 0) {
      submissions = dbSubmissions;
    } else {
      submissions = appStore.getSubmissions(interviewId);
    }

    // 5. Fetch DSA Problem from seeded table
    let dsaProblem = null;
    if (interview.dsa_problem_id) {
      const { data: dbProb } = await supabase
        .from("dsa_problems")
        .select("*")
        .eq("id", interview.dsa_problem_id)
        .single();

      if (dbProb) {
        dsaProblem = dbProb;
      } else {
        dsaProblem = getProblemByIdOrSlug(interview.dsa_problem_id);
      }
    }

    // 6. Fetch integrity events
    let integrityEvents: any[] = [];
    try {
      const { data: dbIntegrity } = await supabase
        .from("integrity_events")
        .select("*")
        .eq("interview_id", interviewId)
        .order("created_at", { ascending: true });
      if (dbIntegrity && dbIntegrity.length > 0) {
        integrityEvents = dbIntegrity;
      }
    } catch {}

    if (integrityEvents.length === 0) {
      integrityEvents = appStore.getIntegrityEvents(interviewId);
    }
    // Check proctored heartbeat timeout
    const maxAwaySec = parseInt(process.env.MAX_AWAY_SECONDS || "20", 10);
    const fullscreenGraceSec = parseInt(process.env.FULLSCREEN_GRACE_SECONDS || "15", 10);
    const cameraGraceSec = parseInt(process.env.CAMERA_GRACE_SECONDS || "10", 10);
    const heartbeatTimeoutThresholdSec = Math.max(maxAwaySec, fullscreenGraceSec, cameraGraceSec) + 10;

    if (
      interview.status === "active" &&
      interview.mode === "proctored" &&
      interview.last_heartbeat_at
    ) {
      const lastHbTime = new Date(interview.last_heartbeat_at).getTime();
      const elapsedSinceHb = (Date.now() - lastHbTime) / 1000;
      if (elapsedSinceHb > heartbeatTimeoutThresholdSec) {
        interview.status = "completed";
        interview.auto_submit_reason = "auto_submitted_no_heartbeat";
        interview.ended_at = new Date().toISOString();
        appStore.saveInterview(interview);

        try {
          await supabase
            .from("interviews")
            .update({
              status: "completed",
              auto_submit_reason: "auto_submitted_no_heartbeat",
              ended_at: interview.ended_at,
            })
            .eq("id", interviewId);
        } catch {}
      }
    }

    const integritySummary = calculateIntegritySummary(integrityEvents, interview);

    return NextResponse.json({
      interview,
      messages,
      feedback,
      submissions,
      dsa_problem: dsaProblem,
      integrity_events: integrityEvents,
      integrity_summary: integritySummary,
    });
  } catch (error: any) {
    console.error("[GET_INTERVIEW_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
