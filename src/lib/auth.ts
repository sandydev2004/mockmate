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
        // Fetch credits from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, full_name")
          .eq("id", user.id)
          .single();

        return {
          id: user.id,
          email: user.email || "user@mockmate.ai",
          full_name: profile?.full_name || user.user_metadata?.full_name,
          credits: profile?.credits ?? 1,
        };
      }
    } catch (err) {
      console.warn("Supabase auth check failed, falling back to local session:", err);
    }
  }

  // Fallback to local / demo session
  const userId = demoCookie || "demo-user-123";
  const profile = appStore.getProfile(userId);

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    credits: profile.credits,
  };
}
