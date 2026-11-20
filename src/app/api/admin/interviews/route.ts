import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { appStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(async (adminUser, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const round = searchParams.get("round") || "all";
  const risk = searchParams.get("risk") || "all";
  const autoSubmitted = searchParams.get("auto_submitted");
  const adminReviewed = searchParams.get("admin_reviewed");
  const isAdminTest = searchParams.get("is_admin_test"); // "true" | "false" | "all"
  const q = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  try {
    let query = supabase
      .from("interviews")
      .select(
        `id, user_id, role, company_type, difficulty, round, status, mode, strikes, 
         auto_submit_reason, overall_score, started_at, ended_at, admin_reviewed, 
         admin_notes, admin_review_verdict, reviewed_at, is_admin_test,
         profiles:user_id (id, email, full_name),
         feedback (overall, risk_score, top_risk_reasons)`,
        { count: "exact" }
      );

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (round !== "all") {
      query = query.eq("round", round);
    }

    if (autoSubmitted === "true") {
      query = query.not("auto_submit_reason", "is", null);
    } else if (autoSubmitted === "false") {
      query = query.is("auto_submit_reason", null);
    }

    if (adminReviewed === "true") {
      query = query.eq("admin_reviewed", true);
    } else if (adminReviewed === "false") {
      query = query.eq("admin_reviewed", false);
    }

    if (isAdminTest === "true") {
      query = query.eq("is_admin_test", true);
    } else if (isAdminTest === "false") {
      query = query.eq("is_admin_test", false);
    }

    if (q) {
      query = query.or(`id.ilike.%${q}%,auto_submit_reason.ilike.%${q}%`);
    }

    query = query.order("started_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: interviews, count, error } = await query;
    if (error) {
      throw error;
    }

    // Filter by risk in memory if joined feedback risk is requested
    let results = (interviews || []).map((row: any) => {
      const fb = Array.isArray(row.feedback) ? row.feedback[0] : row.feedback;
      const profile = row.profiles;
      const riskScore = fb?.risk_score ?? 0;
      let calculatedRisk: "Low" | "Medium" | "High" = "Low";
      if (riskScore >= 60 || row.auto_submit_reason || (row.strikes || 0) >= 3) {
        calculatedRisk = "High";
      } else if (riskScore >= 25 || (row.strikes || 0) >= 1) {
        calculatedRisk = "Medium";
      }

      return {
        id: row.id,
        user_id: row.user_id,
        user_email: profile?.email || "Unknown",
        user_name: profile?.full_name || "Unknown",
        role: row.role,
        company_type: row.company_type,
        difficulty: row.difficulty,
        round: row.round,
        status: row.status,
        mode: row.mode || "proctored",
        strikes: row.strikes || 0,
        auto_submit_reason: row.auto_submit_reason,
        overall_score: row.overall_score ?? fb?.overall ?? null,
        risk_level: calculatedRisk,
        risk_score: riskScore,
        admin_reviewed: !!row.admin_reviewed,
        admin_notes: row.admin_notes || null,
        admin_review_verdict: row.admin_review_verdict || null,
        started_at: row.started_at,
        ended_at: row.ended_at,
        is_admin_test: !!row.is_admin_test,
      };
    });

    if (risk !== "all") {
      const targetRisk = risk.toLowerCase();
      results = results.filter((r) => r.risk_level.toLowerCase() === targetRisk);
    }

    return NextResponse.json({
      interviews: results,
      total: count || results.length,
      page,
      limit,
      totalPages: Math.ceil((count || results.length) / limit),
    });
  } catch (err: any) {
    console.warn("[ADMIN_INTERVIEWS] Database query failed, using appStore fallback:", err.message);
    let allInterviews = appStore.getAllInterviews();

    if (isAdminTest === "true") {
      allInterviews = allInterviews.filter((i) => i.is_admin_test === true);
    } else if (isAdminTest === "false") {
      allInterviews = allInterviews.filter((i) => !i.is_admin_test);
    }

    if (status !== "all") {
      allInterviews = allInterviews.filter((i) => i.status === status);
    }
    if (round !== "all") {
      allInterviews = allInterviews.filter((i) => i.round === round);
    }
    if (autoSubmitted === "true") {
      allInterviews = allInterviews.filter((i) => !!i.auto_submit_reason);
    } else if (autoSubmitted === "false") {
      allInterviews = allInterviews.filter((i) => !i.auto_submit_reason);
    }

    const fallbackResults = allInterviews.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_email: "candidate@mockmate.internal",
      user_name: "Mock Candidate",
      role: row.role,
      company_type: row.company_type,
      difficulty: row.difficulty,
      round: row.round,
      status: row.status,
      mode: row.mode || "proctored",
      strikes: row.strikes || 0,
      auto_submit_reason: row.auto_submit_reason,
      overall_score: row.overall_score || null,
      risk_level: "Low" as const,
      risk_score: 0,
      admin_reviewed: !!row.admin_reviewed,
      admin_notes: row.admin_notes || null,
      admin_review_verdict: row.admin_review_verdict || null,
      started_at: row.started_at,
      ended_at: row.ended_at,
      is_admin_test: !!row.is_admin_test,
    }));

    return NextResponse.json({
      interviews: fallbackResults.slice(offset, offset + limit),
      total: fallbackResults.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(fallbackResults.length / limit)),
    });
  }
});

