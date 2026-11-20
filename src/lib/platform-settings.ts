import { createAdminClient } from "@/lib/supabase/admin";
import { PlatformSettings } from "@/types";

const DEFAULT_SETTINGS: PlatformSettings = {
  llm_kill_switch: false,
  max_daily_interviews_per_user: 10,
  max_strikes: 3,
  strike_grace_seconds: 15,
};

// Global cache shared across Next.js API route chunks
const globalForSettings = globalThis as unknown as {
  __mockmate_settingsCache?: PlatformSettings;
  __mockmate_settingsTime?: number;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const now = Date.now();
  if (
    globalForSettings.__mockmate_settingsCache &&
    now - (globalForSettings.__mockmate_settingsTime || 0) < 5000
  ) {
    return globalForSettings.__mockmate_settingsCache;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("platform_settings").select("key, value");

    if (error || !data) {
      return globalForSettings.__mockmate_settingsCache || DEFAULT_SETTINGS;
    }

    const merged = { ...DEFAULT_SETTINGS };
    for (const row of data) {
      if (row.key === "llm_kill_switch") {
        merged.llm_kill_switch = row.value === true || row.value === "true";
      } else if (row.key === "max_daily_interviews_per_user") {
        merged.max_daily_interviews_per_user = Number(row.value) || 10;
      } else if (row.key === "max_strikes") {
        merged.max_strikes = Number(row.value) || 3;
      } else if (row.key === "strike_grace_seconds") {
        merged.strike_grace_seconds = Number(row.value) || 15;
      }
    }

    globalForSettings.__mockmate_settingsCache = merged;
    globalForSettings.__mockmate_settingsTime = now;
    return merged;
  } catch (err) {
    console.warn("[PLATFORM_SETTINGS] Failed to read platform_settings:", err);
    return globalForSettings.__mockmate_settingsCache || DEFAULT_SETTINGS;
  }
}

export async function updatePlatformSetting<K extends keyof PlatformSettings>(
  key: K,
  value: PlatformSettings[K],
  adminId: string
): Promise<boolean> {
  try {
    if (!globalForSettings.__mockmate_settingsCache) {
      globalForSettings.__mockmate_settingsCache = { ...DEFAULT_SETTINGS };
    }
    globalForSettings.__mockmate_settingsCache[key] = value;
    globalForSettings.__mockmate_settingsTime = Date.now();

    const supabase = createAdminClient();
    const { error } = await supabase.from("platform_settings").upsert({
      key,
      value: value as any,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn(`[PLATFORM_SETTINGS] Supabase error updating ${key}:`, error.message);
    }

    return true;
  } catch (err) {
    console.warn(`[PLATFORM_SETTINGS] Failed updating ${key} via Supabase:`, err);
    return true;
  }
}

