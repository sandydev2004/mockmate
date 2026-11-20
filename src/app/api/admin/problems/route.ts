import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { DSA_PROBLEMS } from "@/lib/dsa-problems";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(async (adminUser, req: NextRequest) => {
  const supabase = createAdminClient();

  try {
    const { data: dbProblems, error } = await supabase
      .from("dsa_problems")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !dbProblems || dbProblems.length === 0) {
      // Fallback to static DSA_PROBLEMS if DB table not yet populated
      const fallback = DSA_PROBLEMS.map((p) => ({
        ...p,
        is_active: true,
      }));
      return NextResponse.json({ problems: fallback, total: fallback.length });
    }

    return NextResponse.json({ problems: dbProblems, total: dbProblems.length });
  } catch (err: any) {
    console.error("[ADMIN_PROBLEMS_ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch DSA problems", details: err.message }, { status: 500 });
  }
});

const problemActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("toggle_active"),
    id: z.string(),
    is_active: z.boolean(),
  }),
  z.object({
    action: z.literal("save_problem"),
    problem: z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      slug: z.string().min(1),
      difficulty: z.enum(["easy", "medium", "hard"]),
      category: z.string().min(1),
      description: z.string().min(10),
      starter_code: z.record(z.string()),
      test_cases: z.array(
        z.object({
          input: z.string(),
          expected_output: z.string(),
          is_sample: z.boolean().optional(),
        })
      ),
      is_active: z.boolean().default(true),
    }),
  }),
  z.object({
    action: z.literal("import"),
    problems: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        slug: z.string().min(1),
        difficulty: z.enum(["easy", "medium", "hard"]),
        category: z.string().min(1),
        description: z.string().min(1),
        starter_code: z.record(z.string()),
        test_cases: z.array(
          z.object({
            input: z.string(),
            expected_output: z.string(),
            is_sample: z.boolean().optional(),
          })
        ),
        is_active: z.boolean().optional().default(true),
      })
    ),
  }),
]);

export const POST = withAdminApi(async (adminUser, req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const validated = problemActionSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validated.error.format() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const payload = validated.data;

  if (payload.action === "toggle_active") {
    const { error } = await supabase
      .from("dsa_problems")
      .update({ is_active: payload.is_active })
      .eq("id", payload.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update problem status", details: error.message }, { status: 500 });
    }

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: payload.is_active ? "problem.activated" : "problem.deactivated",
      targetType: "problem",
      targetId: payload.id,
      details: { is_active: payload.is_active },
      req,
    });

    return NextResponse.json({ success: true, is_active: payload.is_active });
  }

  if (payload.action === "save_problem") {
    const prob = payload.problem;
    const { error } = await supabase.from("dsa_problems").upsert({
      id: prob.id,
      title: prob.title,
      slug: prob.slug,
      difficulty: prob.difficulty,
      category: prob.category,
      description: prob.description,
      starter_code: prob.starter_code,
      test_cases: prob.test_cases,
      is_active: prob.is_active,
    });

    if (error) {
      return NextResponse.json({ error: "Failed to save problem", details: error.message }, { status: 500 });
    }

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "problem.saved",
      targetType: "problem",
      targetId: prob.id,
      details: { title: prob.title, difficulty: prob.difficulty },
      req,
    });

    return NextResponse.json({ success: true, problem: prob });
  }

  if (payload.action === "import") {
    const rows = payload.problems.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      category: p.category,
      description: p.description,
      starter_code: p.starter_code,
      test_cases: p.test_cases,
      is_active: p.is_active ?? true,
    }));

    const { error } = await supabase.from("dsa_problems").upsert(rows);

    if (error) {
      return NextResponse.json({ error: "Failed to import problems", details: error.message }, { status: 500 });
    }

    await logAdminAction({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: "problem.batch_imported",
      targetType: "problem",
      details: { count: rows.length },
      req,
    });

    return NextResponse.json({ success: true, count: rows.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});

export const DELETE = withAdminApi(async (adminUser, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Problem ID is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("dsa_problems").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete problem", details: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    action: "problem.deleted",
    targetType: "problem",
    targetId: id,
    req,
  });

  return NextResponse.json({ success: true, message: `Problem ${id} deleted` });
});

