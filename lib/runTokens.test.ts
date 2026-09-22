import { describe, it, expect, beforeEach } from "vitest";
import { consumeRunToken, issueRunToken, __resetRunTokensForTests } from "./runTokens";

const MINUTE = 60 * 1000;

beforeEach(() => {
  __resetRunTokensForTests();
});

describe("run tokens", () => {
  it("verifies a freshly issued token and reports the server start time", () => {
    const now = Date.now();
    const token = issueRunToken(1, now);

    const result = consumeRunToken(token, 1, now + 15_000);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.issuedAt).toBe(now);
  });

  it("rejects a replayed token (SEC-4 anti-replay)", () => {
    const now = Date.now();
    const token = issueRunToken(2, now);

    expect(consumeRunToken(token, 2, now + 16_000).ok).toBe(true);

    const replay = consumeRunToken(token, 2, now + 16_500);
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.reason).toMatch(/already consumed/i);
  });

  it("rejects a token minted for another sector", () => {
    const now = Date.now();
    const token = issueRunToken(1, now);

    const result = consumeRunToken(token, 3, now + 15_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/does not match this sector/i);
  });

  it("rejects a tampered nonce or signature", () => {
    const now = Date.now();
    const token = issueRunToken(1, now);
    const [version, chapter, issuedAt, nonce, signature] = token.split(".");

    const tamperedNonce = `${version}.${chapter}.${issuedAt}.${nonce}x.${signature}`;
    const tamperedSignature = `${version}.${chapter}.${issuedAt}.${nonce}.${"0".repeat(signature.length)}`;
    const forgedChapter = `${version}.2.${issuedAt}.${nonce}.${signature}`;

    for (const candidate of [tamperedNonce, tamperedSignature, forgedChapter]) {
      const result = consumeRunToken(candidate, 1, now + 10_000);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/signature/i);
    }
  });

  it("rejects malformed tokens", () => {
    const now = Date.now();
    for (const candidate of [undefined, null, 42, "", "v1.1.2.3", "v2.1.1.abc.def", "v1.1.1.abc"]) {
      const result = consumeRunToken(candidate, 1, now);
      expect(result.ok).toBe(false);
    }

    const tooLong = issueRunToken(1, now) + "x".repeat(300);
    expect(consumeRunToken(tooLong, 1, now).ok).toBe(false);
  });

  it("rejects unknown tokens that are not in the store", () => {
    const now = Date.now();
    const token = issueRunToken(1, now);

    __resetRunTokensForTests();

    const result = consumeRunToken(token, 1, now + 5000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/unknown/i);
  });

  it("expires tokens after the TTL", () => {
    const now = Date.now();
    const token = issueRunToken(1, now - 11 * MINUTE);

    const result = consumeRunToken(token, 1, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/expired/i);
  });

  it("rejects tokens issued in the future", () => {
    const now = Date.now();
    const token = issueRunToken(1, now + MINUTE);

    const result = consumeRunToken(token, 1, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/not valid yet/i);
  });

  it("issues unique tokens for repeated runs", () => {
    const now = Date.now();
    const tokens = new Set(Array.from({ length: 25 }, () => issueRunToken(1, now)));
    expect(tokens.size).toBe(25);
  });
});
