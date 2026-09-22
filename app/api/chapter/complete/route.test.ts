import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { SECTORS } from "@/game/config/sectors";
import { generateUuid } from "@/lib/uuid";
import { __resetRateLimitsForTests } from "@/lib/apiGuard";
import { consumeRunToken, issueRunToken, __resetRunTokensForTests } from "@/lib/runTokens";
import { devMockStore } from "@/lib/supabaseAdmin";

// Force the in-memory store so the tests never touch a real Supabase project.
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: null,
  isSupabaseAnyConfigured: false,
  devMockStore: {
    recordScore: vi.fn(),
    getLeaderboard: vi.fn(() => []),
    getRecentScores: vi.fn(() => []),
  },
}));

const recordScore = devMockStore.recordScore as unknown as Mock;
const FALLBACK_AVATAR = "/bitfoot-heads/bitfoot-head-01.png";

type ChapterNumber = 1 | 2 | 3;

function traceIds(chapterId: ChapterNumber): string[] {
  const prefix = chapterId === 1 ? "fp_" : chapterId === 2 ? "ch2_fp_" : "ch3_fp_";
  return Array.from({ length: SECTORS[chapterId].tracesRequired }, (_, index) => `${prefix}${index + 1}`);
}

function buildPayload(overrides: Record<string, unknown> = {}) {
  return {
    chapterId: 1,
    userId: generateUuid(),
    username: "Test_Hunter",
    avatarUrl: "/bitfoot-heads/bitfoot-head-02.png",
    isGuest: true,
    collectedIds: traceIds(1),
    foundSecretSilhouette: true,
    gateAnswerIndex: SECTORS[1].gateQuestion.correctAnswerIndex,
    runToken: issueRunToken(1, Date.now() - 20_000),
    ...overrides,
  };
}

