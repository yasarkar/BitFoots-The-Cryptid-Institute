import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { isValidUuid } from "./uuid";

export { isValidUuid };

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl && serviceRoleKey && !supabaseUrl.includes("your-project") && supabaseUrl.startsWith("http")
);

export const isSupabaseAnyConfigured = Boolean(
  supabaseUrl &&
  (serviceRoleKey || anonKey) &&
  !supabaseUrl.includes("your-project") &&
  supabaseUrl.startsWith("http")
);

/**
 * Server-only Supabase Client.
 * Uses SUPABASE_SERVICE_ROLE_KEY if available (to bypass RLS for anti-cheat verified scores),
 * otherwise falls back to anon key.
 */
export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : isSupabaseAnyConfigured
    ? createClient(supabaseUrl, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

/**
 * UUID helpers live in `lib/uuid.ts` (single shared implementation).
 */

/**
 * In-Memory Development Store fallback when Supabase credentials are not yet set
 */
export interface MockLeaderboardEntry {
  rank?: number;
  user_id: string;
  x_username: string;
  x_avatar_url: string;
  is_guest: boolean;
  total_points: number;
  chapters_cleared: number;
  best_time_ms: number;
  unlocked_sectors?: number[];
}

const globalDevStore: {
  profiles: Map<
    string,
    {
      x_username: string;
      x_avatar_url: string;
      is_custom_avatar?: boolean;
      is_guest: boolean;
      unlocked_sectors: number[];
    }
  >;
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
      "a0000000-0000-4000-8000-000000000001",
      {
        x_username: "satoshi_footprint",
        x_avatar_url: "/bitfoot-heads/bitfoot-head-01.png",
        is_guest: false,
        unlocked_sectors: [1, 2, 3],
      },
    ],
    [
      "a0000000-0000-4000-8000-000000000002",
      {
        x_username: "pixel_stalker",
        x_avatar_url: "/bitfoot-heads/bitfoot-head-02.png",
        is_guest: false,
        unlocked_sectors: [1, 2],
      },
    ],
    [
      "a0000000-0000-4000-8000-000000000003",
      {
        x_username: "Guest_9921",
        x_avatar_url: "/bitfoot-heads/bitfoot-head-03.png",
        is_guest: true,
        unlocked_sectors: [1],
      },
    ],
  ]),
  scores: [
    {
      user_id: "a0000000-0000-4000-8000-000000000001",
      chapter: 1,
      points: 310,
      duration_ms: 22400,
      created_at: new Date().toISOString(),
    },
    {
      user_id: "a0000000-0000-4000-8000-000000000002",
      chapter: 1,
      points: 290,
      duration_ms: 26100,
      created_at: new Date().toISOString(),
    },
    {
      user_id: "a0000000-0000-4000-8000-000000000003",
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
    unlockedSectors?: number[];
  }) => {
    const existing = globalDevStore.profiles.get(data.userId);
    const updatedUnlocked = Array.from(
      new Set([...(existing?.unlocked_sectors || [1]), ...(data.unlockedSectors || [1])])
    ).sort((a, b) => a - b);

    globalDevStore.profiles.set(data.userId, {
      x_username: data.username,
      x_avatar_url: data.avatarUrl,
      is_custom_avatar: existing?.is_custom_avatar ?? false,
      is_guest: data.isGuest,
      unlocked_sectors: updatedUnlocked,
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
        unlocked_sectors: [1],
      };

      results.push({
        user_id: userId,
        x_username: profile.x_username,
        x_avatar_url: profile.x_avatar_url,
        is_guest: profile.is_guest,
        total_points: agg.totalPoints,
        chapters_cleared: agg.chaptersCleared,
        best_time_ms: agg.bestTimeMs,
        unlocked_sectors: profile.unlocked_sectors,
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

  getRecentScores: (limit = 10) => {
    const list = [...globalDevStore.scores].reverse().slice(0, limit);
    return list.map((s, idx) => {
      const profile = globalDevStore.profiles.get(s.user_id) || {
        x_username: "Anonymous Hunter",
        x_avatar_url: "/bitfoot-heads/bitfoot-head-01.png",
      };
      return {
        id: `mock_score_${idx}_${s.user_id.slice(0, 8)}`,
        user_id: s.user_id,
        chapter: s.chapter,
        points: s.points,
        duration_ms: s.duration_ms,
        created_at: s.created_at,
        profiles: {
          x_username: profile.x_username,
          x_avatar_url: profile.x_avatar_url,
        },
      };
    });
  },
};
