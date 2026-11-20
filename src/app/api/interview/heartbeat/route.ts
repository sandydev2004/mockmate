import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";

const heartbeatSchema = z.object({
  interview_id: z.string().uuid(),
  session_token: z.string().optional(),
  attach_session: z.boolean().optional(),
  mode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = heartbeatSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { interview_id, session_token, attach_session, mode: clientMode } = validated.data;
    const now = new Date().toISOString();

    let interview = appStore.getInterview(interview_id);
    const supabase = createAdminClient();

    if (!interview) {
      try {
        const { data } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", interview_id)
          .single();
        if (data) {
          interview = data;
          appStore.saveInterview(data);
        }
      } catch {}
    }

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // 1. Session Token & Duplicate Session Check
    const mode = clientMode || interview.mode || "proctored";
    if (mode === "proctored" && session_token) {
      if (attach_session) {
        // Attaching new session from another window/tab
        if (interview.active_session_token && interview.active_session_token !== session_token) {
          // Log duplicate_session event - this IS a strike
          const newStrikes = (interview.strikes || 0) + 1;
          interview.strikes = newStrikes;

          const dupEvt = {
            id: crypto.randomUUID(),
            interview_id,
            event_type: "duplicate_session" as const,
            details: {
              previous_token: interview.active_session_token?.slice(0, 8),
              new_token: session_token.slice(0, 8),
              strike: newStrikes,
            },
            created_at: now,
          };
          appStore.addIntegrityEvent(dupEvt);
          try {
            await supabase.from("integrity_events").insert(dupEvt);
          } catch {}

          if (newStrikes >= 3) {
            interview.status = "completed";
            interview.auto_submit_reason = "auto_submitted_strikes";
          }
        }
        interview.active_session_token = session_token;
      } else {
        // Regular heartbeat ping from a client
        if (interview.active_session_token && interview.active_session_token !== session_token) {
          // Older session has been superseded and is now blocked
          return NextResponse.json(
            {
              error:
                "This interview has been opened in another window or device. Multiple simultaneous sessions are strictly prohibited.",
              duplicate_session: true,
              isBlocked: true,
              strikes: interview.strikes || 0,
              status: interview.status,
            },
            { status: 409 }
          );
        }
      }
    }

    interview.last_heartbeat_at = now;
    appStore.saveInterview(interview);

    try {
      await supabase
        .from("interviews")
        .update({ last_heartbeat_at: now })
        .eq("id", interview_id);
    } catch {}

    return NextResponse.json({
      success: true,
      status: interview.status,
      strikes: interview.strikes || 0,
      auto_submit_reason: interview.auto_submit_reason || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

