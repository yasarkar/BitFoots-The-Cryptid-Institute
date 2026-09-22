import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const FALLBACK_AVATAR = "/bitfoot-heads/bitfoot-head-01.png";

type UpsertError = { code: string; message: string } | null;
type UpsertErrorFactory = (record: Record<string, unknown>) => UpsertError;

vi.mock("@/lib/supabaseAdmin", () => {
  const upserts: Record<string, unknown>[] = [];
  (globalThis as unknown as { __profileUpserts: Record<string, unknown>[] }).__profileUpserts = upserts;

  return {
    supabaseAdmin: {
      from: () => ({
        upsert: async (record: Record<string, unknown>) => {
          upserts.push(record);
          const errorFactory = (globalThis as unknown as { __profileUpsertError: UpsertErrorFactory | null })
            .__profileUpsertError;
          return { error: errorFactory ? errorFactory(record) : null };
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

/** Simulates a live database whose schema lags behind `supabase/schema.sql`. */
function setUpsertErrorFactory(factory: UpsertErrorFactory | null) {
  (globalThis as unknown as { __profileUpsertError: UpsertErrorFactory | null }).__profileUpsertError =
    factory;
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
  setUpsertErrorFactory(null);
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

  it("still stores the Zcash address when the live schema misses a column (schema drift)", async () => {
    // Reproduces the live database that has no `is_custom_avatar` column yet.
    setUpsertErrorFactory((record) =>
      "is_custom_avatar" in record
        ? { code: "42703", message: "column profiles.is_custom_avatar does not exist" }
        : null
    );

    const validUA = "u1" + "b".repeat(211);
    const res = await syncProfile({
      userId: "a0000000-0000-4000-8000-000000000013",
      username: "Shielded_Hunter",
      zcashAddress: validUA,
      isCustomAvatar: true,
    });

    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      success: true,
      isLiveSupabase: true,
      droppedColumns: ["is_custom_avatar"],
    });

    // First attempt is rejected, the retry drops the unknown column and keeps the address.
    expect(upsertedRecords()).toHaveLength(2);
    expect(upsertedRecords()[0].is_custom_avatar).toBe(true);
    expect(upsertedRecords()[1].is_custom_avatar).toBeUndefined();
    expect(upsertedRecords()[1].zcash_address).toBe(validUA);
    expect(upsertedRecords()[1].x_username).toBe("Shielded_Hunter");
  });

  it("fails loudly when the live schema rejects every supplied profile column", async () => {
    setUpsertErrorFactory((record) =>
      "zcash_address" in record
        ? { code: "42703", message: "column profiles.zcash_address does not exist" }
        : null
    );

    const res = await syncProfile({
      userId: "a0000000-0000-4000-8000-000000000014",
      zcashAddress: "u1" + "c".repeat(211),
    });

    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/schema/i);
    expect(json.error).toMatch(/zcash_address/);
  });

  it("reports a refused server key instead of hiding it behind a generic failure", async () => {
    setUpsertErrorFactory(() => ({ code: "401", message: "Invalid API key" }));

    const res = await syncProfile({
      userId: "a0000000-0000-4000-8000-000000000015",
      zcashAddress: "u1" + "d".repeat(211),
    });

    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.error).toMatch(/server key/i);
    expect(json.details).toBe("Invalid API key");
  });
});
