import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project") &&
    supabaseUrl.startsWith("http")
);

/**
 * Public Client-side Supabase instance.
 * Used for user authentication (X OAuth) and public read queries (leaderboard).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

