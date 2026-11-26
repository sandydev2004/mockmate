import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/audit";
import { appStore } from "@/lib/store";
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
    let paymentRows: any[] = [];
    let count: number | null = 0;

    try {
      let query = supabase
        .from("payments")
        .select("*", { count: "exact" });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      const res = await query;
      if (res.error) {
        console.warn(`[ADMIN_PAYMENTS_WARN] Database query issue: ${res.error.message}. Checking local store fallback.`);
      } else {
        paymentRows = res.data || [];
        count = res.count || 0;
      }
    } catch (dbErr: any) {
      console.warn(`[ADMIN_PAYMENTS_WARN] Supabase connection failed: ${dbErr.message}`);
    }

    // In-memory fallback if remote database query returned no results or failed
    if (paymentRows.length === 0 && (!count || count === 0)) {
      const local = appStore.getAllPayments();
      if (local && local.length > 0) {
        let filtered = local;
        if (status !== "all") {
          filtered = filtered.filter((p) => p.status === status);
        }
        count = filtered.length;
        paymentRows = filtered.slice(offset, offset + limit);
      }
    }

    // Return empty list safely if there are simply no payments (never throw 500!)
    if (paymentRows.length === 0) {
      return NextResponse.json({
        payments: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      });
    }

    const userIds = Array.from(new Set(paymentRows.map((p: any) => p.user_id).filter(Boolean)));
    const profilesMap = new Map<string, { email: string; full_name: string | null }>();

    if (userIds.length > 0) {
      try {
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);

        if (!profErr && profiles) {
          for (const prof of profiles) {
            profilesMap.set(prof.id, prof);
          }
        }
      } catch {}

      // Fallback to local profiles if needed
      for (const uid of userIds) {
        if (!profilesMap.has(uid)) {
          const lp = appStore.getProfile(uid);
          if (lp) profilesMap.set(uid, { email: lp.email, full_name: lp.full_name || null });
        }
      }
    }

    const enhanced = paymentRows.map((p: any) => {
      const prof = profilesMap.get(p.user_id);
      return {
        id: p.id || p.order_id || p.razorpay_order_id,
        user_id: p.user_id,
        user_email: prof?.email || "Unknown",
        user_name: prof?.full_name || "Unknown",
        razorpay_order_id: p.razorpay_order_id || p.order_id || "",
        razorpay_payment_id: p.razorpay_payment_id || p.payment_id || null,
        amount: p.amount || 0,
        amount_inr: Math.round((p.amount || 0) / 100),
        credits_added: p.credits_added || 0,
        status: p.status || "created",
        created_at: p.created_at || new Date().toISOString(),
      };
    });

    return NextResponse.json({
      payments: enhanced,
      total: count || enhanced.length,
      page,
      limit,
      totalPages: Math.ceil((count || enhanced.length) / limit) || 1,
    });
  } catch (err: any) {
    console.error("[ADMIN_PAYMENTS_ERROR]", err);
    // Even on unexpected exceptions, return an empty list gracefully
    return NextResponse.json({
      payments: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
      note: "No payment records available",
    });
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
    .select("*")
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

