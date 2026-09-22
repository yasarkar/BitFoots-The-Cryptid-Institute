import { NextRequest, NextResponse } from "next/server";
import { generateUuid, isValidUuid } from "@/lib/uuid";
import { assertJsonRequest, getClientKey, rateLimit } from "@/lib/apiGuard";
import { consumeRunToken } from "@/lib/runTokens";
import {
  computeChapterScore,
  countValidFootprints,
  getSectorConfig,
  isChapterId,
  nextSectorAfter,
  validateCompletionWindow,
  type ChapterId,
} from "@/lib/scoring";
import { supabaseAdmin, isSupabaseAnyConfigured, devMockStore } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export interface ChapterCompleteRequest {
  chapterId: number;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  zcashAddress?: string;
  isGuest?: boolean;
  /**
   * @deprecated SEC-4: client timestamps are no longer trusted. They remain
   * optional for payload compatibility; the authoritative duration is derived
   * from the server-issued `runToken`.
   */
  startTime?: number;
  endTime?: number;
  collectedIds: string[];
  foundSecretSilhouette?: boolean;
  gateAnswerIndex: number;
  /** Single-use token issued by `POST /api/chapter/start`. */
  runToken?: string;
}

const USERNAME_MAX_LENGTH = 40;
const AVATAR_URL_MAX_LENGTH = 512;
const ZCASH_ADDRESS_MAX_LENGTH = 128;
const FALLBACK_AVATAR_URL = "/bitfoot-heads/bitfoot-head-01.png";

function sanitizeUsername(value: unknown): string {
  if (typeof value !== "string") return "Guest_Hunter";
  const trimmed = value.trim().slice(0, USERNAME_MAX_LENGTH);
  return trimmed || "Guest_Hunter";
}

/** Only same-origin static paths and https URLs survive sanitisation. */
function sanitizeAvatarUrl(value: unknown): string {
  if (typeof value !== "string") return FALLBACK_AVATAR_URL;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > AVATAR_URL_MAX_LENGTH) return FALLBACK_AVATAR_URL;
  if (trimmed.includes("..") || trimmed.includes("\\")) return FALLBACK_AVATAR_URL;
  if (trimmed.startsWith("/") || trimmed.startsWith("https://")) return trimmed;
  return FALLBACK_AVATAR_URL;
}

function sanitizeZcashAddress(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > ZCASH_ADDRESS_MAX_LENGTH) return undefined;
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    // 0. Transport hardening: JSON only, size capped, rate limited.
    const guardError = assertJsonRequest(req);
    if (guardError) {
      return NextResponse.json({ success: false, error: guardError.error }, { status: guardError.status });
    }

    if (!rateLimit(getClientKey(req, "chapter-complete"), 30, 60_000)) {
      return NextResponse.json(
        { success: false, error: "Too many clearance submissions. Please slow down." },
        { status: 429 }
      );
    }

    const body: ChapterCompleteRequest | null = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Malformed clearance verification payload." },
        { status: 400 }
      );
    }

    const {
      chapterId: rawChapterId,
      userId: rawUserId,
      username,
      avatarUrl,
      zcashAddress,
      isGuest = true,
      collectedIds,
      foundSecretSilhouette = false,
      gateAnswerIndex,
      runToken,
    } = body;

    // 1. The sector must be one of the three real sectors (raw value, no coercion).
    if (!isChapterId(rawChapterId)) {
      return NextResponse.json(
        { success: false, error: "Invalid sector ID: only sectors 1-3 exist." },
        { status: 400 }
      );
    }

    const chapterId: ChapterId = rawChapterId;
    const sector = getSectorConfig(chapterId);

    // 2. Run token: proves the run started server-side and can only be used once.
    const tokenResult = consumeRunToken(runToken, chapterId);
    if (!tokenResult.ok) {
      return NextResponse.json(
        { success: false, error: tokenResult.reason, code: "RUN_TOKEN_REJECTED" },
        { status: 400 }
      );
    }

    const durationMs = Math.max(0, Date.now() - tokenResult.issuedAt);

    // 3. Anti-cheat completion window, measured entirely server side.
    const windowCheck = validateCompletionWindow(chapterId, durationMs);
    if (!windowCheck.ok) {
      return NextResponse.json({ success: false, error: windowCheck.error, durationMs }, { status: 400 });
    }

    // 4. Identity fields are sanitised before they ever reach the database.
    const validUserId = isValidUuid(rawUserId || "") ? (rawUserId as string) : generateUuid();
    const safeUsername = sanitizeUsername(username);
    const safeAvatarUrl = sanitizeAvatarUrl(avatarUrl);
    const safeZcashAddress = sanitizeZcashAddress(zcashAddress);
    const safeIsGuest = Boolean(isGuest);

    // 5. Scoring uses only server validated inputs (single source of truth).
    const validFootprintsCount = countValidFootprints(chapterId, collectedIds, sector.tracesRequired);

    const gateAnswerCorrect = Number(gateAnswerIndex) === sector.gateQuestion.correctAnswerIndex;

    const { breakdown, totalScore, timeElapsedSeconds } = computeChapterScore({
      chapterId,
      durationMs,
      validFootprintsCount,
      foundSecretSilhouette: foundSecretSilhouette === true,
      gateAnswerCorrect,
    });

    // 6. Progression: a validated clearance unlocks the next sector.
    const nextSector = nextSectorAfter(chapterId);
    let updatedUnlockedSectors: number[] = Array.from(new Set([1, nextSector])).sort((a, b) => a - b);
    let userRank: number | null = null;
    let totalUserPoints: number = totalScore;

    // 7. Persist the verified clearance and its score record.
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

        updatedUnlockedSectors = Array.from(new Set([...currentUnlocked, 1, nextSector])).sort(
          (a, b) => a - b
        );

        const { error: profileErr } = await supabaseAdmin.from("profiles").upsert(
          {
            id: validUserId,
            x_username: safeUsername,
            x_avatar_url: safeAvatarUrl,
            is_guest: safeIsGuest,
            unlocked_sectors: updatedUnlockedSectors,
            ...(safeZcashAddress ? { zcash_address: safeZcashAddress } : {}),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        if (profileErr) {
          throw new Error(profileErr.message);
        }

        const { error: scoreErr } = await supabaseAdmin.from("chapter_scores").insert({
          user_id: validUserId,
          chapter: chapterId,
          points: totalScore,
          duration_ms: durationMs,
        });

        if (scoreErr) {
          throw new Error(scoreErr.message);
        }

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
          username: safeUsername,
          avatarUrl: safeAvatarUrl,
          isGuest: safeIsGuest,
          chapter: chapterId,
          points: totalScore,
          durationMs,
          unlockedSectors: updatedUnlockedSectors,
        });
      }
    } else {
      devMockStore.recordScore({
        userId: validUserId,
        username: safeUsername,
        avatarUrl: safeAvatarUrl,
        isGuest: safeIsGuest,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An error occurred during score verification.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
