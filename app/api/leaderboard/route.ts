import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  isSupabaseAnyConfigured,
  devMockStore,
  isValidUuid,
} from "@/lib/supabaseAdmin";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId: rawUserId,
      username = "Guest_Hunter",
      avatarUrl = "/bitfoot-heads/bitfoot-head-01.png",
      chapter = 1,
      points = 0,
      durationMs = 0,
      unlockedSectors = [1],
      isGuest = true,
      zcashAddress,
    } = body;

    const validUserId = isValidUuid(rawUserId || "")
      ? rawUserId
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

    const sectorNum = Number(chapter) || 1;
    const pointsNum = Number(points) || 0;
    const durationNum = Number(durationMs) || 0;

    let isLiveSupabase = false;
    let standing: any = null;

    if (isSupabaseAnyConfigured && supabaseAdmin) {
      try {
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("unlocked_sectors, highest_score")
          .eq("id", validUserId)
          .maybeSingle();

        const currentUnlocked: number[] = Array.isArray(existingProfile?.unlocked_sectors)
          ? existingProfile.unlocked_sectors
          : [1];

        const nextSector = Math.min(3, sectorNum + 1);
        const updatedUnlockedSectors = Array.from(
          new Set([...currentUnlocked, ...unlockedSectors, 1, nextSector])
        ).sort((a, b) => a - b);

        const { error: profileErr } = await supabaseAdmin.from("profiles").upsert(
          {
            id: validUserId,
            x_username: username,
            x_avatar_url: avatarUrl,
            is_guest: Boolean(isGuest),
            unlocked_sectors: updatedUnlockedSectors,
            ...(zcashAddress ? { zcash_address: zcashAddress } : {}),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        if (!profileErr) {
          const { error: scoreErr } = await supabaseAdmin.from("chapter_scores").insert({
            user_id: validUserId,
            chapter: sectorNum,
            points: pointsNum,
            duration_ms: durationNum,
          });

          if (!scoreErr) {
            isLiveSupabase = true;
            const { data: userStanding } = await supabaseAdmin
              .from("leaderboard")
              .select("rank, total_points, chapters_cleared, best_time_ms")
              .eq("user_id", validUserId)
              .maybeSingle();
            standing = userStanding;
          }
        }
      } catch (err: any) {
        console.warn("Supabase leaderboard POST exception:", err?.message);
      }
    }

    devMockStore.recordScore({
      userId: validUserId,
      username,
      avatarUrl,
      isGuest: Boolean(isGuest),
      chapter: sectorNum,
      points: pointsNum,
      durationMs: durationNum,
      unlockedSectors,
    });

    return NextResponse.json({
      success: true,
      isLiveSupabase,
      userId: validUserId,
      rank: standing?.rank ? Number(standing.rank) : null,
      totalPoints: standing?.total_points ? Number(standing.total_points) : pointsNum,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to record leaderboard telemetry." },
      { status: 500 }
    );
  }
}
