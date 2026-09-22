import { NextRequest, NextResponse } from "next/server";
import { isValidUuid } from "@/lib/uuid";
import { supabaseAdmin, isSupabaseAnyConfigured, devMockStore } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export interface LeaderboardItem {
  rank: number;
  user_id: string;
  x_username: string;
  x_avatar_url: string;
  is_guest: boolean;
  total_points: number;
  chapters_cleared: number;
  best_time_ms: number;
  unlocked_sectors?: number[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    let rawList: any[] = [];
    let isLiveSupabase = false;

    // 1. Fetch from Supabase View if configured
    if (isSupabaseAnyConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("leaderboard")
          .select("*")
          .order("rank", { ascending: true })
          .limit(50);

        if (!error && data) {
          rawList = data;
          isLiveSupabase = true;
        } else {
          console.warn("Supabase leaderboard query fallback:", error?.message);
          rawList = devMockStore.getLeaderboard();
        }
      } catch (err: any) {
        console.warn("Supabase client query exception:", err?.message);
        rawList = devMockStore.getLeaderboard();
      }
    } else {
      rawList = devMockStore.getLeaderboard();
    }

    // 2. Map items with Rank index (1-based)
    const leaderboard: LeaderboardItem[] = rawList.slice(0, 50).map((row, idx) => ({
      rank: row.rank ? Number(row.rank) : idx + 1,
      user_id: row.user_id,
      x_username: row.x_username || "Anonymous Hunter",
      x_avatar_url:
        row.x_avatar_url && !row.x_avatar_url.includes("dicebear")
          ? row.x_avatar_url
          : "/bitfoot-heads/bitfoot-head-01.png",
      is_guest: Boolean(row.is_guest),
      total_points: Number(row.total_points || 0),
      chapters_cleared: Number(row.chapters_cleared || 0),
      best_time_ms: Number(row.best_time_ms || 0),
      unlocked_sectors: Array.isArray(row.unlocked_sectors) ? row.unlocked_sectors : [1],
    }));

    // 3. Locate Target User Rank & Stats
    let userRank: number | null = null;
    let currentUserEntry: LeaderboardItem | null = null;

    if (targetUserId) {
      const foundIdx = leaderboard.findIndex((item) => item.user_id === targetUserId);
      if (foundIdx !== -1) {
        currentUserEntry = leaderboard[foundIdx];
        userRank = currentUserEntry.rank;
      } else if (isLiveSupabase && supabaseAdmin && isValidUuid(targetUserId)) {
        // Query user's standing outside top 50
        try {
          const { data: userStanding } = await supabaseAdmin
            .from("leaderboard")
            .select("*")
            .eq("user_id", targetUserId)
            .maybeSingle();

          if (userStanding) {
            userRank = Number(userStanding.rank || 0);
            currentUserEntry = {
              rank: userRank,
              user_id: userStanding.user_id,
              x_username: userStanding.x_username || "Anonymous Hunter",
              x_avatar_url:
                userStanding.x_avatar_url && !userStanding.x_avatar_url.includes("dicebear")
                  ? userStanding.x_avatar_url
                  : "/bitfoot-heads/bitfoot-head-01.png",
              is_guest: Boolean(userStanding.is_guest),
              total_points: Number(userStanding.total_points || 0),
              chapters_cleared: Number(userStanding.chapters_cleared || 0),
              best_time_ms: Number(userStanding.best_time_ms || 0),
              unlocked_sectors: Array.isArray(userStanding.unlocked_sectors)
                ? userStanding.unlocked_sectors
                : [1],
            };
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      isLiveSupabase,
      leaderboard,
      userRank,
      currentUserEntry,
      count: leaderboard.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to load classified leaderboard records.",
      },
      { status: 500 }
    );
  }
}

/**
 * SEC-2: the public `POST` handler was removed on purpose.
 *
 * It accepted arbitrary `userId`, `points`, `durationMs` and `unlockedSectors`
 * values and wrote them straight into `chapter_scores`/`profiles`, so anyone
 * could mint leaderboard entries for any account. Scores may only be recorded
 * by `POST /api/chapter/complete`, which verifies the run token, the duration
 * window, the footprint allow-list and the gate answer server side.
 */
