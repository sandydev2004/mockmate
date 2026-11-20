import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkAuthRateLimit } from "@/lib/auth-guards";

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkAuthRateLimit(`login_${ip}`, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = loginSchema.safeParse(body);
    if (!validated.success) {
      const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0];
      return NextResponse.json({ error: firstError || "Invalid login credentials" }, { status: 400 });
    }

    const { email, password } = validated.data;
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const user = data.user;

    // Check if email verification is required and unconfirmed
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        {
          error: "Your email has not been verified yet. Please check your inbox or request a new verification link.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
      },
    });
  } catch (err: any) {
    console.error("[AUTH_LOGIN_ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Authentication failed" },
      { status: 500 }
    );
  }
}

