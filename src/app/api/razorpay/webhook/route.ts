import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { appStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    // 1. Read the RAW text body for exact cryptographic HMAC verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[RAZORPAY_WEBHOOK_ERROR] RAZORPAY_WEBHOOK_SECRET is not set in environment.");
      return NextResponse.json(
        { error: "Webhook configuration error." },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    // 2. Cryptographic HMAC SHA-256 signature verification
    // Never expose secret in logs or errors
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("[RAZORPAY_WEBHOOK_WARN] Invalid HMAC signature received on webhook endpoint.");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    // 3. Parse JSON safely from verified raw body
    const event = JSON.parse(rawBody);
    console.log(`[RAZORPAY_WEBHOOK_EVENT] Verified event: ${event.event} | ID: ${event.payload?.payment?.entity?.id || "N/A"}`);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) {
        return NextResponse.json({ error: "Malformed payment.captured payload" }, { status: 400 });
      }

      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount; // in paise
      const notes = paymentEntity.notes || {};

      if (!orderId) {
        console.warn("[RAZORPAY_WEBHOOK_WARN] payment.captured missing order_id");
        return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
      }

      const supabase = createAdminClient();

      // 4. Fetch payment row from DB or local store
      let userId = notes.user_id;
      let creditsToAdd = notes.credits ? parseInt(notes.credits, 10) : amount >= 24900 ? 10 : 3;

      const { data: dbPayment } = await supabase
        .from("payments")
        .select("*")
        .or(`order_id.eq.${orderId},razorpay_order_id.eq.${orderId}`)
        .maybeSingle();

      if (dbPayment) {
        userId = dbPayment.user_id;
        creditsToAdd = dbPayment.credits_added;

        // IDEMPOTENCY GUARD:
        // If this order is already marked 'paid', acknowledge 200 OK and DO NOT DOUBLE CREDIT
        if (dbPayment.status === "paid") {
          console.log(`[RAZORPAY_WEBHOOK_IDEMPOTENT] Order ${orderId} already fulfilled. Skipping.`);
          return NextResponse.json(
            { status: "already_fulfilled", order_id: orderId },
            { status: 200 }
          );
        }
      }

      const localPayment = appStore.getPayment(orderId);
      if (localPayment) {
        if (!userId) userId = localPayment.user_id;
        creditsToAdd = localPayment.credits_added;

        if (localPayment.status === "paid") {
          console.log(`[RAZORPAY_WEBHOOK_IDEMPOTENT] Local store order ${orderId} already fulfilled.`);
          return NextResponse.json(
            { status: "already_fulfilled", order_id: orderId },
            { status: 200 }
          );
        }
      }

      if (!userId) {
        console.error(`[RAZORPAY_WEBHOOK_ERROR] Cannot associate order ${orderId} with a user account.`);
        return NextResponse.json(
          { error: "Unassociated payment order" },
          { status: 422 }
        );
      }

      // 5. ATOMIC FULFILLMENT: in ONE database transaction
      // Execute the idempotent database RPC fulfill_payment (handles row lock, status update & credit increment)
      let fulfilledInDb = false;
      try {
        const { data: rpcSuccess, error: rpcError } = await supabase.rpc(
          "fulfill_payment",
          {
            p_order_id: orderId,
            p_payment_id: paymentId,
            p_user_id: userId,
            p_credits: creditsToAdd,
          }
        );

        if (!rpcError && rpcSuccess) {
          fulfilledInDb = true;
          console.log(`[RAZORPAY_WEBHOOK_SUCCESS] Fulfill RPC succeeded for user ${userId} (+${creditsToAdd} credits)`);
        } else {
          console.warn("[RAZORPAY_WEBHOOK_WARN] RPC fulfill_payment fallback required:", rpcError?.message);
        }
      } catch (err) {
        console.warn("[RAZORPAY_WEBHOOK_WARN] RPC call failed:", err);
      }

      // Fallback direct updates if RPC was not executed
      if (!fulfilledInDb) {
        try {
          await supabase
            .from("payments")
            .update({
              status: "paid",
              payment_id: paymentId,
              razorpay_payment_id: paymentId,
            })
            .or(`order_id.eq.${orderId},razorpay_order_id.eq.${orderId}`);

          const { data: curProfile } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", userId)
            .single();

          if (curProfile) {
            await supabase
              .from("profiles")
              .update({
                credits: (curProfile.credits || 0) + creditsToAdd,
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId);
          }
        } catch (dbErr) {
          console.warn("[RAZORPAY_WEBHOOK_WARN] Direct DB fallback update error:", dbErr);
        }
      }

      // Also fulfill in in-memory appStore
      if (localPayment) {
        localPayment.status = "paid";
        localPayment.payment_id = paymentId;
        localPayment.razorpay_payment_id = paymentId;
        appStore.savePayment(localPayment);
      }
      appStore.addCredits(userId, creditsToAdd);

      return NextResponse.json({
        success: true,
        order_id: orderId,
        payment_id: paymentId,
        credits_added: creditsToAdd,
      });
    }

    if (event.event === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        try {
          const supabase = createAdminClient();
          await supabase
            .from("payments")
            .update({
              status: "failed",
              payment_id: paymentId || null,
              razorpay_payment_id: paymentId || null,
            })
            .or(`order_id.eq.${orderId},razorpay_order_id.eq.${orderId}`);
        } catch {}

        const localPayment = appStore.getPayment(orderId);
        if (localPayment && localPayment.status !== "paid") {
          localPayment.status = "failed";
          localPayment.payment_id = paymentId;
          appStore.savePayment(localPayment);
        }
      }

      return NextResponse.json({ received: true, event: "payment.failed" });
    }

    // Default response for other webhook events
    return NextResponse.json({ received: true, event: event.event });
  } catch (err: any) {
    console.error("[RAZORPAY_WEBHOOK_UNCAUGHT_ERROR]", err);
    return NextResponse.json(
      { error: "Webhook processing exception" },
      { status: 500 }
    );
  }
}
