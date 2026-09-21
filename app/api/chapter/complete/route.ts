import { NextRequest, NextResponse } from "next/server";
import { ChapterScoreBreakdown } from "@/lib/eventBus";
import {
  supabaseAdmin,
  isSupabaseAnyConfigured,
  devMockStore,
  isValidUuid,
} from "@/lib/supabaseAdmin";
import { SECTORS } from "@/game/config/sectors";

export interface ChapterCompleteRequest {
  chapterId: number;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  zcashAddress?: string;
  isGuest?: boolean;
  startTime: number;
  endTime: number;
  collectedIds: string[];
  foundSecretSilhouette?: boolean;
  gateAnswerIndex: number;
}

const ALLOWED_FOOTPRINTS: Record<number, Set<string>> = {
  1: new Set(["fp_1", "fp_2", "fp_3", "fp_4", "fp_5", "fp_6", "fp_7", "fp_8"]),
  2: new Set(["ch2_fp_1", "ch2_fp_2", "ch2_fp_3", "ch2_fp_4", "ch2_fp_5", "ch2_fp_6"]),
  3: new Set(["ch3_fp_1", "ch3_fp_2", "ch3_fp_3", "ch3_fp_4", "ch3_fp_5", "ch3_fp_6"]),
};

function generateFallbackUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: ChapterCompleteRequest = await req.json();
    const {
      chapterId = 1,
      userId: rawUserId,
      username = "Guest_Hunter",
      avatarUrl = "/bitfoot-heads/bitfoot-head-01.png",
      zcashAddress,
      isGuest = true,
      startTime,
      endTime,
      collectedIds,
      foundSecretSilhouette = false,
      gateAnswerIndex,
    } = body;

    // Ensure valid UUID format for PostgreSQL UUID column
    const validUserId = isValidUuid(rawUserId || "") ? (rawUserId as string) : generateFallbackUuid();

    // 1. Basic Validation
    if (!startTime || !endTime || typeof startTime !== "number" || typeof endTime !== "number") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid telemetry timestamp parameters.",
        },
        { status: 400 }
      );
    }

    const durationMs = endTime - startTime;
    const sectorConfig = SECTORS[chapterId] || SECTORS[1];
    const minFloorMs = 2000; // 2 seconds minimum floor to guard against instant script spam while allowing fast clears

    // 2. Anti-cheat minimum duration check
    if (durationMs < minFloorMs) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid clearance duration: Sector ${chapterId} survey telemetry is too fast (${Math.round(durationMs)}ms).`,
          durationMs,
        },
        { status: 400 }
      );
    }

    // 3. Footprints validation
    const rawIds = Array.isArray(collectedIds) ? collectedIds : [];
    const uniqueIds = Array.from(new Set(rawIds));
    const allowedSet = ALLOWED_FOOTPRINTS[chapterId] || ALLOWED_FOOTPRINTS[1];
    const maxFootprints = sectorConfig.tracesRequired || 6;

    const validFootprints = uniqueIds.filter((id) => allowedSet.has(id));
    const validFootprintsCount = Math.min(validFootprints.length, maxFootprints);

    const basePointPerTrace = chapterId === 3 ? 20 : 10;
    const footprintsScore = validFootprintsCount * basePointPerTrace;

    // 4. Secret Silhouette (Only in Sector 1)
    const silhouetteScore = chapterId === 1 && foundSecretSilhouette === true ? 50 : 0;

    // 5. Gate Verification Question Check
    const correctIndex = sectorConfig.gateQuestion.correctAnswerIndex;
    const gateScore = gateAnswerIndex === correctIndex ? 100 : 0;

    // 6. Speed Bonus
    let speedBonus = 0;
    if (durationMs < 30000) speedBonus = 100;
    else if (durationMs < 45000) speedBonus = 60;
    else if (durationMs < 70000) speedBonus = 30;

    // 7. Verified Total Score
    const totalScore = footprintsScore + silhouetteScore + gateScore + speedBonus;
    const timeElapsedSeconds = Math.round(durationMs / 1000);

    const breakdown: ChapterScoreBreakdown = {
      footprintsScore,
      validFootprintsCount,
      silhouetteScore,
      gateScore,
      speedBonus,
    };

    // Calculate progression: unlock next sector if legitimate clearance
    const nextSector = Math.min(3, chapterId + 1);
    let updatedUnlockedSectors: number[] = [1, nextSector];
    let userRank: number | null = null;
    let totalUserPoints: number = totalScore;

    // 8. Database Recording to Supabase
    if (isSupabaseAnyConfigured && supabaseAdmin) {
      try {
        // Fetch existing profile to preserve unlocked sectors
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("unlocked_sectors, highest_score")
          .eq("id", validUserId)
          .maybeSingle();

        const currentUnlocked: number[] = Array.isArray(existingProfile?.unlocked_sectors)
          ? existingProfile.unlocked_sectors
          : [1];

        updatedUnlockedSectors = Array.from(new Set([...currentUnlocked, 1, nextSector])).sort(
          (a, b) => a - b
        );

        // Upsert Profile with progress and latest call-sign
        await supabaseAdmin.from("profiles").upsert(
          {
            id: validUserId,
            x_username: username,
            x_avatar_url: avatarUrl,
            is_guest: isGuest,
            unlocked_sectors: updatedUnlockedSectors,
            ...(zcashAddress ? { zcash_address: zcashAddress } : {}),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        // Insert new clearance score record
        await supabaseAdmin.from("chapter_scores").insert({
          user_id: validUserId,
          chapter: chapterId,
          points: totalScore,
          duration_ms: durationMs,
        });

        // Query user's current standing from the leaderboard view
        const { data: standing } = await supabaseAdmin
          .from("leaderboard")
          .select("rank, total_points, chapters_cleared, best_time_ms")
          .eq("user_id", validUserId)
          .maybeSingle();

        if (standing) {
          userRank = standing.rank ? Number(standing.rank) : null;
          totalUserPoints = Number(standing.total_points || totalScore);
        }
      } catch (dbErr) {
        console.error("Supabase DB Save Exception:", dbErr);
        devMockStore.recordScore({
          userId: validUserId,
          username,
          avatarUrl,
          isGuest,
          chapter: chapterId,
          points: totalScore,
          durationMs,
          unlockedSectors: updatedUnlockedSectors,
        });
      }
    } else {
      devMockStore.recordScore({
        userId: validUserId,
        username,
        avatarUrl,
        isGuest,
        chapter: chapterId,
        points: totalScore,
        durationMs,
        unlockedSectors: updatedUnlockedSectors,
      });
    }

    return NextResponse.json({
      success: true,
      chapterId,
      totalScore,
      durationMs,
      timeElapsedSeconds,
      breakdown,
      unlockedSectors: updatedUnlockedSectors,
      userRank,
      totalUserPoints,
      userId: validUserId,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "An error occurred during score verification.",
      },
      { status: 500 }
    );
  }
}
