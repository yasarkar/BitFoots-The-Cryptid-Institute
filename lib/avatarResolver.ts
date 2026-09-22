/**
 * Safe avatar resolution for the OG score card (SEC-1).
 *
 * The previous implementation joined any client supplied string onto
 * `process.cwd()/public` and read it from disk, so
 * `?avatar=../../.env.local` exfiltrated server files into a public PNG, and
 * any URL was fetched server side (SSRF).
 *
 * Rules now enforced:
 *  - local paths must stay inside `/public`, use a conservative character set
 *    and may never contain `..` segments or backslashes;
 *  - remote avatars must be https and belong to a host allow-list, redirects
 *    are rejected and the response must be a bounded `image/*` payload;
 *  - inline data URIs must be `data:image/*;base64` and size capped.
 * Anything that fails validation falls back to the default BitFoot head.
 */

import fs from "fs";
import path from "path";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_DATA_URI_LENGTH = Math.ceil((MAX_AVATAR_BYTES * 4) / 3) + 64;
const MAX_LOCAL_PATH_LENGTH = 256;
const MAX_REMOTE_URL_LENGTH = 512;

const DATA_URI_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i;

/** Hosts we are willing to fetch avatar bytes from. */
export const REMOTE_AVATAR_HOST_ALLOWLIST: readonly string[] = [
  "pbs.twimg.com",
  "ton.twimg.com",
  "lh3.googleusercontent.com",
  "api.dicebear.com",
];

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const DEFAULT_HEAD_PUBLIC_PATH = "bitfoot-heads/bitfoot-head-01.png";

function mimeTypeForFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/png";
  }
}

/**
 * Maps a public path (`/bitfoot-heads/bitfoot-head-05.png`) to an absolute
 * file system path, or returns `null` when the path escapes `/public`.
 */
export function resolveLocalAvatarPath(requestedPath: string): string | null {
  if (typeof requestedPath !== "string") return null;

  const cleaned = requestedPath.trim();
  if (!cleaned || cleaned.length > MAX_LOCAL_PATH_LENGTH) return null;
  if (cleaned.includes("\\") || cleaned.includes("\0")) return null;

  const segments = cleaned.replace(/^\/+/, "").split("/");
  if (segments.length === 0) return null;

  for (const segment of segments) {
    if (!/^[A-Za-z0-9._-]+$/.test(segment)) return null;
    if (segment === "." || segment === "..") return null;
  }

  const target = path.resolve(PUBLIC_DIR, ...segments);
  if (!target.startsWith(PUBLIC_DIR + path.sep)) return null;

  try {
    const stat = fs.statSync(target);
    if (!stat.isFile() || stat.size === 0 || stat.size > MAX_AVATAR_BYTES) return null;
  } catch {
    return null;
  }

  return target;
}

/** Allows only https URLs on the avatar host allow-list. */
export function isAllowedRemoteAvatarUrl(rawUrl: string): boolean {
  if (typeof rawUrl !== "string") return false;
  const cleaned = rawUrl.trim();
  if (!cleaned || cleaned.length > MAX_REMOTE_URL_LENGTH) return false;

  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") return false;
  return REMOTE_AVATAR_HOST_ALLOWLIST.includes(parsed.hostname.toLowerCase());
}

function readFileAsDataUri(filePath: string): string | null {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length === 0 || buffer.length > MAX_AVATAR_BYTES) return null;
    return `data:${mimeTypeForFile(filePath)};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Default OG head, used whenever the requested avatar is rejected. */
export function readDefaultAvatarDataUri(): string {
  const defaultPath = path.resolve(PUBLIC_DIR, ...DEFAULT_HEAD_PUBLIC_PATH.split("/"));
  return readFileAsDataUri(defaultPath) ?? "";
}

async function fetchRemoteAvatarDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) return null;

    const mime = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!mime.startsWith("image/")) return null;

    const declaredLength = Number(res.headers.get("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_AVATAR_BYTES) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_AVATAR_BYTES) return null;

    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Resolves an avatar parameter into a self-contained base64 data URI so the OG
 * canvas never suffers CORS/taint issues. Never throws and never returns
 * content from outside the allowed sources.
 */
export async function getAvatarDataUri(avatarParam: string | null): Promise<string> {
  const fallback = readDefaultAvatarDataUri();

  if (!avatarParam) return fallback;

  const candidate = avatarParam.trim();
  if (!candidate) return fallback;

  if (candidate.startsWith("data:")) {
    if (candidate.length > MAX_DATA_URI_LENGTH) return fallback;
    return DATA_URI_PATTERN.test(candidate) ? candidate : fallback;
  }

  if (/^https?:\/\//i.test(candidate)) {
    if (!isAllowedRemoteAvatarUrl(candidate)) return fallback;
    const remote = await fetchRemoteAvatarDataUri(candidate);
    return remote ?? fallback;
  }

  const localPath = resolveLocalAvatarPath(candidate);
  if (!localPath) return fallback;

  return readFileAsDataUri(localPath) ?? fallback;
}
