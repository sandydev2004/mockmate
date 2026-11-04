import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = verifySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid payment verification data" }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validated.data;
    const payment = appStore.getPayment(razorpay_order_id);

    if (!payment) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency check: if already fulfilled, return success immediately
    if (payment.status === "paid") {
      const profile = appStore.getProfile(user.id);
      return NextResponse.json({
        success: true,
        already_fulfilled: true,
        credits_added: payment.credits_added,
        current_credits: profile.credits,
      });
    }

    // Verify HMAC SHA256 Signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const isTestPlaceholder = !secret || secret.includes("mockmate_razorpay_secret_key");

    if (!isTestPlaceholder) {
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        payment.status = "failed";
        appStore.savePayment(payment);
        return NextResponse.json(
          { error: "Invalid payment signature. Verification failed." },
          { status: 400 }
        );
      }
    }

    // Mark paid and add credits atomically
    payment.status = "paid";
    payment.razorpay_payment_id = razorpay_payment_id;
    appStore.savePayment(payment);

    const newCredits = appStore.addCredits(user.id, payment.credits_added);

    // If Supabase is live, fulfill in Supabase too
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes("mockmate-demo")) {
      try {
        const supabase = createClient();
        await supabase.rpc("fulfill_payment", {
          p_order_id: razorpay_order_id,
          p_payment_id: razorpay_payment_id,
          p_user_id: user.id,
          p_credits: payment.credits_added,
        });
      } catch (err) {
        console.warn("Supabase fulfill payment RPC error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      credits_added: payment.credits_added,
      current_credits: newCredits,
    });
  } catch (error: any) {
    console.error("[PAYMENT_VERIFY_ERROR]", error);
    return NextResponse.json(
      { error: "Payment verification failed", details: error.message },
      { status: 500 }
    );
  }
}
