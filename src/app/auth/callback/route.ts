import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSafeRedirectPath } from "@/lib/auth-guards";
import { appStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  const errorParam =
    requestUrl.searchParams.get("error_description") ||
    requestUrl.searchParams.get("error");

  // Determine origin safely from NEXT_PUBLIC_APP_URL or requestUrl
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin =
    envAppUrl && !envAppUrl.includes("localhost:3000")
      ? envAppUrl.replace(/\/$/, "")
      : requestUrl.origin;

  // Sanitize redirect path to prevent open redirect vulnerabilities
  const safeNext = getSafeRedirectPath(rawNext, "/dashboard");

  // Handle explicit OAuth errors from the provider
  if (errorParam) {
    console.error("[AUTH_CALLBACK_OAUTH_ERROR]", errorParam);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", errorParam);
    return NextResponse.redirect(loginUrl);
  }

  // Handle missing code
  if (!code) {
    console.error("[AUTH_CALLBACK_NO_CODE] No authorization code found in callback query params");
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "No authorization code provided from authentication provider.");
    return NextResponse.redirect(loginUrl);
  }

  // Target redirect URL
  const redirectTarget = new URL(safeNext, origin);
  const response = NextResponse.redirect(redirectTarget);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mockmate-demo.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key";

  // Create server client that sets session cookies on the outgoing redirect response
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[AUTH_CALLBACK_EXCHANGE_ERROR]", error.message);
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", error.message || "Failed to exchange authorization code for session.");
      return NextResponse.redirect(loginUrl);
    }

    const user = data?.user;
    if (user && user.email) {
      // 1. Google OAuth users are pre-verified: Ensure email_confirm flag is persisted
      const isGoogle =
        user.app_metadata?.provider === "google" ||
        user.app_metadata?.providers?.includes("google") ||
        user.identities?.some((i) => i.provider === "google");

      const adminClient = createAdminClient();

      if (isGoogle && !user.email_confirmed_at) {
        try {
          await adminClient.auth.admin.updateUserById(user.id, {
            email_confirm: true,
          });
        } catch (confirmErr: any) {
          console.warn("[AUTH_CALLBACK_CONFIRM_WARN]", confirmErr.message);
        }
      }

      // 2. Profile & Credit Guarantee:
      // - New users: profile created with exactly 1 free credit and full name.
      // - Existing email/password users logging in with same Gmail: link profile, DO NOT duplicate profile or grant extra credits.
      try {
        const candidateName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          splitEmailName(user.email);

        // Check if profile exists by ID
        const { data: profileById } = await adminClient
          .from("profiles")
          .select("id, email, full_name, credits")
          .eq("id", user.id)
          .maybeSingle();

        if (profileById) {
          // Profile exists: preserve credits, populate name if missing
          if (!profileById.full_name && candidateName) {
            await adminClient
              .from("profiles")
              .update({ full_name: candidateName })
              .eq("id", user.id);
          }
          appStore.updateProfile(user.id, {
            full_name: profileById.full_name || candidateName,
            email: user.email.toLowerCase(),
            credits: profileById.credits ?? 1,
          });
        } else {
          // Check if profile exists by email (prior email/password account linking)
          const { data: profileByEmail } = await adminClient
            .from("profiles")
            .select("id, email, full_name, credits, role")
            .ilike("email", user.email)
            .maybeSingle();

          if (profileByEmail) {
            // Existing account with same email: insert for new auth user ID, PRESERVE EXISTING CREDITS & ROLE
            await adminClient.from("profiles").upsert({
              id: user.id,
              email: user.email.toLowerCase(),
              full_name: profileByEmail.full_name || candidateName,
              credits: profileByEmail.credits ?? 1,
              role: (profileByEmail as any).role || "user",
            });
            appStore.updateProfile(user.id, {
              full_name: profileByEmail.full_name || candidateName,
              email: user.email.toLowerCase(),
              credits: profileByEmail.credits ?? 1,
              role: (profileByEmail as any).role || "user",
            });
          } else {
            // Brand new user: exactly 1 free credit
            await adminClient.from("profiles").insert({
              id: user.id,
              email: user.email.toLowerCase(),
              full_name: candidateName,
              credits: 1,
            });
            appStore.updateProfile(user.id, {
              full_name: candidateName,
              email: user.email.toLowerCase(),
              credits: 1,
              role: "user",
            });
          }
        }
      } catch (profileErr: any) {
        console.warn("[AUTH_CALLBACK_PROFILE_WARN]", profileErr.message);
      }
    }

    return response;
  } catch (err: any) {
    console.error("[AUTH_CALLBACK_EXCEPTION]", err);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", err.message || "An unexpected error occurred during Google sign-in.");
    return NextResponse.redirect(loginUrl);
  }
}

function splitEmailName(email: string): string {
  if (!email || !email.includes("@")) return "Candidate";
  const namePart = email.split("@")[0];
  // Convert "john.doe" -> "John Doe"
  return namePart
    .split(/[._-]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ") || "Candidate";
}

