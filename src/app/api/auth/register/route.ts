import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isDisposableEmail, evaluatePasswordStrength, checkAuthRateLimit } from "@/lib/auth-guards";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please provide a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms: z.literal(true, "You must accept the terms and conditions"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkAuthRateLimit(`register_${ip}`, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = registerSchema.safeParse(body);
    if (!validated.success) {
      const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0];
      return NextResponse.json(
        { error: firstError || "Invalid registration data" },
        { status: 400 }
      );
    }

    const { full_name, email, password } = validated.data;

    // 2. Disposable Email Guard
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        {
          error:
            "Disposable and temporary email addresses are not allowed. Please sign up with your college or permanent personal email.",
        },
        { status: 400 }
      );
    }

    // 3. Password Strength Guard
    const strength = evaluatePasswordStrength(password);
    if (!strength.isValid) {
      return NextResponse.json(
        {
          error: strength.errors[0] || "Password does not meet minimum security requirements.",
        },
        { status: 400 }
      );
    }

    // 4. Supabase Auth Sign Up
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
        emailRedirectTo: `${siteUrl}/api/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = data.user;
    const isEmailConfirmed = !!user?.email_confirmed_at;

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
        full_name,
        email_confirmed: isEmailConfirmed,
      },
      requiresVerification: !isEmailConfirmed,
      message: isEmailConfirmed
        ? "Account created successfully!"
        : "Please check your inbox to verify your email address.",
    });
  } catch (err: any) {
    console.error("[AUTH_REGISTER_ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Failed to register account" },
      { status: 500 }
    );
  }
}

