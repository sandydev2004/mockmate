import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(async (adminUser, req: NextRequest) => {
  const supabase = createAdminClient();

  try {
    // Fetch interviews that are unreviewed and have either auto_submit_reason or strikes > 0 or are completed
    const { data: interviews, error } = await supabase
      .from("interviews")
      .select(
        `id, user_id, role, company_type, difficulty, round, status, mode, strikes, 
         auto_submit_reason, overall_score, started_at, ended_at, admin_reviewed,
         profiles:user_id (id, email, full_name),
         feedback (overall, risk_score, top_risk_reasons)`
      )
      .eq("admin_reviewed", false)
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    const queue = (interviews || [])
      .map((row: any) => {
        const fb = Array.isArray(row.feedback) ? row.feedback[0] : row.feedback;
        const profile = row.profiles;
        const riskScore = fb?.risk_score ?? 0;
        let riskLevel: "Low" | "Medium" | "High" = "Low";

        if (riskScore >= 60 || row.auto_submit_reason || (row.strikes || 0) >= 3) {
          riskLevel = "High";
        } else if (riskScore >= 25 || (row.strikes || 0) >= 1) {
          riskLevel = "Medium";
        }

        return {
          id: row.id,
          user_id: row.user_id,
          user_email: profile?.email || "Unknown",
          user_name: profile?.full_name || "Unknown",
          role: row.role,
          round: row.round,
          status: row.status,
          mode: row.mode || "proctored",
          strikes: row.strikes || 0,
          auto_submit_reason: row.auto_submit_reason,
          risk_level: riskLevel,
          risk_score: riskScore,
          top_risk_reasons: fb?.top_risk_reasons || [],
          started_at: row.started_at,
        };
      })
      .filter((row) => row.risk_level === "High" || row.risk_level === "Medium" || row.auto_submit_reason);

    return NextResponse.json({ queue, total: queue.length });
  } catch (err: any) {
    console.error("[ADMIN_INTEGRITY_QUEUE_ERROR]", err);
    return NextResponse.json({ error: "Failed to load integrity queue", details: err.message }, { status: 500 });
  }
});

