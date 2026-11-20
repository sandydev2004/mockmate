import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLLMTelemetry } from "@/lib/llm";
import { appStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(async (adminUser, req: NextRequest) => {
  const supabase = createAdminClient();

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

    // 1. Users metrics
    const { count: totalUsersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: signups7dCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    const { count: signups30dCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    // 2. Interviews metrics (excluding admin test interviews from platform statistics)
    let startedCount = 0;
    let completedCount = 0;
    let autoSubmittedCount = 0;

    const { count: dbStartedCount, error: startErr } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .eq("is_admin_test", false);

    const { count: dbCompletedCount } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .eq("is_admin_test", false);

    const { count: dbAutoSubmittedCount } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .eq("is_admin_test", false)
      .not("auto_submit_reason", "is", null);

    if (!startErr && dbStartedCount !== null) {
      startedCount = dbStartedCount;
      completedCount = dbCompletedCount || 0;
      autoSubmittedCount = dbAutoSubmittedCount || 0;
    } else {
      // Local store fallback: filter out any admin test interviews
      const localInterviews = appStore.getAllInterviews().filter((i) => !i.is_admin_test);
      startedCount = localInterviews.length;
      completedCount = localInterviews.filter((i) => i.status === "completed").length;
      autoSubmittedCount = localInterviews.filter((i) => !!i.auto_submit_reason).length;
    }

    // 3. Payments & Credits
    const { data: paidPayments } = await supabase
      .from("payments")
      .select("amount, credits_added")
      .eq("status", "paid");

    const totalRevenuePaise = (paidPayments || []).reduce((acc, p) => acc + (p.amount || 0), 0);
    const creditsSold = (paidPayments || []).reduce((acc, p) => acc + (p.credits_added || 0), 0);
    const creditsUsed = startedCount || 0;

    // 4. Daily Signups & Interviews for the last 14 days (excluding admin test interviews)
    const { data: recentProfiles } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", fourteenDaysAgo.toISOString());

    const { data: recentInterviews } = await supabase
      .from("interviews")
      .select("started_at")
      .eq("is_admin_test", false)
      .gte("started_at", fourteenDaysAgo.toISOString());

    const dailyMap = new Map<string, { date: string; signups: number; interviews: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const displayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap.set(dateStr, { date: displayStr, signups: 0, interviews: 0 });
    }

    (recentProfiles || []).forEach((p) => {
      const dateStr = p.created_at?.split("T")[0];
      if (dateStr && dailyMap.has(dateStr)) {
        dailyMap.get(dateStr)!.signups += 1;
      }
    });

    (recentInterviews || []).forEach((inv) => {
      const dateStr = inv.started_at?.split("T")[0];
      if (dateStr && dailyMap.has(dateStr)) {
        dailyMap.get(dateStr)!.interviews += 1;
      }
    });

    const dailyChart = Array.from(dailyMap.values());
    const llmTelemetry = getLLMTelemetry();

    return NextResponse.json({
      totalUsers: totalUsersCount || 0,
      signups7d: signups7dCount || 0,
      signups30d: signups30dCount || 0,
      interviewsStarted: startedCount || 0,
      interviewsCompleted: completedCount || 0,
      autoSubmittedCount: autoSubmittedCount || 0,
      totalRevenueInr: Math.round(totalRevenuePaise / 100),
      creditsSold,
      creditsUsed,
      dailyChart,
      llmStats: llmTelemetry,
    });
  } catch (err: any) {
    console.error("[ADMIN_OVERVIEW_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to load overview data", details: err.message },
      { status: 500 }
    );
  }
});

