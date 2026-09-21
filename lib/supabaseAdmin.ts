import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
    serviceRoleKey &&
    !supabaseUrl.includes("your-project") &&
    supabaseUrl.startsWith("http")
);

/**
 * Server-only Supabase Admin Client using SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses RLS to insert validated chapter scores and manage profiles.
 */
export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * In-Memory Development Store fallback when Supabase is not yet connected
 */
export interface MockLeaderboardEntry {
  user_id: string;
  x_username: string;
  x_avatar_url: string;
  is_guest: boolean;
  total_points: number;
  chapters_cleared: number;
  best_time_ms: number;
}

// Pre-seeded with a few retro hunters for realistic preview
const globalDevStore: {
  profiles: Map<string, { x_username: string; x_avatar_url: string; is_guest: boolean }>;
  scores: Array<{
    user_id: string;
    chapter: number;
    points: number;
    duration_ms: number;
    created_at: string;
  }>;
} = {
  profiles: new Map([
    [
      "mock-hunter-1",
      {
        x_username: "satoshi_footprint",
        x_avatar_url: "/bitfoot-heads/bitfoot-head-01.png",
        is_guest: false,
      },
    ],
    [
      "mock-hunter-2",
      {
        x_username: "pixel_stalker",
        x_avatar_url: "/bitfoot-heads/bitfoot-head-02.png",
        is_guest: false,
      },
    ],
    [
      "mock-hunter-3",
      {
        x_username: "Guest_9921",
        x_avatar_url: "/bitfoot-heads/bitfoot-head-03.png",
        is_guest: true,
      },
    ],
  ]),
  scores: [
    {
      user_id: "mock-hunter-1",
      chapter: 1,
      points: 310,
      duration_ms: 22400,
      created_at: new Date().toISOString(),
    },
    {
      user_id: "mock-hunter-2",
      chapter: 1,
      points: 290,
      duration_ms: 26100,
      created_at: new Date().toISOString(),
    },
    {
      user_id: "mock-hunter-3",
      chapter: 1,
      points: 240,
      duration_ms: 31000,
      created_at: new Date().toISOString(),
    },
  ],
};

export const devMockStore = {
  recordScore: (data: {
    userId: string;
    username: string;
    avatarUrl: string;
    isGuest: boolean;
    chapter: number;
    points: number;
    durationMs: number;
  }) => {
    globalDevStore.profiles.set(data.userId, {
      x_username: data.username,
      x_avatar_url: data.avatarUrl,
      is_guest: data.isGuest,
    });

    globalDevStore.scores.push({
      user_id: data.userId,
      chapter: data.chapter,
      points: data.points,
      duration_ms: data.durationMs,
      created_at: new Date().toISOString(),
    });
  },

  getLeaderboard: (): MockLeaderboardEntry[] => {
    const bestPerChapter = new Map<string, { maxPoints: number; bestDuration: number }>();

    for (const s of globalDevStore.scores) {
      const key = `${s.user_id}_${s.chapter}`;
      const existing = bestPerChapter.get(key);
      if (!existing || s.points > existing.maxPoints) {
        bestPerChapter.set(key, { maxPoints: s.points, bestDuration: s.duration_ms });
      }
    }

    const userAggregation = new Map<
      string,
      { totalPoints: number; chaptersCleared: number; bestTimeMs: number }
    >();

    bestPerChapter.forEach((val, key) => {
      const [userId] = key.split("_");
      const current = userAggregation.get(userId) || {
        totalPoints: 0,
        chaptersCleared: 0,
        bestTimeMs: 0,
      };

      current.totalPoints += val.maxPoints;
      current.chaptersCleared += 1;
      current.bestTimeMs += val.bestDuration;
      userAggregation.set(userId, current);
    });

    const results: MockLeaderboardEntry[] = [];
    userAggregation.forEach((agg, userId) => {
      const profile = globalDevStore.profiles.get(userId) || {
        x_username: "Anonymous Hunter",
        x_avatar_url: "/bitfoot-heads/bitfoot-head-01.png",
        is_guest: true,
      };

      results.push({
        user_id: userId,
        x_username: profile.x_username,
        x_avatar_url: profile.x_avatar_url,
        is_guest: profile.is_guest,
        total_points: agg.totalPoints,
        chapters_cleared: agg.chaptersCleared,
        best_time_ms: agg.bestTimeMs,
      });
    });

    // Sort total_points DESC, best_time_ms ASC
    return results.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      return a.best_time_ms - b.best_time_ms;
    });
  },
};
