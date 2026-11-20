import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkAuthRateLimit } from "@/lib/auth-guards";

const resendSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
});

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkAuthRateLimit(`resend_${ip}`, 3, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many resend attempts. Please wait ${rateCheck.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = resendSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: validated.data.email,
      options: {
        emailRedirectTo: `${siteUrl}/api/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Verification email resent. Please check your inbox.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

