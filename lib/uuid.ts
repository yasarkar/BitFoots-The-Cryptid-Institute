/**
 * Shared UUID helpers.
 *
 * Single source of truth: previously this logic was duplicated in
 * `app/api/chapter/complete/route.ts`, `app/api/leaderboard/route.ts`,
 * `game/scenes/BaseSectorScene.ts`, `hooks/useHunterSession.ts`,
 * `lib/supabaseClient.ts` and `lib/supabaseAdmin.ts`.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a string is a valid UUID (v1-v5) format
 */
export function isValidUuid(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  return UUID_REGEX.test(str);
}

/**
 * Generates a random UUID v4 (crypto.randomUUID is unavailable in some
 * legacy embedded webviews this mini-app targets, so we keep the manual
 * template approach).
 */
export function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
