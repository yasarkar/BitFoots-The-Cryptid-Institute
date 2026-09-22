import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { __resetRateLimitsForTests } from "@/lib/apiGuard";
import { consumeRunToken, __resetRunTokensForTests } from "@/lib/runTokens";

function startRun(chapterId: unknown, contentType: string | null = "application/json") {
  const headers = new Headers();
  if (contentType) headers.set("content-type", contentType);

  return POST(
    new NextRequest("http://localhost:3000/api/chapter/start", {
      method: "POST",
      headers,
      body: JSON.stringify({ chapterId }),
    })
  );
}

beforeEach(() => {
  __resetRunTokensForTests();
  __resetRateLimitsForTests();
});

describe("POST /api/chapter/start", () => {
  it("issues a single-use token bound to the requested sector", async () => {
    const res = await startRun(1);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.chapterId).toBe(1);
    expect(isPositiveTimestamp(json.issuedAt)).toBe(true);

    const verification = consumeRunToken(json.runToken, 1, json.issuedAt + 1000);
    expect(verification.ok).toBe(true);
  });

  it("rejects sector ids outside 1-3", async () => {
    for (const chapterId of [0, 4, 99, "1", null]) {
      const res = await startRun(chapterId);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    }
  });

  it("rejects non-JSON requests", async () => {
    const res = await startRun(1, "application/x-www-form-urlencoded");
    expect(res.status).toBe(415);
  });

  it("rate limits token spam", async () => {
    let lastStatus = 200;
    for (let i = 0; i < 31; i += 1) {
      lastStatus = (await startRun(2)).status;
    }

    expect(lastStatus).toBe(429);
  });
});

export function isPositiveTimestamp(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
