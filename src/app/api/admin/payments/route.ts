import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = withAdminApi(async (adminUser, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all"; // all | paid | failed | created
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  try {
    let query = supabase
      .from("payments")
      .select("*, profiles:user_id(id, email, full_name)", { count: "exact" });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: payments, count, error } = await query;
    if (error) {
      throw error;
    }

    const enhanced = (payments || []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      user_email: p.profiles?.email || "Unknown",
      user_name: p.profiles?.full_name || "Unknown",
      razorpay_order_id: p.razorpay_order_id,
      razorpay_payment_id: p.razorpay_payment_id,
      amount: p.amount,
      amount_inr: Math.round(p.amount / 100),
      credits_added: p.credits_added,
      status: p.status,
      created_at: p.created_at,
    }));

    return NextResponse.json({
      payments: enhanced,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err: any) {
    console.error("[ADMIN_PAYMENTS_ERROR]", err);
    return NextResponse.json({ error: "Failed to fetch payments", details: err.message }, { status: 500 });
  }
});

const manualCreditSchema = z.object({
  payment_id: z.string().min(1, "Payment ID is required"),
  credits_to_add: z.number().int().min(1, "Credits to add must be at least 1"),
  reason: z.string().min(5, "A verified reason (at least 5 characters) is required for manual credit grants"),
});

export const POST = withAdminApi(async (adminUser, req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const validated = manualCreditSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validated.error.format() },
      { status: 400 }
    );
  }

  const { payment_id, credits_to_add, reason } = validated.data;
  const supabase = createAdminClient();

  // 1. Fetch payment record
  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .select("*, profiles:user_id(id, email, credits)")
    .eq("id", payment_id)
    .single();

  if (pErr || !payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  const userId = payment.user_id;

  // 2. Fetch profile credits
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("credits, email")
    .eq("id", userId)
    .single();

  if (profErr || !profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const newCredits = (profile.credits || 0) + credits_to_add;

  // 3. Update profile credits
  const { error: updateProfErr } = await supabase
    .from("profiles")
    .update({ credits: newCredits, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateProfErr) {
    return NextResponse.json({ error: "Failed to update credits", details: updateProfErr.message }, { status: 500 });
  }

  // 4. Mark payment as resolved/paid
  await supabase
    .from("payments")
    .update({ status: "paid" })
    .eq("id", payment_id);

  // 5. Audit log
  await logAdminAction({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    action: "payment.manual_credit_granted",
    targetType: "payment",
    targetId: payment_id,
    details: {
      userId,
      userEmail: profile.email,
      creditsAdded: credits_to_add,
      previousCredits: profile.credits,
      newCredits,
      reason,
      razorpay_order_id: payment.razorpay_order_id,
      amount: payment.amount,
    },
    req,
  });

  return NextResponse.json({
    success: true,
    message: `Granted ${credits_to_add} credits to ${profile.email}. Payment marked as resolved.`,
    newCredits,
  });
});

