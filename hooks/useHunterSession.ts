"use client";

import { useState, useEffect, useCallback } from "react";
import {
  supabase,
  signInWithTwitter,
  signInWithGoogle,
  linkTwitterIdentity,
  linkGoogleIdentity,
  signOutUser,
  isSupabaseConfigured,
  fetchHunterProfile,
  saveHunterProgress,
  syncHunterProfile,
  isValidUuid,
} from "@/lib/supabaseClient";
import { gameEventBus } from "@/lib/eventBus";
import { generateUuid } from "@/lib/uuid";
import {
  extractIdentityDetails,
  resolveActiveAvatar,
} from "@/lib/avatarPriority";

export interface HunterProfile {
  userId: string;
  username: string;
  avatarUrl: string;
  isCustomAvatar?: boolean;
  xAvatarUrl?: string;
  googleAvatarUrl?: string;
  isGuest: boolean;
  isLoggedIn: boolean;
  zcashAddress?: string;
  authProvider?: "google" | "twitter" | "guest";
  linkedProviders?: ("google" | "twitter" | "x")[];
  unlockedSectors: number[];
}

const GUEST_STORAGE_KEY = "bitfoot_hunter_guest_session";
const CLEARANCES_STORAGE_KEY = "bitfoot_hunter_unlocked_sectors";

function extractUsername(userMeta: any, userId: string): string {
  if (userMeta?.user_name) {
    return userMeta.user_name.startsWith("@") ? userMeta.user_name : `@${userMeta.user_name}`;
  }
  if (userMeta?.preferred_username) {
    return userMeta.preferred_username.startsWith("@")
      ? userMeta.preferred_username
      : `@${userMeta.preferred_username}`;
  }
  if (userMeta?.full_name) {
    return userMeta.full_name;
  }
  if (userMeta?.name) {
    return userMeta.name;
  }
  if (userMeta?.email) {
    return userMeta.email.split("@")[0];
  }
  return `Hunter_${userId.slice(0, 6)}`;
}

export function getDefaultBitfootAvatar(seed: string = "01"): string {
  if (!seed) return "/bitfoot-heads/bitfoot-head-01.png";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = (Math.abs(hash) % 18) + 1;
  const numStr = index.toString().padStart(2, "0");
  return `/bitfoot-heads/bitfoot-head-${numStr}.png`;
}

function extractAvatar(userMeta: any, fallbackSeed: string): string {
  if (userMeta?.avatar_url && !userMeta.avatar_url.includes("dicebear")) {
    return userMeta.avatar_url;
  }
  if (userMeta?.picture && !userMeta.picture.includes("dicebear")) {
    return userMeta.picture;
  }
  return getDefaultBitfootAvatar(fallbackSeed);
}

export function extractLinkedProviders(user: any): ("google" | "twitter" | "x")[] {
  const set = new Set<string>();
  if (Array.isArray(user?.app_metadata?.providers)) {
    user.app_metadata.providers.forEach((p: string) => set.add(String(p).toLowerCase()));
  }
  if (Array.isArray(user?.identities)) {
    user.identities.forEach((i: any) => {
      if (i?.provider) set.add(String(i.provider).toLowerCase());
    });
  }
  const rawProvider = user?.app_metadata?.provider;
  if (rawProvider) set.add(String(rawProvider).toLowerCase());

  const result: ("google" | "twitter" | "x")[] = [];
  if (set.has("google")) result.push("google");
  if (set.has("twitter") || set.has("x")) {
    result.push("twitter");
    result.push("x");
  }
  return Array.from(new Set(result));
}

function getStoredClearances(): number[] {
  if (typeof window === "undefined") return [1];
  try {
    const raw = localStorage.getItem(CLEARANCES_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        return Array.from(new Set([1, ...arr.filter((n) => typeof n === "number")])).sort((a, b) => a - b);
      }
    }
  } catch {}
  return [1];
}

