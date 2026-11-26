import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore, calculateIntegritySummary } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { IntegrityEventType, IntegrityEventRecord } from "@/types";

const logEventSchema = z.object({
  interview_id: z.string().uuid(),
  event_type: z.enum([
    "tab_hidden",
    "tab_returned",
    "fullscreen_exit",
    "fullscreen_returned",
    "camera_absent",
    "camera_returned",
    "camera_blocked",
    "multiple_faces",
    "paste_blocked",
    "strike_added",
    "auto_submit",
    "shortcut_blocked",
    "paste_like",
    "input_injection",
    "multiple_monitors",
    "devtools_open",
    "suspicious_extension_ui",
    "duplicate_session",
    "typing_anomaly",
    // Legacy compatibility
    "tab_switch",
    "window_blur",
    "paste_attempt",
  ]),
  details: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = logEventSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid integrity event payload" }, { status: 400 });
    }

    const { interview_id, event_type, details } = validated.data;
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: IntegrityEventRecord = {
      id: eventId,
      interview_id,
      event_type: event_type as IntegrityEventType,
      details: details || {},
      created_at: now,
    };

    // 1. Save to in-memory store
    appStore.addIntegrityEvent(record);

    // Update strikes or auto-submit reason on interview record in store
    let currentInterview = appStore.getInterview(interview_id);
    if (!currentInterview) {
      try {
        const supabase = createAdminClient();
        const { data: dbInt } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", interview_id)
          .single();
        if (dbInt) currentInterview = dbInt;
      } catch (err) {}
    }

    if (currentInterview) {
      const d = details as any;
      if (event_type === "strike_added") {
        currentInterview.strikes = d?.strikes ?? d?.strike ?? (currentInterview.strikes || 0) + 1;
      }
      if (event_type === "duplicate_session") {
        // Duplicate session is explicitly a strike
        currentInterview.strikes = (currentInterview.strikes || 0) + 1;
      }
      if (event_type === "multiple_monitors") {
        const strictMonitors =
          process.env.STRICT_SINGLE_MONITOR === "true" ||
          process.env.NEXT_PUBLIC_STRICT_SINGLE_MONITOR === "true";
        if (strictMonitors) {
          currentInterview.strikes = (currentInterview.strikes || 0) + 1;
        }
      }
      if (event_type === "auto_submit" && d?.reason) {
        currentInterview.auto_submit_reason = String(d.reason);
      }
      appStore.saveInterview(currentInterview);
    }

    // 2. Persist to Supabase if table exists
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes("mockmate-demo")) {
        const supabase = createAdminClient();
        await supabase.from("integrity_events").insert({
          id: eventId,
          interview_id,
          event_type,
          details: details || {},
          created_at: now,
        });

        if (event_type === "strike_added" && details?.strikes) {
          await supabase
            .from("interviews")
            .update({ strikes: details.strikes })
            .eq("id", interview_id);
        }
        if (event_type === "auto_submit" && details?.reason) {
          await supabase
            .from("interviews")
            .update({ auto_submit_reason: details.reason })
            .eq("id", interview_id);
        }
      }
    } catch (dbErr) {
      console.warn("[INTEGRITY_LOG] Supabase write skipped/pending migration:", dbErr);
    }

    return NextResponse.json({
      success: true,
      event_id: eventId,
      strikes: currentInterview?.strikes ?? 0,
    });
  } catch (err: any) {
    console.error("[INTEGRITY_ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interviewId = req.nextUrl.searchParams.get("interview_id");
    if (!interviewId) {
      return NextResponse.json({ error: "Missing interview_id" }, { status: 400 });
    }

    let events: IntegrityEventRecord[] = [];

    // Query from Supabase first
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !supabaseUrl.includes("mockmate-demo")) {
        const supabase = createAdminClient();
        const { data: dbEvents, error } = await supabase
          .from("integrity_events")
          .select("*")
          .eq("interview_id", interviewId)
          .order("created_at", { ascending: true });

        if (!error && dbEvents && dbEvents.length > 0) {
          events = dbEvents as IntegrityEventRecord[];
        }
      }
    } catch (err) {
      console.warn("[INTEGRITY_GET] Supabase read fallback:", err);
    }

    // Merge or fallback to memory store
    if (events.length === 0) {
      events = appStore.getIntegrityEvents(interviewId);
    }

    let interview = appStore.getInterview(interviewId);
    if (!interview) {
      try {
        const supabase = createAdminClient();
        const { data: dbInt } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", interviewId)
          .single();
        if (dbInt) interview = dbInt;
      } catch {}
    }

    let feedback = appStore.getFeedback(interviewId);
    if (!feedback) {
      try {
        const supabase = createAdminClient();
        const { data: dbFb } = await supabase
          .from("feedback")
          .select("*")
          .eq("interview_id", interviewId)
          .single();
        if (dbFb) feedback = dbFb;
      } catch {}
    }

    const summary = calculateIntegritySummary(events, interview, feedback);

    return NextResponse.json({ events, summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