function submit(payload: unknown, contentType: string | null = "application/json") {
  const headers = new Headers();
  if (contentType) headers.set("content-type", contentType);

  return POST(
    new NextRequest("http://localhost:3000/api/chapter/complete", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  __resetRunTokensForTests();
  __resetRateLimitsForTests();
});

describe("POST /api/chapter/complete", () => {
  it("records a verified sector 1 clearance", async () => {
    const payload = buildPayload();
    const res = await submit(payload);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.totalScore).toBe(330);
    expect(json.timeElapsedSeconds).toBe(20);
    expect(json.breakdown).toEqual({
      footprintsScore: 80,
      validFootprintsCount: 8,
      silhouetteScore: 50,
      gateScore: 100,
      speedBonus: 100,
    });
    expect(json.unlockedSectors).toEqual([1, 2]);
    expect(json.userId).toBe(payload.userId);

    expect(recordScore).toHaveBeenCalledTimes(1);
    expect(recordScore.mock.calls[0][0]).toMatchObject({
      userId: payload.userId,
      chapter: 1,
      points: 330,
    });
  });

  it("ignores client supplied timestamps and uses the token's start time", async () => {
    const payload = buildPayload({
      startTime: 0,
      endTime: Number.MAX_SAFE_INTEGER,
      runToken: issueRunToken(1, Date.now() - 40_000),
    });

    const json = await (await submit(payload)).json();
    expect(json.success).toBe(true);
    expect(json.durationMs).toBeGreaterThanOrEqual(40_000);
    expect(json.durationMs).toBeLessThan(60_000);
    expect(json.breakdown.speedBonus).toBe(60);
  });

  it("rejects a submission without a run token", async () => {
    const res = await submit(buildPayload({ runToken: undefined }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.code).toBe("RUN_TOKEN_REJECTED");
    expect(recordScore).not.toHaveBeenCalled();
  });

  it("rejects a replayed run token (SEC-4 anti-replay)", async () => {
    const payload = buildPayload();

    expect((await submit(payload)).status).toBe(200);

    const replay = await submit(payload);
    const json = await replay.json();

    expect(replay.status).toBe(400);
    expect(json.error).toMatch(/already consumed/i);
    expect(recordScore).toHaveBeenCalledTimes(1);
  });

  it("rejects a forged run token", async () => {
    const [version, chapter, issuedAt, nonce] = issueRunToken(1).split(".");
    const forged = `${version}.${chapter}.${issuedAt}.${nonce}.${"f".repeat(64)}`;

    const json = await (await submit(buildPayload({ runToken: forged }))).json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/signature/i);
  });

  it("rejects sector ids outside the three real sectors", async () => {
    const json = await (await submit(buildPayload({ chapterId: 99 }))).json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/sectors 1-3/i);
    expect(recordScore).not.toHaveBeenCalled();
  });

  it("rejects instant completions", async () => {
    const payload = buildPayload({ runToken: issueRunToken(1, Date.now() - 500) });
    const json = await (await submit(payload)).json();

    expect(json.success).toBe(false);
    expect(json.error).toMatch(/too fast/i);
  });

  it("rejects runs that exceed the sector time limit", async () => {
    const payload = buildPayload({ runToken: issueRunToken(1, Date.now() - 180_000) });
    const json = await (await submit(payload)).json();

    expect(json.success).toBe(false);
    expect(json.error).toMatch(/exceeded its time limit/i);
  });

  it("only scores allow-listed trace ids and de-duplicates them", async () => {
    const payload = buildPayload({
      collectedIds: ["fake_1", "fp_1", "fp_1", "fp_2", "ch2_fp_1", 42, null],
    });

    const json = await (await submit(payload)).json();
    expect(json.success).toBe(true);
    expect(json.breakdown.validFootprintsCount).toBe(2);
    expect(json.breakdown.footprintsScore).toBe(20);
  });

  it("scores sector 3 traces at 20 points each and unlocks the final sector", async () => {
    const payload = buildPayload({
      chapterId: 3,
      collectedIds: traceIds(3),
      foundSecretSilhouette: true,
      gateAnswerIndex: SECTORS[3].gateQuestion.correctAnswerIndex,
      runToken: issueRunToken(3, Date.now() - 20_000),
    });

    const json = await (await submit(payload)).json();
    expect(json.success).toBe(true);
    expect(json.breakdown.footprintsScore).toBe(120);
    expect(json.breakdown.silhouetteScore).toBe(0);
    expect(json.totalScore).toBe(320);
    expect(json.unlockedSectors).toEqual([1, 3]);
  });

  it("awards no gate bonus for a wrong answer but still records the run", async () => {
    const wrongIndex = (SECTORS[1].gateQuestion.correctAnswerIndex + 1) % 4;
    const json = await (await submit(buildPayload({ gateAnswerIndex: wrongIndex }))).json();

    expect(json.success).toBe(true);
    expect(json.breakdown.gateScore).toBe(0);
    expect(json.totalScore).toBe(230);
    expect(recordScore).toHaveBeenCalledTimes(1);
  });

  it("rejects non-JSON submissions with 415", async () => {
    const res = await submit(buildPayload(), "text/plain");
    expect(res.status).toBe(415);
    expect(recordScore).not.toHaveBeenCalled();
  });

  it("sanitises identity fields before they reach the store", async () => {
    const json = await (
      await submit(
        buildPayload({
          userId: "not-a-uuid",
          username: "x".repeat(120),
          avatarUrl: "javascript:alert(1)",
          zcashAddress: "z".repeat(400),
        })
      )
    ).json();

    expect(json.success).toBe(true);
    expect(json.userId).toMatch(/^[0-9a-f-]{36}$/);

    const recorded = recordScore.mock.calls[0][0];
    expect(recorded.username).toHaveLength(40);
    expect(recorded.avatarUrl).toBe(FALLBACK_AVATAR);
  });

  it("consumes the run token even after a successful submission", async () => {
    const token = issueRunToken(1, Date.now() - 20_000);
    expect((await submit(buildPayload({ runToken: token }))).status).toBe(200);

    const secondUse = consumeRunToken(token, 1, Date.now());
    expect(secondUse.ok).toBe(false);
  });
});
