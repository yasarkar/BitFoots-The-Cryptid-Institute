import { describe, it, expect } from "vitest";
import { extractIdentityDetails, resolveActiveAvatar } from "./avatarPriority";

describe("avatarPriority", () => {
  const GOOGLE_AVATAR = "https://lh3.googleusercontent.com/a/google-avatar-123";
  const X_AVATAR = "https://pbs.twimg.com/profile_images/x-avatar-456/photo.jpg";
  const CUSTOM_BITFOOT_AVATAR = "/bitfoot-heads/bitfoot-head-07.png";
  const DEFAULT_AVATAR = "/bitfoot-heads/bitfoot-head-01.png";

  describe("extractIdentityDetails", () => {
    it("extracts Google avatar from identities array", () => {
      const mockUser = {
        identities: [
          {
            provider: "google",
            identity_data: {
              picture: GOOGLE_AVATAR,
              full_name: "Google Hunter",
            },
          },
        ],
      };

      const details = extractIdentityDetails(mockUser);
      expect(details.googleAvatar).toBe(GOOGLE_AVATAR);
      expect(details.xAvatar).toBeUndefined();
      expect(details.googleName).toBe("Google Hunter");
    });

    it("extracts X (Twitter) avatar and username from identities array", () => {
      const mockUser = {
        identities: [
          {
            provider: "twitter",
            identity_data: {
              avatar_url: X_AVATAR,
              user_name: "ApexSeeker",
            },
          },
        ],
      };

      const details = extractIdentityDetails(mockUser);
      expect(details.xAvatar).toBe(X_AVATAR);
      expect(details.xUsername).toBe("@ApexSeeker");
      expect(details.googleAvatar).toBeUndefined();
    });

    it("extracts both X and Google avatars when both are linked", () => {
      const mockUser = {
        identities: [
          {
            provider: "google",
            identity_data: {
              picture: GOOGLE_AVATAR,
              full_name: "Dual Hunter",
            },
          },
          {
            provider: "x",
            identity_data: {
              avatar_url: X_AVATAR,
              user_name: "DualHunterX",
            },
          },
        ],
      };

      const details = extractIdentityDetails(mockUser);
      expect(details.googleAvatar).toBe(GOOGLE_AVATAR);
      expect(details.xAvatar).toBe(X_AVATAR);
      expect(details.xUsername).toBe("@DualHunterX");
    });

    it("falls back to user_metadata when identities array is not present", () => {
      const mockUser = {
        user_metadata: {
          avatar_url: X_AVATAR,
          user_name: "MetaHunter",
        },
      };

      const details = extractIdentityDetails(mockUser);
      expect(details.xAvatar).toBe(X_AVATAR);
      expect(details.xUsername).toBe("@MetaHunter");
    });
  });

  describe("resolveActiveAvatar", () => {
    it("selects Google avatar when user connects Google first (no X)", () => {
      const res = resolveActiveAvatar({
        googleAvatar: GOOGLE_AVATAR,
        xAvatar: undefined,
        isCustomAvatar: false,
        fallbackAvatar: DEFAULT_AVATAR,
      });

      expect(res.avatarUrl).toBe(GOOGLE_AVATAR);
      expect(res.source).toBe("google");
      expect(res.isCustomAvatar).toBe(false);
    });

    it("prioritizes X avatar when both X and Google are linked", () => {
      const res = resolveActiveAvatar({
        googleAvatar: GOOGLE_AVATAR,
        xAvatar: X_AVATAR,
        isCustomAvatar: false,
        fallbackAvatar: DEFAULT_AVATAR,
      });

      expect(res.avatarUrl).toBe(X_AVATAR);
      expect(res.source).toBe("x");
      expect(res.isCustomAvatar).toBe(false);
    });

    it("upgrades to X avatar if user connected Google first and X later", () => {
      // Prior active was Google, but now X is linked and user has not chosen a custom avatar
      const res = resolveActiveAvatar({
        customAvatarUrl: GOOGLE_AVATAR, // prior avatar recorded in DB
        isCustomAvatar: false, // not a custom profile choice
        googleAvatar: GOOGLE_AVATAR,
        xAvatar: X_AVATAR, // newly linked X
        fallbackAvatar: DEFAULT_AVATAR,
      });

      expect(res.avatarUrl).toBe(X_AVATAR);
      expect(res.source).toBe("x");
      expect(res.isCustomAvatar).toBe(false);
    });

    it("preserves custom profile avatar if user chose a custom avatar (even if both X and Google are linked)", () => {
      const res = resolveActiveAvatar({
        isCustomAvatar: true,
        customAvatarUrl: CUSTOM_BITFOOT_AVATAR,
        googleAvatar: GOOGLE_AVATAR,
        xAvatar: X_AVATAR,
        fallbackAvatar: DEFAULT_AVATAR,
      });

      expect(res.avatarUrl).toBe(CUSTOM_BITFOOT_AVATAR);
      expect(res.source).toBe("custom");
      expect(res.isCustomAvatar).toBe(true);
    });

    it("preserves custom profile avatar when user only has Google linked", () => {
      const res = resolveActiveAvatar({
        isCustomAvatar: true,
        customAvatarUrl: CUSTOM_BITFOOT_AVATAR,
        googleAvatar: GOOGLE_AVATAR,
        xAvatar: undefined,
      });

      expect(res.avatarUrl).toBe(CUSTOM_BITFOOT_AVATAR);
      expect(res.source).toBe("custom");
      expect(res.isCustomAvatar).toBe(true);
    });

    it("returns default fallback avatar when neither OAuth nor custom avatar exists", () => {
      const res = resolveActiveAvatar({
        isCustomAvatar: false,
        customAvatarUrl: undefined,
        googleAvatar: undefined,
        xAvatar: undefined,
        fallbackAvatar: DEFAULT_AVATAR,
      });

      expect(res.avatarUrl).toBe(DEFAULT_AVATAR);
      expect(res.source).toBe("default");
      expect(res.isCustomAvatar).toBe(false);
    });
  });
});