async function buildAuthenticatedProfile(
  session: any,
  activeFallback?: HunterProfile | null,
  initialClearances: number[] = [1]
): Promise<{ authProfile: HunterProfile; cloudSectorsCount: number }> {
  const userMeta = session.user.user_metadata;
  const rawUsername = extractUsername(userMeta, session.user.id);
  const { xAvatar, googleAvatar, xUsername, googleName } = extractIdentityDetails(session.user);
  const linkedProviders = extractLinkedProviders(session.user);
  const rawProvider = session.user.app_metadata?.provider;
  const authProvider =
    rawProvider === "twitter" || rawProvider === "x" || linkedProviders.includes("twitter")
      ? "twitter"
      : rawProvider === "google" || linkedProviders.includes("google")
        ? "google"
        : undefined;

  // Fetch cloud progress from Supabase
  const cloudProfile = await fetchHunterProfile(session.user.id);
  const cloudSectors: number[] = Array.isArray(cloudProfile?.unlocked_sectors)
    ? cloudProfile.unlocked_sectors
    : [];

  const mergedSectors = Array.from(new Set([...initialClearances, ...cloudSectors, 1])).sort(
    (a, b) => a - b
  );

  const isCustomAvatar = Boolean(
    cloudProfile?.is_custom_avatar ?? activeFallback?.isCustomAvatar ?? false
  );

  const resolved = resolveActiveAvatar({
    isCustomAvatar,
    customAvatarUrl: cloudProfile?.x_avatar_url || activeFallback?.avatarUrl,
    xAvatar,
    googleAvatar,
    fallbackAvatar: getDefaultBitfootAvatar(session.user.id),
  });

  // Priority rule enforcement: If user did NOT choose a custom avatar and X avatar is available,
  // but cloud profile still has Google avatar (or older avatar), sync X avatar to Supabase.
  if (!resolved.isCustomAvatar && xAvatar && cloudProfile && cloudProfile.x_avatar_url !== xAvatar) {
    syncHunterProfile({
      userId: session.user.id,
      avatarUrl: xAvatar,
      isCustomAvatar: false,
    }).catch((e) => console.warn("Failed to sync X avatar priority upgrade:", e));
  }

  const effectiveZcash =
    cloudProfile?.zcash_address ||
    (userMeta as any)?.zcash_address ||
    activeFallback?.zcashAddress ||
    "";

  // If user has a local Zcash address that hasn't made it to cloudProfile yet, sync it to Supabase!
  if (!cloudProfile?.zcash_address && effectiveZcash && isValidUuid(session.user.id)) {
    syncHunterProfile({
      userId: session.user.id,
      zcashAddress: effectiveZcash,
    }).catch((e) => console.warn("Failed to sync zcash address to cloud:", e));
  }

  const authProfile: HunterProfile = {
    userId: session.user.id,
    username: cloudProfile?.x_username || xUsername || googleName || rawUsername,
    avatarUrl: resolved.avatarUrl,
    isCustomAvatar: resolved.isCustomAvatar,
    xAvatarUrl: xAvatar,
    googleAvatarUrl: googleAvatar,
    isGuest: false,
    isLoggedIn: true,
    zcashAddress: effectiveZcash,
    authProvider,
    linkedProviders,
    unlockedSectors: mergedSectors,
  };

  return { authProfile, cloudSectorsCount: cloudSectors.length };
}

