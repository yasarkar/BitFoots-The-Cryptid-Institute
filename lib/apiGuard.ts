/**
 * Shared API hardening helpers: JSON content-type enforcement, body size
 * limits and a lightweight in-memory rate limiter.
 *
 * NOTE: like `devMockStore`, the rate limiter is process local. It is enough
 * to blunt scripted spam on a single instance; production deployments behind
 * multiple instances should use a shared store (Redis/Upstash).
 */

import { MAX_JSON_BODY_BYTES } from "@/lib/scoring";

export interface ApiGuardError {
  status: number;
  error: string;
}

/**
 * Rejects non-JSON and oversized POST bodies before they reach `req.json()`.
 * Returns `null` when the request is acceptable.
 */
export function assertJsonRequest(req: Request): ApiGuardError | null {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();

  if (!contentType.includes("application/json")) {
    return { status: 415, error: "Unsupported media type: application/json required." };
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > MAX_JSON_BODY_BYTES) {
      return { status: 413, error: "Request payload too large." };
    }
  }

  return null;
}

/** Rejects a parsed payload that exceeds the size budget (no content-length case). */
export function assertPayloadSize(rawBody: string): ApiGuardError | null {
  if (Buffer.byteLength(rawBody, "utf8") > MAX_JSON_BODY_BYTES) {
    return { status: 413, error: "Request payload too large." };
  }
  return null;
}

interface BucketState {
  timestamps: number[];
}

const globalStore = globalThis as typeof globalThis & {
  __bitfootsRateBuckets?: Map<string, BucketState>;
};

function buckets(): Map<string, BucketState> {
  if (!globalStore.__bitfootsRateBuckets) {
    globalStore.__bitfootsRateBuckets = new Map<string, BucketState>();
  }
  return globalStore.__bitfootsRateBuckets;
}

/** Best-effort client identifier derived from proxy headers. */
export function getClientKey(req: Request, scope: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = (forwarded ? forwarded.split(",")[0] : realIp || "local").trim().toLowerCase();
  return `${scope}:${ip || "unknown"}`;
}

/**
 * Sliding-window limiter. Records the hit and returns `true` when the call is
 * allowed, `false` when the caller exceeded `max` hits inside `windowMs`.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const state = buckets().get(key) ?? { timestamps: [] };
  const windowStart = now - windowMs;

  state.timestamps = state.timestamps.filter((ts) => ts > windowStart);

  if (state.timestamps.length >= max) {
    buckets().set(key, state);
    return false;
  }

  state.timestamps.push(now);
  buckets().set(key, state);
  return true;
}

/** Test helper: wipes all rate-limit buckets. */
export function __resetRateLimitsForTests(): void {
  buckets().clear();
}
