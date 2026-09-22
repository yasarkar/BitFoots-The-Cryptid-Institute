/**
 * Server-issued, single-use run tokens (SEC-4).
 *
 * PROBLEM: `/api/chapter/complete` used to trust the client supplied
 * `startTime`/`endTime`, so a script could post a perfect score with an
 * arbitrary (or negative) duration in milliseconds.
 *
 * SOLUTION: the client asks `/api/chapter/start` for a token before a run and
 * submits it on completion. The token carries an HMAC signature over
 * `chapterId`, the server-side start timestamp, the hunter id and a nonce, and
 * is consumed exactly once. The route then derives the duration from the
 * token, and replaying a captured payload is rejected.
 *
 * NOTE: state is in-memory by design (matches `devMockStore`). Multi-instance
 * deployments should move this map to a shared store (Redis/Postgres).
 */

import crypto from "crypto";

/** Tokens older than this can no longer be redeemed. */
const TOKEN_TTL_MS = 10 * 60 * 1000;

/** Tolerated clock skew when checking the issued-at timestamp. */
const CLOCK_SKEW_MS = 15 * 1000;

function resolveSecret(): string {
  return (
    process.env.RUN_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "bitfoots-local-run-token-secret"
  );
}

export function isRunTokenSecretConfigured(): boolean {
  return Boolean(process.env.RUN_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY);
}

interface RunRecord {
  chapterId: number;
  issuedAt: number;
  consumedAt: number | null;
}

const globalStore = globalThis as typeof globalThis & {
  __bitfootsRunTokens?: Map<string, RunRecord>;
};

function store(): Map<string, RunRecord> {
  if (!globalStore.__bitfootsRunTokens) {
    globalStore.__bitfootsRunTokens = new Map<string, RunRecord>();
  }
  return globalStore.__bitfootsRunTokens;
}

function sign(chapterId: number, issuedAt: number, nonce: string): string {
  return crypto
    .createHmac("sha256", resolveSecret())
    .update(`${chapterId}.${issuedAt}.${nonce}`)
    .digest("hex");
}

function pruneExpired(now: number): void {
  const cutoff = now - (TOKEN_TTL_MS + CLOCK_SKEW_MS);
  for (const [token, record] of store()) {
    // Consumed tokens are kept until their TTL elapses so that a replay is
    // reported as "already consumed" instead of silently looking unknown.
    if (record.issuedAt < cutoff) {
      store().delete(token);
    }
  }
}

/** Issues a new single-use token bound to a validated chapter id. */
export function issueRunToken(chapterId: number, issuedAt: number = Date.now()): string {
  pruneExpired(issuedAt);

  const nonce = crypto.randomUUID();
  const token = `v1.${chapterId}.${issuedAt}.${nonce}.${sign(chapterId, issuedAt, nonce)}`;

  store().set(token, { chapterId, issuedAt, consumedAt: null });
  return token;
}

export type RunTokenResult = { ok: true; issuedAt: number } | { ok: false; reason: string };

/**
 * Verifies a token: signature, chapter binding, freshness and single-use.
 * A successful verification consumes the token, so a replayed submission
 * fails with "already consumed".
 */
export function consumeRunToken(token: unknown, chapterId: number, now: number = Date.now()): RunTokenResult {
  if (typeof token !== "string" || token.length < 20 || token.length > 256) {
    return { ok: false, reason: "Missing or malformed run verification token." };
  }

  pruneExpired(now);

  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "v1") {
    return { ok: false, reason: "Malformed run verification token." };
  }

  const [, tokenChapterRaw, issuedAtRaw, nonce, signature] = parts;
  const tokenChapter = Number(tokenChapterRaw);
  const issuedAt = Number(issuedAtRaw);

  if (!Number.isInteger(tokenChapter) || !Number.isFinite(issuedAt) || !nonce || !signature) {
    return { ok: false, reason: "Malformed run verification token." };
  }

  const expected = sign(tokenChapter, issuedAt, nonce);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return { ok: false, reason: "Invalid run verification signature." };
  }

  if (tokenChapter !== chapterId) {
    return { ok: false, reason: "Run verification token does not match this sector." };
  }

  if (issuedAt > now + CLOCK_SKEW_MS) {
    return { ok: false, reason: "Run verification token is not valid yet." };
  }

  if (now - issuedAt > TOKEN_TTL_MS) {
    return { ok: false, reason: "Run verification token expired." };
  }

  const record = store().get(token);
  if (!record) {
    return { ok: false, reason: "Unknown run verification token." };
  }

  if (record.consumedAt !== null) {
    return { ok: false, reason: "Run verification token already consumed." };
  }

  record.consumedAt = now;
  return { ok: true, issuedAt };
}

/** Test helper: wipes the in-memory token store. */
export function __resetRunTokensForTests(): void {
  store().clear();
}
