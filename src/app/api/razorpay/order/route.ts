import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { getCreditPack, getRazorpayClient } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { appStore } from "@/lib/store";
import { PaymentRecord } from "@/types";

const orderRequestSchema = z.object({
  packId: z.string().min(1, "packId is required"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce authentication: payment orders strictly require a logged-in session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to purchase interview credits." },
        { status: 401 }
      );
    }

    if (user.is_suspended) {
      return NextResponse.json(
        { error: "Account suspended. Cannot initiate purchases." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = orderRequestSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request. packId is required." },
        { status: 400 }
      );
    }

    // 2. Resolve pack, price & credits STRICTLY server-side (never trust client)
    const pack = getCreditPack(validated.data.packId);
    if (!pack) {
      return NextResponse.json(
        { error: `Invalid pack '${validated.data.packId}'. Choose 'starter' or 'pro'.` },
        { status: 400 }
      );
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const razorpay = getRazorpayClient();

    let orderId: string;

    // 3. Create Razorpay Order
    // NOTE FOR PRODUCTION:
    // With valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env, razorpay.orders.create executes against Razorpay's API.
    if (razorpay && keyId && !keyId.includes("mockmate123456")) {
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: pack.amount, // in paise
          currency: "INR",
          receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
          notes: {
            user_id: user.id,
            user_email: user.email,
            pack_id: pack.id,
            credits: pack.credits.toString(),
          },
        });
        orderId = rzpOrder.id;
      } catch (rzpErr: any) {
        console.error("[RAZORPAY_ORDER_CREATE_ERROR]", rzpErr);
        return NextResponse.json(
          {
            error: "Failed to create Razorpay payment order. Please check payment keys or try again later.",
            details: rzpErr.error?.description || rzpErr.message,
          },
          { status: 502 }
        );
      }
    } else {
      // Offline / Test mock fallback order id
      orderId = `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
    }

    // 4. Record payment in database with status 'created'
    const paymentRecord: PaymentRecord = {
      id: crypto.randomUUID(),
      user_id: user.id,
      order_id: orderId,
      razorpay_order_id: orderId,
      pack: pack.id,
      amount: pack.amount,
      credits_added: pack.credits,
      status: "created",
      created_at: new Date().toISOString(),
    };

    // Save in memory store
    appStore.savePayment(paymentRecord);

    // Save in Supabase
    try {
      const supabase = createAdminClient();
      await supabase.from("payments").insert({
        id: paymentRecord.id,
        user_id: paymentRecord.user_id,
        order_id: paymentRecord.order_id,
        razorpay_order_id: paymentRecord.razorpay_order_id,
        pack: paymentRecord.pack,
        amount: paymentRecord.amount,
        credits_added: paymentRecord.credits_added,
        status: paymentRecord.status,
        created_at: paymentRecord.created_at,
      });
    } catch (dbErr) {
      console.warn("[PAYMENT_DB_INSERT_WARN] Supabase payments table insert warning:", dbErr);
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      amount: pack.amount,
      currency: "INR",
      key_id: keyId || "rzp_test_placeholder",
      pack: pack.id,
      pack_title: pack.name,
      credits: pack.credits,
    });
  } catch (err: any) {
    console.error("[RAZORPAY_ORDER_API_ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error creating payment order." },
      { status: 500 }
    );
  }
}
