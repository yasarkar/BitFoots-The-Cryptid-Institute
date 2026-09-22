import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { isValidUuid } from "./uuid";

export { isValidUuid };

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project") && supabaseUrl.startsWith("http")
);

/**
 * Public Client-side Supabase instance.
 * Used for user authentication (X/Google OAuth) and public queries (leaderboard & profile sync).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * UUID helpers live in `lib/uuid.ts` (single shared implementation).
 */

/**
 * Fetches user profile and progress directly from Supabase
 */
export async function fetchHunterProfile(userId: string) {
  if (!supabase || !isValidUuid(userId)) return null;

  try {
    let { data, error } = await supabase
      .from("profiles")
      .select(
        "id, x_username, x_avatar_url, is_custom_avatar, zcash_address, is_guest, unlocked_sectors, highest_score"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error && error.message?.includes("is_custom_avatar")) {
      const fallback = await supabase
        .from("profiles")
        .select("id, x_username, x_avatar_url, zcash_address, is_guest, unlocked_sectors, highest_score")
        .eq("id", userId)
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, is_custom_avatar: false } : null;
      error = fallback.error;
    }

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

export interface HunterProfileSyncPayload {
  userId: string;
  username?: string;
  avatarUrl?: string;
  isCustomAvatar?: boolean;
  zcashAddress?: string;
  isGuest?: boolean;
  unlockedSectors?: number[];
}

/**
 * SEC-3: persists profile fields through the service-role API route.
 *
 * The `profiles` RLS policy no longer allows anonymous/guest clients to write
 * rows (the old `FOR ALL USING (true)` policy let anyone holding the public
 * anon key overwrite or wipe every profile). `/api/profile` validates the
 * payload and performs the upsert server side.
 */
export async function syncHunterProfile(payload: HunterProfileSyncPayload): Promise<boolean> {
  if (!isValidUuid(payload.userId)) return false;

  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("Error syncing hunter profile:", res.status);
      return false;
    }

    return true;
  } catch (err) {
    console.error("syncHunterProfile exception:", err);
    return false;
  }
}

/**
 * Saves user clearance progress (unlocked sectors) to Supabase.
 * Thin wrapper around `syncHunterProfile`, kept for existing call sites.
 */
export async function saveHunterProgress(userId: string, unlockedSectors: number[]) {
  return syncHunterProfile({ userId, unlockedSectors });
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

  const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  // Attempt modern OAuth 2.0 'x' provider first
  const res = await supabase.auth.signInWithOAuth({
    provider: "x",
    options: {
      redirectTo: `${redirectOrigin}/auth/callback`,
    },
  });

  // If Supabase project has legacy Twitter (OAuth 1.0a) enabled instead of 'x'
  if (res.error && res.error.message?.toLowerCase().includes("not enabled")) {
    const fallbackRes = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${redirectOrigin}/auth/callback`,
      },
    });
    if (fallbackRes.data?.url && typeof window !== "undefined") {
      window.location.href = fallbackRes.data.url;
    }
    return fallbackRes;
  }

  if (res.data?.url && typeof window !== "undefined") {
    window.location.href = res.data.url;
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

  const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const res = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${redirectOrigin}/auth/callback`,
    },
  });

  if (res.data?.url && typeof window !== "undefined") {
    window.location.href = res.data.url;
  }

  return res;
}

/**
 * Links X (Twitter) identity to the currently signed-in user account.
 * If there is no active authenticated session, seamlessly falls back to signInWithTwitter.
 */
export async function linkTwitterIdentity() {
  if (!supabase) {
    console.warn("Supabase is not configured with valid credentials.");
    return { error: new Error("Supabase is not configured yet. Set credentials in .env.local") };
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return await signInWithTwitter();
    }
  } catch {
    return await signInWithTwitter();
  }

  const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const res = await supabase.auth.linkIdentity({
    provider: "x",
    options: {
      redirectTo: `${redirectOrigin}/auth/callback?linked=x`,
    },
  });

  if (res.error) {
    const errMsg = res.error.message?.toLowerCase() || "";
    if (errMsg.includes("not enabled")) {
      const fallbackRes = await supabase.auth.linkIdentity({
        provider: "twitter",
        options: {
          redirectTo: `${redirectOrigin}/auth/callback?linked=twitter`,
        },
      });
      if (fallbackRes.data?.url && typeof window !== "undefined") {
        window.location.href = fallbackRes.data.url;
      }
      return fallbackRes;
    }
    // If bearer token is missing or session expired (401), fallback to full sign-in
    if (errMsg.includes("bearer") || errMsg.includes("unauthorized") || res.error.status === 401) {
      console.warn("Active session invalid for linking, falling back to signInWithTwitter");
      return await signInWithTwitter();
    }
  }

  if (res.data?.url && typeof window !== "undefined") {
    window.location.href = res.data.url;
  }

  return res;
}

/**
 * Links Google identity to the currently signed-in user account.
 * If there is no active authenticated session, seamlessly falls back to signInWithGoogle.
 */
export async function linkGoogleIdentity() {
  if (!supabase) {
    console.warn("Supabase is not configured with valid credentials.");
    return { error: new Error("Supabase is not configured yet. Set credentials in .env.local") };
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return await signInWithGoogle();
    }
  } catch {
    return await signInWithGoogle();
  }

  const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const res = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo: `${redirectOrigin}/auth/callback?linked=google`,
    },
  });

  if (res.error) {
    const errMsg = res.error.message?.toLowerCase() || "";
    // If bearer token is missing or session expired (401), fallback to full sign-in
    if (errMsg.includes("bearer") || errMsg.includes("unauthorized") || res.error.status === 401) {
      console.warn("Active session invalid for linking, falling back to signInWithGoogle");
      return await signInWithGoogle();
    }
  }

  if (res.data?.url && typeof window !== "undefined") {
    window.location.href = res.data.url;
  }

  return res;
}

/**
 * Signs out current authenticated user
 */
export async function signOutUser() {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
}
