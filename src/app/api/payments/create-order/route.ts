import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import { getCreditPack, getRazorpayClient } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

const createOrderSchema = z.object({
  pack_id: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createOrderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid payment pack" }, { status: 400 });
    }

    const pack = getCreditPack(validated.data.pack_id);
    if (!pack) {
      return NextResponse.json({ error: "Unknown credit pack" }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const razorpay = getRazorpayClient();

    let orderId: string;

    if (razorpay && keyId && !keyId.includes("mockmate123456")) {
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: pack.amount,
          currency: "INR",
          receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
          notes: {
            user_id: user.id,
            pack_id: pack.id,
            credits: pack.credits.toString(),
          },
        });
        orderId = rzpOrder.id;
      } catch (err: any) {
        return NextResponse.json(
          { error: "Razorpay order creation failed", details: err.message },
          { status: 502 }
        );
      }
    } else {
      orderId = `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
    }

    const paymentRecord = {
      id: crypto.randomUUID(),
      user_id: user.id,
      order_id: orderId,
      razorpay_order_id: orderId,
      pack: pack.id,
      amount: pack.amount,
      credits_added: pack.credits,
      status: "created" as const,
      created_at: new Date().toISOString(),
    };

    appStore.savePayment(paymentRecord);
    try {
      const supabase = createAdminClient();
      await supabase.from("payments").insert(paymentRecord);
    } catch {}

    return NextResponse.json({
      order_id: orderId,
      amount: pack.amount,
      currency: "INR",
      key_id: keyId,
      pack_title: pack.name,
      credits: pack.credits,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
