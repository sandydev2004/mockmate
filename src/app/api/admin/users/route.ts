import { NextRequest, NextResponse } from "next/server";
import { withAdminApi, maskEmail } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { appStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(
  async (adminUser, req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status") || "all"; // all | active | suspended | deleted
    const role = searchParams.get("role") || "all"; // all | user | support | admin | super_admin
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    try {
      let query = supabase
        .from("profiles")
        .select(
          "id, email, full_name, credits, role, is_suspended, is_deleted, deleted_at, target_role, target_company_type, created_at, updated_at",
          { count: "exact" }
        );

      if (q) {
        query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
      }

      if (status === "active") {
        query = query.eq("is_suspended", false).eq("is_deleted", false);
      } else if (status === "suspended") {
        query = query.eq("is_suspended", true).eq("is_deleted", false);
      } else if (status === "deleted") {
        query = query.eq("is_deleted", true);
      } else {
        // Exclude soft-deleted users from regular views by default
        query = query.eq("is_deleted", false);
      }

      if (role !== "all") {
        query = query.eq("role", role);
      }

      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      const { data: users, count, error } = await query;
      if (error) {
        throw error;
      }

      // Enhance users with masked email for data protection
      const enhanced = (users || []).map((u) => ({
        ...u,
        email: maskEmail(u.email),
        unmasked: false,
      }));

      return NextResponse.json({
        users: enhanced,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    } catch {
      // Resilient fallback to in-memory store
      let all = appStore.getAllProfiles();
      if (q) {
        const lowerQ = q.toLowerCase();
        all = all.filter(
          (u) =>
            u.email?.toLowerCase().includes(lowerQ) ||
            u.full_name?.toLowerCase().includes(lowerQ)
        );
      }
      if (status === "active") all = all.filter((u) => !u.is_suspended && !u.is_deleted);
      else if (status === "suspended") all = all.filter((u) => !!u.is_suspended && !u.is_deleted);
      else if (status === "deleted") all = all.filter((u) => !!u.is_deleted);
      else all = all.filter((u) => !u.is_deleted);

      if (role !== "all") all = all.filter((u) => (u.role || "user") === role);

      const paginated = all.slice(offset, offset + limit).map((u) => ({
        ...u,
        email: maskEmail(u.email),
        unmasked: false,
        interviews_count: appStore.getUserInterviews(u.id).length,
      }));

      return NextResponse.json({
        users: paginated,
        total: all.length,
        page,
        limit,
        totalPages: Math.ceil(all.length / limit),
      });
    }
  },
  { requiredPermission: "users.view" }
);
