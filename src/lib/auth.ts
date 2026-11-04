import { cookies } from "next/headers";
import { createClient } from "./supabase/server";
import { appStore } from "./store";

export interface CurrentUser {
  id: string;
  email: string;
  full_name?: string | null;
  credits: number;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = cookies();
  const demoCookie = cookieStore.get("mockmate_demo_user")?.value;

  // First check if live Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isSupabaseConfigured =
    supabaseUrl &&
    !supabaseUrl.includes("mockmate-demo") &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("mock-anon-key");

  if (isSupabaseConfigured) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch credits and full_name from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, full_name")
          .eq("id", user.id)
          .single();

        return {
          id: user.id,
          email: user.email || "user@mockmate.ai",
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Candidate",
          credits: profile?.credits ?? 1,
        };
      }
    } catch (err) {
      console.warn("Supabase auth check failed, checking local session:", err);
    }
  }

  // Check local session cookie
  if (demoCookie) {
    const profile = appStore.getProfile(demoCookie);
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || "Candidate",
      credits: profile.credits,
    };
  }

  // Not logged in -> Return null to enforce login requirement
  return null;
}
