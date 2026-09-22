import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const FALLBACK_AVATAR = "/bitfoot-heads/bitfoot-head-01.png";

vi.mock("@/lib/supabaseAdmin", () => {
  const upserts: Record<string, unknown>[] = [];
  (globalThis as unknown as { __profileUpserts: Record<string, unknown>[] }).__profileUpserts = upserts;

  return {
    supabaseAdmin: {
      from: () => ({
        upsert: async (record: Record<string, unknown>) => {
          upserts.push(record);
          return { error: null };
        },
      }),
    },
    isSupabaseAnyConfigured: true,
    devMockStore: {
      recordScore: () => {},
      getLeaderboard: () => [],
      getRecentScores: () => [],
    },
  };
});

function upsertedRecords(): Record<string, unknown>[] {
  return (globalThis as unknown as { __profileUpserts: Record<string, unknown>[] }).__profileUpserts;
}

function syncProfile(payload: unknown, contentType: string | null = "application/json") {
  const headers = new Headers();
  if (contentType) headers.set("content-type", contentType);

  return POST(
    new NextRequest("http://localhost:3000/api/profile", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
  );
}

beforeEach(() => {
  upsertedRecords().length = 0;
});

describe("POST /api/profile", () => {
  it("rejects invalid hunter ids (SEC-3)", async () => {
    const res = await syncProfile({ userId: "not-a-uuid", username: "Hacker" });
    expect(res.status).toBe(400);
    expect(upsertedRecords()).toHaveLength(0);
  });

  it("rejects payloads with no profile fields", async () => {
    const res = await syncProfile({ userId: "a0000000-0000-4000-8000-000000000001" });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/no profile fields/i);
  });

  it("rejects non-JSON requests", async () => {
    const res = await syncProfile({ userId: "a0000000-0000-4000-8000-000000000001" }, "text/plain");
    expect(res.status).toBe(415);
  });

  it("upserts a sanitised profile record", async () => {
    const userId = "a0000000-0000-4000-8000-000000000009";
    const res = await syncProfile({
      userId,
      username: `  ${"x".repeat(120)}  `,
      avatarUrl: "javascript:alert(1)",
      zcashAddress: "z".repeat(400),
      isGuest: "yes",
      unlockedSectors: [3, 3, 9, "2"],
    });

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toMatchObject({ success: true, isLiveSupabase: true, userId, unlockedSectors: [1, 3] });

    expect(upsertedRecords()).toHaveLength(1);
    const record = upsertedRecords()[0];
    expect(record.id).toBe(userId);
    expect(record.x_username).toHaveLength(40);
    expect(record.x_avatar_url).toBe(FALLBACK_AVATAR);
    expect(record.is_guest).toBe(true);
    expect(record.unlocked_sectors).toEqual([1, 3]);
    expect(record.zcash_address).toBeUndefined();
    expect(typeof record.updated_at).toBe("string");
  });

  it("keeps a valid https avatar url", async () => {
    const res = await syncProfile({
      userId: "a0000000-0000-4000-8000-000000000010",
      avatarUrl: "https://pbs.twimg.com/profile_images/1/avatar.jpg",
    });

    expect(res.status).toBe(200);
    expect(upsertedRecords()[0].x_avatar_url).toBe("https://pbs.twimg.com/profile_images/1/avatar.jpg");
  });

  it("persists isCustomAvatar flag when explicitly provided", async () => {
    const res = await syncProfile({
      userId: "a0000000-0000-4000-8000-000000000011",
      avatarUrl: "/bitfoot-heads/bitfoot-head-09.png",
      isCustomAvatar: true,
    });

    expect(res.status).toBe(200);
    expect(upsertedRecords()[0].x_avatar_url).toBe("/bitfoot-heads/bitfoot-head-09.png");
    expect(upsertedRecords()[0].is_custom_avatar).toBe(true);
  });

  it("persists a valid Zcash Unified Address of standard length (~213 chars)", async () => {
    const validUA = "u1" + "a".repeat(211); // Standard 213-char Unified Address
    const res = await syncProfile({
      userId: "a0000000-0000-4000-8000-000000000012",
      zcashAddress: validUA,
    });

    expect(res.status).toBe(200);
    expect(upsertedRecords()[0].zcash_address).toBe(validUA);
  });
});
