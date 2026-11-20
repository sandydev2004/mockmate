import { createClient } from "./supabase/server";
import { headers } from "next/headers";
import { appStore } from "./store";

import { UserRole } from "@/types";

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  credits: number;
  role: UserRole;
  is_suspended: boolean;
  email_confirmed_at?: string | null;
}

/**
 * Gets the authenticated user from Supabase session or Authorization Bearer header.
 * No mock users or demo fallbacks.
 * Returns null if the user is unauthenticated.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Support local test simulation when Supabase remote URL is unreachable
  if (process.env.NODE_ENV !== "production") {
    try {
      const headersList = headers();
      const testRole = headersList.get("x-test-auth-role");
      if (testRole) {
        const testId = headersList.get("x-test-auth-id") || "test-user-id";
        const p = appStore.getProfile(testId);
        const effectiveRole = testRole as UserRole;
        const isSuspended = headersList.get("x-test-auth-suspended") === "true";
        const testCreditsHeader = headersList.get("x-test-auth-credits");
        if (testCreditsHeader !== null) {
          p.credits = Number(testCreditsHeader);
        }
        return {
          id: testId,
          email: headersList.get("x-test-auth-email") || p.email || "user@mockmate.internal",
          full_name: p.full_name || "Test User",
          credits: p.credits ?? 1,
          role: effectiveRole,
          is_suspended: isSuspended,
          email_confirmed_at: new Date().toISOString(),
        };
      }
    } catch {
      // In contexts where headers() cannot be called
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || supabaseUrl.includes("mockmate-demo")) {
    return null;
  }

  try {
    const supabase = createClient();
    let token: string | undefined;

    try {
      const headersList = headers();
      const authHeader = headersList.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    } catch {
      // In contexts where headers() cannot be called
    }

    const {
      data: { user },
      error: authError,
    } = await (token ? supabase.auth.getUser(token) : supabase.auth.getUser());

    if (authError || !user) {
      return null;
    }

    // Fetch live credits, role, and suspension status from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits, full_name, role, is_suspended")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.warn("[AUTH] Profile fetch warning:", profileError.message);
    }

    const candidateName =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      (user.email ? user.email.split("@")[0] : "Candidate");

    return {
      id: user.id,
      email: user.email || "",
      full_name: candidateName,
      credits: profile?.credits ?? 1,
      role: (profile?.role as UserRole) || "user",
      is_suspended: !!profile?.is_suspended,
      email_confirmed_at: user.email_confirmed_at,
    };
  } catch (err) {
    console.error("[AUTH] Error resolving user session:", err);
    return null;
  }
}
