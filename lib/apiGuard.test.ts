import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  assertJsonRequest,
  assertPayloadSize,
  getClientKey,
  rateLimit,
  __resetRateLimitsForTests,
} from "./apiGuard";
import { MAX_JSON_BODY_BYTES } from "./scoring";

function requestWithHeaders(headers: Record<string, string>): Request {
  return { headers: new Headers(headers) } as unknown as Request;
}

beforeEach(() => {
  __resetRateLimitsForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("assertJsonRequest", () => {
  it("accepts JSON content types with charset parameters", () => {
    expect(assertJsonRequest(requestWithHeaders({ "content-type": "application/json" }))).toBeNull();
    expect(
      assertJsonRequest(requestWithHeaders({ "content-type": "application/json; charset=utf-8" }))
    ).toBeNull();
  });

  it("rejects other and missing content types with 415", () => {
    for (const contentType of ["text/plain", "application/x-www-form-urlencoded", ""]) {
      const result = assertJsonRequest(requestWithHeaders({ "content-type": contentType }));
      expect(result?.status).toBe(415);
    }

    expect(assertJsonRequest(requestWithHeaders({}))?.status).toBe(415);
  });

  it("rejects declared bodies larger than the limit with 413", () => {
    const result = assertJsonRequest(
      requestWithHeaders({
        "content-type": "application/json",
        "content-length": String(MAX_JSON_BODY_BYTES + 1),
      })
    );
    expect(result?.status).toBe(413);
  });
});

describe("assertPayloadSize", () => {
  it("rejects oversized serialized payloads", () => {
    expect(assertPayloadSize("a".repeat(MAX_JSON_BODY_BYTES + 1))?.status).toBe(413);
  });

  it("accepts payloads within the budget", () => {
    expect(assertPayloadSize(JSON.stringify({ hello: "world" }))).toBeNull();
  });
});

describe("rateLimit", () => {
  it("allows up to the limit then blocks", () => {
    expect(rateLimit("scope:1.2.3.4", 3, 1000)).toBe(true);
    expect(rateLimit("scope:1.2.3.4", 3, 1000)).toBe(true);
    expect(rateLimit("scope:1.2.3.4", 3, 1000)).toBe(true);
    expect(rateLimit("scope:1.2.3.4", 3, 1000)).toBe(false);
  });

  it("tracks keys independently", () => {
    expect(rateLimit("a", 1, 1000)).toBe(true);
    expect(rateLimit("a", 1, 1000)).toBe(false);
    expect(rateLimit("b", 1, 1000)).toBe(true);
  });

  it("refills as the window slides", () => {
    vi.useFakeTimers();
    const start = Date.now();

    expect(rateLimit("scope:sliding", 1, 1000)).toBe(true);
    expect(rateLimit("scope:sliding", 1, 1000)).toBe(false);

    vi.setSystemTime(start + 1200);
    expect(rateLimit("scope:sliding", 1, 1000)).toBe(true);
  });
});

describe("getClientKey", () => {
  it("uses the first x-forwarded-for address", () => {
    const req = requestWithHeaders({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientKey(req, "chapter-start")).toBe("chapter-start:1.2.3.4");
  });

  it("falls back to x-real-ip and then to a local key", () => {
    expect(getClientKey(requestWithHeaders({ "x-real-ip": "9.9.9.9" }), "profile-sync")).toBe(
      "profile-sync:9.9.9.9"
    );
    expect(getClientKey(requestWithHeaders({}), "profile-sync")).toBe("profile-sync:local");
  });
});
