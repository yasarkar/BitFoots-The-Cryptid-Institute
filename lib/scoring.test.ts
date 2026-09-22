import { describe, it, expect } from "vitest";
import {
  computeChapterScore,
  computeSpeedBonus,
  countValidFootprints,
  DURATION_GRACE_MS,
  getSectorConfig,
  isChapterId,
  nextSectorAfter,
  sanitizeUnlockedSectors,
  validateCompletionWindow,
} from "./scoring";

describe("isChapterId", () => {
  it("accepts the three real sectors", () => {
    expect(isChapterId(1)).toBe(true);
    expect(isChapterId(2)).toBe(true);
    expect(isChapterId(3)).toBe(true);
  });

  it("rejects out-of-range, fractional and non-numeric sector ids (SEC-4)", () => {
    expect(isChapterId(0)).toBe(false);
    expect(isChapterId(4)).toBe(false);
    expect(isChapterId(99)).toBe(false);
    expect(isChapterId(-1)).toBe(false);
    expect(isChapterId(1.5)).toBe(false);
    expect(isChapterId("1")).toBe(false);
    expect(isChapterId(NaN)).toBe(false);
    expect(isChapterId(undefined)).toBe(false);
    expect(isChapterId(null)).toBe(false);
  });
});

describe("countValidFootprints", () => {
  it("counts only allow-listed, unique trace ids", () => {
    expect(countValidFootprints(1, ["fp_1", "fp_2", "fp_2", "fp_99", "ch3_fp_1"], 8)).toBe(2);
  });

  it("caps the count at the sector requirement", () => {
    const forged = Array.from({ length: 40 }, (_, i) => `fp_${i + 1}`).filter((id) =>
      ["fp_1", "fp_2", "fp_3", "fp_4", "fp_5", "fp_6", "fp_7", "fp_8"].includes(id)
    );
    expect(countValidFootprints(1, forged, 8)).toBe(8);
    expect(countValidFootprints(2, ["ch2_fp_1", "ch2_fp_2", "ch2_fp_3"], 6)).toBe(3);
  });

  it("never mixes trace ids between sectors", () => {
    expect(countValidFootprints(2, ["fp_1", "fp_2", "fp_3"], 6)).toBe(0);
  });

  it("returns 0 for non-array payloads", () => {
    expect(countValidFootprints(1, undefined, 8)).toBe(0);
    expect(countValidFootprints(1, "fp_1,fp_2", 8)).toBe(0);
    expect(countValidFootprints(1, null, 8)).toBe(0);
    expect(countValidFootprints(1, ["fp_1", 42, {}, null], 8)).toBe(1);
  });
});

describe("computeSpeedBonus", () => {
  it("matches the documented tier boundaries", () => {
    expect(computeSpeedBonus(0)).toBe(100);
    expect(computeSpeedBonus(29_999)).toBe(100);
    expect(computeSpeedBonus(30_000)).toBe(60);
    expect(computeSpeedBonus(44_999)).toBe(60);
    expect(computeSpeedBonus(45_000)).toBe(30);
    expect(computeSpeedBonus(69_999)).toBe(30);
    expect(computeSpeedBonus(70_000)).toBe(0);
  });
});

describe("computeChapterScore", () => {
  it("scores a flawless sector 1 run", () => {
    const { breakdown, totalScore, timeElapsedSeconds } = computeChapterScore({
      chapterId: 1,
      durationMs: 20_000,
      validFootprintsCount: 8,
      foundSecretSilhouette: true,
      gateAnswerCorrect: true,
    });

    expect(breakdown).toEqual({
      footprintsScore: 80,
      validFootprintsCount: 8,
      silhouetteScore: 50,
      gateScore: 100,
      speedBonus: 100,
    });
    expect(totalScore).toBe(330);
    expect(timeElapsedSeconds).toBe(20);
  });

  it("awards 20 points per trace in sector 3", () => {
    const { breakdown, totalScore } = computeChapterScore({
      chapterId: 3,
      durationMs: 40_000,
      validFootprintsCount: 6,
      foundSecretSilhouette: false,
      gateAnswerCorrect: true,
    });

    expect(breakdown.footprintsScore).toBe(120);
    expect(breakdown.speedBonus).toBe(60);
    expect(totalScore).toBe(280);
  });

  it("never pays the silhouette bonus outside sector 1", () => {
    const { breakdown } = computeChapterScore({
      chapterId: 2,
      durationMs: 60_000,
      validFootprintsCount: 6,
      foundSecretSilhouette: true,
      gateAnswerCorrect: false,
    });

    expect(breakdown.silhouetteScore).toBe(0);
    expect(breakdown.gateScore).toBe(0);
    expect(breakdown.speedBonus).toBe(30);
  });

  it("scores zero footprints and gate when nothing was validated", () => {
    const { totalScore, breakdown } = computeChapterScore({
      chapterId: 1,
      durationMs: 90_000,
      validFootprintsCount: 0,
      foundSecretSilhouette: false,
      gateAnswerCorrect: false,
    });

    expect(totalScore).toBe(0);
    expect(breakdown.validFootprintsCount).toBe(0);
  });
});

describe("validateCompletionWindow", () => {
  it("accepts durations inside the sector window", () => {
    const sector = getSectorConfig(1);
    expect(validateCompletionWindow(1, sector.minCompletionSeconds * 1000)).toEqual({ ok: true });
    expect(validateCompletionWindow(1, 60_000)).toEqual({ ok: true });
  });

  it("rejects runs faster than the sector minimum", () => {
    const result = validateCompletionWindow(1, 2000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/too fast/i);
  });

  it("rejects runs beyond the time limit plus latency grace", () => {
    const sector = getSectorConfig(2);
    const justInTime = sector.timeLimitSeconds * 1000 + DURATION_GRACE_MS;
    expect(validateCompletionWindow(2, justInTime)).toEqual({ ok: true });

    const tooSlow = validateCompletionWindow(2, justInTime + 1);
    expect(tooSlow.ok).toBe(false);
    if (!tooSlow.ok) expect(tooSlow.error).toMatch(/exceeded its time limit/i);
  });

  it("rejects non-finite and non-positive durations", () => {
    expect(validateCompletionWindow(1, NaN).ok).toBe(false);
    expect(validateCompletionWindow(1, Infinity).ok).toBe(false);
    expect(validateCompletionWindow(1, 0).ok).toBe(false);
    expect(validateCompletionWindow(1, -5000).ok).toBe(false);
  });
});

describe("nextSectorAfter", () => {
  it("unlocks the following sector and caps at the final one", () => {
    expect(nextSectorAfter(1)).toBe(2);
    expect(nextSectorAfter(2)).toBe(3);
    expect(nextSectorAfter(3)).toBe(3);
  });
});

describe("sanitizeUnlockedSectors", () => {
  it("keeps only real sector ids, de-duplicates and always includes sector 1", () => {
    expect(sanitizeUnlockedSectors([3, 2, 2, 0, 4, "3", 2.5, null])).toEqual([1, 2, 3]);
    expect(sanitizeUnlockedSectors([])).toEqual([1]);
    expect(sanitizeUnlockedSectors(undefined)).toEqual([1]);
    expect(sanitizeUnlockedSectors("1,2,3")).toEqual([1]);
    expect(sanitizeUnlockedSectors([1, 2, 3, 3, 2, 1])).toEqual([1, 2, 3]);
  });
});
