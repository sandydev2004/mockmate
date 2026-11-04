import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { appStore } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.includes("mockmate_webhook_secret")) {
      console.log("[WEBHOOK] Webhook secret not configured, acknowledging event in test mode.");
    } else if (signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment capture / order paid events
    if (event === "order.paid" || event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const userId = paymentEntity?.notes?.user_id;
      const creditsToAdd = parseInt(paymentEntity?.notes?.credits || "0", 10);

      if (orderId && paymentId) {
        const payment = appStore.getPayment(orderId);
        if (payment && payment.status !== "paid") {
          payment.status = "paid";
          payment.razorpay_payment_id = paymentId;
          appStore.savePayment(payment);
          appStore.addCredits(payment.user_id, payment.credits_added);
        } else if (userId && creditsToAdd > 0) {
          appStore.addCredits(userId, creditsToAdd);
        }

        // Fulfill in Supabase if live
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl && !supabaseUrl.includes("mockmate-demo") && userId) {
          try {
            const admin = createAdminClient();
            await admin.rpc("fulfill_payment", {
              p_order_id: orderId,
              p_payment_id: paymentId,
              p_user_id: userId,
              p_credits: creditsToAdd,
            });
          } catch (err) {
            console.warn("Supabase webhook rpc error:", err);
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}
