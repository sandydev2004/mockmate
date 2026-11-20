import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInMemoryAuditLogs } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(async (adminUser, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action")?.trim();
  const targetType = searchParams.get("target_type")?.trim();
  const q = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  try {
    let query = supabase.from("audit_logs").select("*", { count: "exact" });

    if (action) {
      query = query.eq("action", action);
    }

    if (targetType) {
      query = query.eq("target_type", targetType);
    }

    if (q) {
      query = query.or(`admin_email.ilike.%${q}%,action.ilike.%${q}%,target_id.ilike.%${q}%`);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: dbLogs, count, error } = await query;

    if (error || !dbLogs) {
      // In-memory fallback
      let memLogs = getInMemoryAuditLogs();
      if (action) memLogs = memLogs.filter((l) => l.action === action);
      if (targetType) memLogs = memLogs.filter((l) => l.target_type === targetType);
      if (q) {
        const lowerQ = q.toLowerCase();
        memLogs = memLogs.filter(
          (l) =>
            l.admin_email.toLowerCase().includes(lowerQ) ||
            l.action.toLowerCase().includes(lowerQ) ||
            (l.target_id && l.target_id.toLowerCase().includes(lowerQ))
        );
      }
      const paginated = memLogs.slice(offset, offset + limit);
      return NextResponse.json({
        logs: paginated,
        total: memLogs.length,
        page,
        limit,
        totalPages: Math.ceil(memLogs.length / limit),
      });
    }

    return NextResponse.json({
      logs: dbLogs,
      total: count || dbLogs.length,
      page,
      limit,
      totalPages: Math.ceil((count || dbLogs.length) / limit),
    });
  } catch (err: any) {
    console.error("[ADMIN_AUDIT_LOGS_ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch audit logs", details: err.message }, { status: 500 });
  }
}, { requiredPermission: "audit.view" });

