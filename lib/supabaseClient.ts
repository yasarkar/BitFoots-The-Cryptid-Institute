import { createClient, SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project") &&
    supabaseUrl.startsWith("http")
);

/**
 * Public Client-side Supabase instance.
 * Used for user authentication (X/Google OAuth) and public queries (leaderboard & profile sync).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Validates whether a string is a valid UUID v4 format
 */
export function isValidUuid(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Fetches user profile and progress directly from Supabase
 */
export async function fetchHunterProfile(userId: string) {
  if (!supabase || !isValidUuid(userId)) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, x_username, x_avatar_url, zcash_address, is_guest, unlocked_sectors, highest_score")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Error fetching hunter profile from Supabase:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("fetchHunterProfile exception:", err);
    return null;
  }
}

/**
 * Saves user clearance progress (unlocked sectors) to Supabase
 */
export async function saveHunterProgress(userId: string, unlockedSectors: number[]) {
  if (!supabase || !isValidUuid(userId)) return false;

  try {
    const validSectors = Array.from(new Set([1, ...unlockedSectors.filter((n) => typeof n === "number")])).sort(
      (a, b) => a - b
    );

    const { error } = await supabase
      .from("profiles")
      .update({
        unlocked_sectors: validSectors,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.warn("Error saving progress to Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("saveHunterProgress exception:", err);
    return false;
  }
}

/**
 * Subscribes to real-time changes on chapter_scores and profiles to refresh leaderboard live
 */
export function subscribeToLeaderboard(onUpdate: () => void) {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel("live_leaderboard_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chapter_scores",
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn("Failed to subscribe to leaderboard real-time changes:", err);
    return () => {};
  }
}

/**
 * Initiates X (Twitter) OAuth Login flow
 * Modern Supabase uses "x" (OAuth 2.0). Falls back to "twitter" (OAuth 1.0a) if needed.
 */
export async function signInWithTwitter() {
  if (!supabase) {
    console.warn("Supabase is not configured with valid credentials.");
    return { error: new Error("Supabase is not configured yet. Set credentials in .env.local") };
  }

  const redirectOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  // Attempt modern OAuth 2.0 'x' provider first
  const res = await supabase.auth.signInWithOAuth({
    provider: "x",
    options: {
      redirectTo: `${redirectOrigin}/auth/callback`,
    },
  });

  // If Supabase project has legacy Twitter (OAuth 1.0a) enabled instead of 'x'
  if (res.error && res.error.message?.toLowerCase().includes("not enabled")) {
    return await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${redirectOrigin}/auth/callback`,
      },
    });
  }

  return res;
}

/**
 * Initiates Google OAuth Login flow
 */
export async function signInWithGoogle() {
  if (!supabase) {
    console.warn("Supabase is not configured with valid credentials.");
    return { error: new Error("Supabase is not configured yet. Set credentials in .env.local") };
  }

  const redirectOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${redirectOrigin}/auth/callback`,
    },
  });
}

/**
 * Signs out current authenticated user
 */
export async function signOutUser() {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
}
