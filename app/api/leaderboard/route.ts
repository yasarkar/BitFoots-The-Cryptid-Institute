import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured, devMockStore } from "@/lib/supabaseAdmin";

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
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    let rawList: any[] = [];

    // 1. Fetch from Supabase View if configured
    if (isSupabaseAdminConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("leaderboard")
        .select("*")
        .limit(50);

      if (!error && data) {
        rawList = data;
      } else {
        console.warn("Supabase leaderboard query fallback:", error?.message);
        rawList = devMockStore.getLeaderboard();
      }
    } else {
      rawList = devMockStore.getLeaderboard();
    }

    // 2. Map items with Rank index (1-based)
    const leaderboard: LeaderboardItem[] = rawList.slice(0, 50).map((row, idx) => ({
      rank: idx + 1,
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
    }));

    // 3. Locate Target User Rank & Stats
    let userRank: number | null = null;
    let currentUserEntry: LeaderboardItem | null = null;

    if (targetUserId) {
      const foundIdx = leaderboard.findIndex((item) => item.user_id === targetUserId);
      if (foundIdx !== -1) {
        userRank = foundIdx + 1;
        currentUserEntry = leaderboard[foundIdx];
      }
    }

    return NextResponse.json({
      success: true,
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
