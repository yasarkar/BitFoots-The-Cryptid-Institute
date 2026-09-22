/**
 * Single source of truth for chapter scoring, anti-cheat windows and
 * server-side payload validation.
 *
 * SECURITY (SEC-4): the server MUST NOT trust client supplied timing or
 * progress payloads. Every rule that used to live inline inside the
 * `/api/chapter/complete` route now lives here so it can be unit tested and
 * reused by the run-token verifier.
 */

import { SECTORS } from "@/game/config/sectors";
import { ChapterScoreBreakdown } from "@/lib/eventBus";

/** Points awarded per validated trace, per sector. Sector 3 is the apex run. */
export const TRACE_POINTS_BY_CHAPTER: Record<number, number> = {
  1: 10,
  2: 10,
  3: 20,
};

export const SILHOUETTE_BONUS_POINTS = 50;
export const GATE_CORRECT_BONUS_POINTS = 100;

/** Speed bonus tiers, evaluated in order (fastest first). */
export const SPEED_BONUS_TIERS: ReadonlyArray<{ maxDurationMs: number; bonus: number }> = [
  { maxDurationMs: 30_000, bonus: 100 },
  { maxDurationMs: 45_000, bonus: 60 },
  { maxDurationMs: 70_000, bonus: 30 },
];

/**
 * Grace window added on top of `timeLimitSeconds` to absorb network latency
 * and the final frames of a legitimate run before rejecting the submission.
 */
export const DURATION_GRACE_MS = 5_000;

/** Serialized payload limit for JSON API routes (defense against body floods). */
export const MAX_JSON_BODY_BYTES = 16 * 1024;

/** Only these sectors exist. Anything else is a forged/desynced client. */
export const CHAPTER_IDS = [1, 2, 3] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

export function isChapterId(value: unknown): value is ChapterId {
  return typeof value === "number" && Number.isInteger(value) && CHAPTER_IDS.includes(value as ChapterId);
}

/**
 * Allow-list of legitimate footprint identifiers per sector.
 * Anything not present here is ignored entirely (never scored).
 */
export const ALLOWED_FOOTPRINTS: Record<number, ReadonlySet<string>> = {
  1: new Set(["fp_1", "fp_2", "fp_3", "fp_4", "fp_5", "fp_6", "fp_7", "fp_8"]),
  2: new Set(["ch2_fp_1", "ch2_fp_2", "ch2_fp_3", "ch2_fp_4", "ch2_fp_5", "ch2_fp_6"]),
  3: new Set(["ch3_fp_1", "ch3_fp_2", "ch3_fp_3", "ch3_fp_4", "ch3_fp_5", "ch3_fp_6"]),
};

export function getSectorConfig(chapterId: ChapterId) {
  return SECTORS[chapterId];
}

/**
 * Filters a client supplied id list down to unique, allow-listed entries and
 * caps it at the sector's `tracesRequired`. Duplicate and forged ids can never
 * inflate a score.
 */
export function countValidFootprints(
  chapterId: ChapterId,
  collectedIds: unknown,
  maxFootprints: number
): number {
  if (!Array.isArray(collectedIds)) return 0;

  const allowed = ALLOWED_FOOTPRINTS[chapterId];
  if (!allowed) return 0;

  const unique = new Set<string>();
  for (const id of collectedIds) {
    if (typeof id === "string" && allowed.has(id)) {
      unique.add(id);
    }
  }

  return Math.min(unique.size, Math.max(0, maxFootprints));
}

/** Speed bonus for a server-measured duration. */
export function computeSpeedBonus(durationMs: number): number {
  for (const tier of SPEED_BONUS_TIERS) {
    if (durationMs < tier.maxDurationMs) return tier.bonus;
  }
  return 0;
}

export interface ChapterScoreInput {
  chapterId: ChapterId;
  /** Duration MUST come from the server verified run token, never the client. */
  durationMs: number;
  validFootprintsCount: number;
  foundSecretSilhouette: boolean;
  gateAnswerCorrect: boolean;
}

export interface ChapterScoreResult {
  breakdown: ChapterScoreBreakdown;
  totalScore: number;
  timeElapsedSeconds: number;
}

export function computeChapterScore(input: ChapterScoreInput): ChapterScoreResult {
  const { chapterId, durationMs, validFootprintsCount, foundSecretSilhouette, gateAnswerCorrect } = input;

  const pointsPerTrace = TRACE_POINTS_BY_CHAPTER[chapterId] ?? 10;
  const footprintsScore = validFootprintsCount * pointsPerTrace;

  // The secret silhouette only exists in Sector 1.
  const silhouetteScore = chapterId === 1 && foundSecretSilhouette ? SILHOUETTE_BONUS_POINTS : 0;

  const gateScore = gateAnswerCorrect ? GATE_CORRECT_BONUS_POINTS : 0;
  const speedBonus = computeSpeedBonus(durationMs);

  const breakdown: ChapterScoreBreakdown = {
    footprintsScore,
    validFootprintsCount,
    silhouetteScore,
    gateScore,
    speedBonus,
  };

  return {
    breakdown,
    totalScore: footprintsScore + silhouetteScore + gateScore + speedBonus,
    timeElapsedSeconds: Math.round(durationMs / 1000),
  };
}

export type CompletionWindowResult = { ok: true } | { ok: false; error: string };

/**
 * Enforces the anti-cheat completion window using the server measured
 * duration: never faster than `minCompletionSeconds`, never slower than
 * `timeLimitSeconds` (+ small grace for latency).
 */
export function validateCompletionWindow(chapterId: ChapterId, durationMs: number): CompletionWindowResult {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return { ok: false, error: "Invalid clearance duration telemetry." };
  }

  const sector = getSectorConfig(chapterId);
  const minMs = sector.minCompletionSeconds * 1000;
  const maxMs = sector.timeLimitSeconds * 1000 + DURATION_GRACE_MS;

  if (durationMs < minMs) {
    return {
      ok: false,
      error: `Invalid clearance duration: Sector ${chapterId} survey telemetry is too fast (${Math.round(
        durationMs
      )}ms, minimum ${minMs}ms).`,
    };
  }

  if (durationMs > maxMs) {
    return {
      ok: false,
      error: `Invalid clearance duration: Sector ${chapterId} survey exceeded its time limit (${Math.round(
        durationMs
      )}ms, limit ${maxMs}ms).`,
    };
  }

  return { ok: true };
}

/**
 * Progression rule: clearing a sector unlocks the next one. Validated
 * `chapterId` means a forged sector can no longer jump the ladder.
 */
export function nextSectorAfter(chapterId: ChapterId): number {
  return Math.min(CHAPTER_IDS.length, chapterId + 1);
}

/**
 * Normalises a client supplied clearance list into the set of sector ids that
 * can actually be unlocked. Sector 1 is always open; anything outside 1-3 is
 * dropped, and duplicates are collapsed.
 */
export function sanitizeUnlockedSectors(value: unknown): number[] {
  const raw = Array.isArray(value) ? value : [];
  const valid = raw.filter((entry): entry is number => isChapterId(entry));
  return Array.from(new Set([1, ...valid])).sort((a, b) => a - b);
}
