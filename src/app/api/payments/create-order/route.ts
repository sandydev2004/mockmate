import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import Razorpay from "razorpay";

const createOrderSchema = z.object({
  pack_id: z.enum(["pack_3", "pack_10"]),
});

const PACKS = {
  pack_3: {
    credits: 3,
    amount: 9900, // Rs 99 in paise
    title: "Starter Pack (3 Interviews)",
  },
  pack_10: {
    credits: 10,
    amount: 24900, // Rs 249 in paise
    title: "Placement Pro Pack (10 Interviews)",
  },
};

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

    const pack = PACKS[validated.data.pack_id];
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const hasLiveRazorpay = Boolean(
      keyId &&
      keySecret &&
      !keyId.includes("mockmate123456") &&
      keyId.startsWith("rzp_")
    );

    let orderId = `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;

    if (hasLiveRazorpay) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId!,
          key_secret: keySecret!,
        });

        const rzpOrder = await razorpay.orders.create({
          amount: pack.amount,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            user_id: user.id,
            pack_id: validated.data.pack_id,
            credits: pack.credits,
          },
        });
        orderId = rzpOrder.id;
      } catch (err: any) {
        console.warn("Razorpay API error, falling back to test order:", err.message);
      }
    }

    // Save pending payment record in store
    appStore.savePayment({
      id: crypto.randomUUID(),
      user_id: user.id,
      razorpay_order_id: orderId,
      amount: pack.amount,
      credits_added: pack.credits,
      status: "created",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      order_id: orderId,
      amount: pack.amount,
      currency: "INR",
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId || "rzp_test_mockmate123456",
      pack_title: pack.title,
      credits: pack.credits,
    });
  } catch (error: any) {
    console.error("[PAYMENT_CREATE_ORDER_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create payment order", details: error.message },
      { status: 500 }
    );
  }
}
