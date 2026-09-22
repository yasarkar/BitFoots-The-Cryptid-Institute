export interface IdentityDetails {
  xAvatar?: string;
  googleAvatar?: string;
  xUsername?: string;
  googleName?: string;
}

export type AvatarSource = "custom" | "x" | "google" | "default";

export interface ResolvedAvatar {
  avatarUrl: string;
  source: AvatarSource;
  isCustomAvatar: boolean;
}

/**
 * Parses user object from Supabase auth (identities and user_metadata)
 * to safely extract X (Twitter) and Google avatars and profile handles.
 */
export function extractIdentityDetails(user: any): IdentityDetails {
  let xAvatar: string | undefined;
  let googleAvatar: string | undefined;
  let xUsername: string | undefined;
  let googleName: string | undefined;

  // 1. Inspect user.identities
  if (Array.isArray(user?.identities)) {
    for (const identity of user.identities) {
      const provider = String(identity?.provider || "").toLowerCase();
      const data = identity?.identity_data;
      if (!data) continue;

      if (provider === "twitter" || provider === "x") {
        const candidate =
          data.avatar_url || data.profile_image_url_https || data.profile_image_url || data.picture;
        if (candidate && typeof candidate === "string" && !candidate.includes("dicebear")) {
          xAvatar = candidate;
        }
        if (data.user_name) {
          xUsername = data.user_name.startsWith("@") ? data.user_name : `@${data.user_name}`;
        } else if (data.preferred_username) {
          xUsername = data.preferred_username.startsWith("@")
            ? data.preferred_username
            : `@${data.preferred_username}`;
        }
      } else if (provider === "google") {
        const candidate = data.picture || data.avatar_url;
        if (candidate && typeof candidate === "string" && !candidate.includes("dicebear")) {
          googleAvatar = candidate;
        }
        if (data.full_name || data.name) {
          googleName = data.full_name || data.name;
        }
      }
    }
  }

  // 2. Fallback check in user.user_metadata if not found in identities
  const meta = user?.user_metadata;
  if (meta) {
    const metaAvatar = meta.avatar_url || meta.picture;
    if (metaAvatar && typeof metaAvatar === "string" && !metaAvatar.includes("dicebear")) {
      if (metaAvatar.includes("twimg.com")) {
        if (!xAvatar) xAvatar = metaAvatar;
      } else if (metaAvatar.includes("googleusercontent.com")) {
        if (!googleAvatar) googleAvatar = metaAvatar;
      } else {
        const rawProv = String(user?.app_metadata?.provider || "").toLowerCase();
        if (rawProv === "twitter" || rawProv === "x") {
          if (!xAvatar) xAvatar = metaAvatar;
        } else if (rawProv === "google") {
          if (!googleAvatar) googleAvatar = metaAvatar;
        }
      }
    }

    if (!xUsername && (meta.user_name || meta.preferred_username)) {
      const u = meta.user_name || meta.preferred_username;
      xUsername = u.startsWith("@") ? u : `@${u}`;
    }
    if (!googleName && (meta.full_name || meta.name)) {
      googleName = meta.full_name || meta.name;
    }
  }

  return { xAvatar, googleAvatar, xUsername, googleName };
}

export interface ResolveAvatarParams {
  isCustomAvatar?: boolean;
  customAvatarUrl?: string;
  xAvatar?: string;
  googleAvatar?: string;
  fallbackAvatar?: string;
}

/**
 * Resolves active avatar based on the system rules:
 * 1. If user explicitly chose a custom avatar from profile (`isCustomAvatar: true`),
 *    always preserve and use that custom avatar.
 * 2. If both X and Google are linked, prioritize X avatar.
 * 3. If Google is linked first and X is not, use Google avatar.
 * 4. If X is linked later, prioritize X avatar over Google.
 * 5. Fallback to default BitFoot character head.
 */
export function resolveActiveAvatar({
  isCustomAvatar,
  customAvatarUrl,
  xAvatar,
  googleAvatar,
  fallbackAvatar = "/bitfoot-heads/bitfoot-head-01.png",
}: ResolveAvatarParams): ResolvedAvatar {
  // 1. User custom profile selection takes precedence if flagged as custom
  if (isCustomAvatar && customAvatarUrl && customAvatarUrl.trim() !== "") {
    return {
      avatarUrl: customAvatarUrl,
      source: "custom",
      isCustomAvatar: true,
    };
  }

  // 2. Prioritize X (Twitter) avatar when available (both linked or X linked later)
  if (xAvatar && xAvatar.trim() !== "") {
    return {
      avatarUrl: xAvatar,
      source: "x",
      isCustomAvatar: false,
    };
  }

  // 3. Use Google avatar when only Google is linked
  if (googleAvatar && googleAvatar.trim() !== "") {
    return {
      avatarUrl: googleAvatar,
      source: "google",
      isCustomAvatar: false,
    };
  }

  // 4. Default fallback
  return {
    avatarUrl: fallbackAvatar,
    source: "default",
    isCustomAvatar: false,
  };
}