export function useHunterSession() {
  const [profile, setProfile] = useState<HunterProfile>(() => ({
    userId: "",
    username: "",
    avatarUrl: "/bitfoot-heads/bitfoot-head-01.png",
    isCustomAvatar: false,
    isGuest: true,
    isLoggedIn: false,
    unlockedSectors: [1],
  }));
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize or restore session
  useEffect(() => {
    let activeProfile: HunterProfile | null = null;
    const initialClearances = getStoredClearances();

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(GUEST_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.username || parsed.zcashAddress || parsed.userId)) {
            let restoredAvatar = parsed.avatarUrl;
            if (!restoredAvatar || restoredAvatar.includes("dicebear")) {
              restoredAvatar = getDefaultBitfootAvatar(parsed.username || parsed.userId);
            }
            activeProfile = {
              userId: isValidUuid(parsed.userId) ? parsed.userId : generateUuid(),
              username: parsed.username || "",
              avatarUrl: restoredAvatar,
              isCustomAvatar: Boolean(parsed.isCustomAvatar),
              xAvatarUrl: parsed.xAvatarUrl,
              googleAvatarUrl: parsed.googleAvatarUrl,
              isGuest: parsed.isGuest ?? true,
              isLoggedIn: parsed.isLoggedIn ?? Boolean(parsed.username),
              zcashAddress: parsed.zcashAddress || "",
              authProvider: parsed.authProvider || (parsed.isGuest ? "guest" : undefined),
              linkedProviders: Array.isArray(parsed.linkedProviders) ? parsed.linkedProviders : undefined,
              unlockedSectors:
                Array.isArray(parsed.unlockedSectors) && parsed.unlockedSectors.length > 0
                  ? Array.from(new Set([...initialClearances, ...parsed.unlockedSectors])).sort(
                      (a, b) => a - b
                    )
                  : initialClearances,
            };
          }
        }
      } catch (err) {
        console.error("Failed to read session from localStorage:", err);
      }
    }

    if (activeProfile) {
      setProfile(activeProfile);
      gameEventBus.emit("AVATAR_CHANGED", { avatarUrl: activeProfile.avatarUrl });
    } else {
      const guestUuid = generateUuid();
      const guestAvatar = getDefaultBitfootAvatar(guestUuid);
      activeProfile = {
        userId: guestUuid,
        username: "",
        avatarUrl: guestAvatar,
        isCustomAvatar: false,
        isGuest: true,
        isLoggedIn: false,
        zcashAddress: "",
        authProvider: "guest",
        unlockedSectors: initialClearances,
      };
      setProfile(activeProfile);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(activeProfile));
        } catch (err) {
          console.error("Failed to save initial guest session:", err);
        }
      }
      gameEventBus.emit("AVATAR_CHANGED", { avatarUrl: guestAvatar });
    }

    // Synchronize profile and progress with Supabase
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const { authProfile, cloudSectorsCount } = await buildAuthenticatedProfile(
            session,
            activeProfile,
            initialClearances
          );

          setProfile(authProfile);
          gameEventBus.emit("AVATAR_CHANGED", { avatarUrl: authProfile.avatarUrl });

          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(authProfile));
            localStorage.setItem(CLEARANCES_STORAGE_KEY, JSON.stringify(authProfile.unlockedSectors));
          } catch {}

          if (authProfile.unlockedSectors.length > cloudSectorsCount) {
            saveHunterProgress(session.user.id, authProfile.unlockedSectors);
          }
        } else if (activeProfile?.userId && isValidUuid(activeProfile.userId)) {
          // If guest has existing progress in Supabase, load it
          fetchHunterProfile(activeProfile.userId).then((guestDbProfile) => {
            if (guestDbProfile) {
              const cloudSectors = Array.isArray(guestDbProfile.unlocked_sectors)
                ? guestDbProfile.unlocked_sectors
                : [];
              const merged = Array.from(new Set([...initialClearances, ...cloudSectors])).sort(
                (a, b) => a - b
              );
              setProfile((prev) => {
                const nextZcash = guestDbProfile.zcash_address || prev.zcashAddress || "";
                const nextUsername = prev.username || guestDbProfile.x_username || "";
                const nextAvatar = prev.avatarUrl || guestDbProfile.x_avatar_url || "";
                const updated: HunterProfile = {
                  ...prev,
                  unlockedSectors: merged,
                  zcashAddress: nextZcash,
                  username: nextUsername || prev.username,
                  avatarUrl: nextAvatar || prev.avatarUrl,
                  isCustomAvatar: guestDbProfile.is_custom_avatar ?? prev.isCustomAvatar,
                };
                try {
                  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
                  localStorage.setItem(CLEARANCES_STORAGE_KEY, JSON.stringify(merged));
                } catch {}
                return updated;
              });
            }
          });
        }
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          let latestFallback: HunterProfile | null = activeProfile;
          if (typeof window !== "undefined") {
            try {
              const stored = localStorage.getItem(GUEST_STORAGE_KEY);
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed) latestFallback = parsed;
              }
            } catch {}
          }

          const { authProfile, cloudSectorsCount } = await buildAuthenticatedProfile(
            session,
            latestFallback,
            getStoredClearances()
          );

          setProfile(authProfile);
          gameEventBus.emit("AVATAR_CHANGED", { avatarUrl: authProfile.avatarUrl });

          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(authProfile));
            localStorage.setItem(CLEARANCES_STORAGE_KEY, JSON.stringify(authProfile.unlockedSectors));
          } catch {}

          if (authProfile.unlockedSectors.length > cloudSectorsCount) {
            saveHunterProgress(session.user.id, authProfile.unlockedSectors);
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const setCustomUsername = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      setProfile((prev) => {
        const updated: HunterProfile = {
          ...prev,
          username: trimmed,
          avatarUrl:
            prev.avatarUrl && !prev.avatarUrl.includes("dicebear")
              ? prev.avatarUrl
              : getDefaultBitfootAvatar(trimmed),
          isGuest: prev.authProvider && prev.authProvider !== "guest" ? false : (prev.isGuest ?? true),
          isLoggedIn: true,
        };

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
          } catch (err) {
            console.error("Failed to save hunter session:", err);
          }
        }

        // SEC-3: profile writes go through the service-role API route (RLS hardened).
        if (isValidUuid(updated.userId)) {
          syncHunterProfile({
            userId: updated.userId,
            username: updated.username,
            avatarUrl: updated.avatarUrl,
            isGuest: updated.isGuest ?? false,
            unlockedSectors: updated.unlockedSectors,
          }).catch((err) => {
            console.error("Failed to sync new username to Supabase:", err);
          });
        }

        return updated;
      });
    },
    [isSupabaseConfigured]
  );

  const updateProfile = useCallback(
    (updates: {
      username?: string;
      avatarUrl?: string;
      isCustomAvatar?: boolean;
      zcashAddress?: string;
    }) => {
      setProfile((prev) => {
        const nextUsername = updates.username !== undefined ? updates.username.trim() : prev.username;
        const nextAvatar = updates.avatarUrl !== undefined ? updates.avatarUrl : prev.avatarUrl;
        const nextIsCustom =
          updates.isCustomAvatar !== undefined ? Boolean(updates.isCustomAvatar) : prev.isCustomAvatar;
        const nextZcash =
          updates.zcashAddress !== undefined ? updates.zcashAddress.trim() : prev.zcashAddress;

        const updated: HunterProfile = {
          ...prev,
          username: nextUsername || prev.username,
          avatarUrl: nextAvatar || prev.avatarUrl,
          isCustomAvatar: nextIsCustom,
          zcashAddress: nextZcash,
          isGuest: prev.authProvider && prev.authProvider !== "guest" ? false : (prev.isGuest ?? true),
          isLoggedIn: true,
        };

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
          } catch (err) {
            console.error("Failed to save hunter session:", err);
          }
        }

        // Notify in-game character of avatar update in real-time
        gameEventBus.emit("AVATAR_CHANGED", { avatarUrl: updated.avatarUrl });

        // SEC-3: profile writes go through the service-role API route (RLS hardened).
        if (isValidUuid(prev.userId)) {
          syncHunterProfile({
            userId: prev.userId,
            username: nextUsername,
            avatarUrl: nextAvatar,
            isCustomAvatar: nextIsCustom,
            zcashAddress: nextZcash || undefined,
            isGuest: prev.isGuest ?? false,
            unlockedSectors: prev.unlockedSectors,
          }).catch((err) => {
            console.error("Failed to sync profile update to Supabase:", err);
          });
        }

        return updated;
      });
    },
    [isSupabaseConfigured]
  );

  const loginWithX = useCallback(async () => {
    return await signInWithTwitter();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    return await signInWithGoogle();
  }, []);

  const linkX = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && profile.authProvider && profile.authProvider !== "guest") {
          const res = await linkTwitterIdentity();
          if (res?.error) {
            const errMsg = res.error.message?.toLowerCase() || "";
            if (
              errMsg.includes("bearer") ||
              errMsg.includes("unauthorized") ||
              (res.error as any)?.status === 401
            ) {
              return await signInWithTwitter();
            }
          }
          return res;
        }
      } catch (err) {
        console.warn("Session check error in linkX, falling back to sign-in:", err);
      }
    }
    return await signInWithTwitter();
  }, [profile.authProvider, isSupabaseConfigured]);

  const linkGoogle = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && profile.authProvider && profile.authProvider !== "guest") {
          const res = await linkGoogleIdentity();
          if (res?.error) {
            const errMsg = res.error.message?.toLowerCase() || "";
            if (
              errMsg.includes("bearer") ||
              errMsg.includes("unauthorized") ||
              (res.error as any)?.status === 401
            ) {
              return await signInWithGoogle();
            }
          }
          return res;
        }
      } catch (err) {
        console.warn("Session check error in linkGoogle, falling back to sign-in:", err);
      }
    }
    return await signInWithGoogle();
  }, [profile.authProvider, isSupabaseConfigured]);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await signOutUser();
      } catch (err) {
        console.error("Error signing out:", err);
      }
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } catch {}
    }

    const newGuestUuid = generateUuid();
    const guestAvatar = getDefaultBitfootAvatar(newGuestUuid);
    setProfile({
      userId: newGuestUuid,
      username: "",
      avatarUrl: guestAvatar,
      isCustomAvatar: false,
      isGuest: true,
      isLoggedIn: false,
      zcashAddress: "",
      authProvider: "guest",
      unlockedSectors: getStoredClearances(),
    });
    gameEventBus.emit("AVATAR_CHANGED", { avatarUrl: guestAvatar });
  }, [isSupabaseConfigured]);

  const unlockSector = useCallback(
    (sectorId: number) => {
      setProfile((prev) => {
        const current = prev.unlockedSectors || [1];
        if (current.includes(sectorId)) return prev;

        const nextUnlocked = Array.from(new Set([...current, sectorId])).sort((a, b) => a - b);
        const updated = {
          ...prev,
          unlockedSectors: nextUnlocked,
        };

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CLEARANCES_STORAGE_KEY, JSON.stringify(nextUnlocked));
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
          } catch {}
        }

        // Persist unlocked clearance to Supabase
        if (isSupabaseConfigured && isValidUuid(prev.userId)) {
          saveHunterProgress(prev.userId, nextUnlocked);
        }

        return updated;
      });
    },
    [isSupabaseConfigured]
  );

  return {
    profile,
    loading,
    loginWithX,
    loginWithGoogle,
    linkX,
    linkGoogle,
    setCustomUsername,
    updateProfile,
    unlockSector,
    logout,
    isSupabaseConfigured,
  };
}
