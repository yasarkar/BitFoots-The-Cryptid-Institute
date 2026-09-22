"use client";

import { useState, useEffect, useCallback } from "react";
import {
  supabase,
  signInWithTwitter,
  signInWithGoogle,
  signOutUser,
  isSupabaseConfigured,
  fetchHunterProfile,
  saveHunterProgress,
  syncHunterProfile,
  isValidUuid,
} from "@/lib/supabaseClient";
import { gameEventBus } from "@/lib/eventBus";
import { generateUuid } from "@/lib/uuid";

export interface HunterProfile {
  userId: string;
  username: string;
  avatarUrl: string;
  isGuest: boolean;
  isLoggedIn: boolean;
  zcashAddress?: string;
  authProvider?: "google" | "twitter" | "guest";
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

export function useHunterSession() {
  const [profile, setProfile] = useState<HunterProfile>(() => ({
    userId: "",
    username: "",
    avatarUrl: "/bitfoot-heads/bitfoot-head-01.png",
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
              isGuest: parsed.isGuest ?? true,
              isLoggedIn: parsed.isLoggedIn ?? Boolean(parsed.username),
              zcashAddress: parsed.zcashAddress || "",
              authProvider: parsed.authProvider || (parsed.isGuest ? "guest" : undefined),
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
          const userMeta = session.user.user_metadata;
          const username = extractUsername(userMeta, session.user.id);
          const avatarUrl = extractAvatar(userMeta, username);
          const rawProvider = session.user.app_metadata?.provider;
          const authProvider =
            rawProvider === "twitter" || rawProvider === "x"
              ? "twitter"
              : rawProvider === "google"
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

          const authProfile: HunterProfile = {
            userId: session.user.id,
            username: cloudProfile?.x_username || username,
            avatarUrl: cloudProfile?.x_avatar_url || avatarUrl,
            isGuest: false,
            isLoggedIn: true,
            zcashAddress: cloudProfile?.zcash_address || (userMeta as any)?.zcash_address || "",
            authProvider,
            unlockedSectors: mergedSectors,
          };

          setProfile(authProfile);
          gameEventBus.emit("AVATAR_CHANGED", { avatarUrl: authProfile.avatarUrl });

          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(authProfile));
            localStorage.setItem(CLEARANCES_STORAGE_KEY, JSON.stringify(mergedSectors));
          } catch {}

          // Ensure Supabase has the latest merged clearances
          if (mergedSectors.length > cloudSectors.length) {
            saveHunterProgress(session.user.id, mergedSectors);
          }
        } else if (activeProfile?.userId && isValidUuid(activeProfile.userId)) {
          // If guest has existing progress in Supabase, load it
          fetchHunterProfile(activeProfile.userId).then((guestDbProfile) => {
            if (guestDbProfile) {
              const cloudSectors = Array.isArray(guestDbProfile.unlocked_sectors)
                ? guestDbProfile.unlocked_sectors
                : [];
              const merged = Array.from(
                new Set([...initialClearances, ...cloudSectors])
              ).sort((a, b) => a - b);
              setProfile((prev) => {
                const nextZcash = prev.zcashAddress || guestDbProfile.zcash_address || "";
                const nextUsername = prev.username || guestDbProfile.x_username || "";
                const nextAvatar = prev.avatarUrl || guestDbProfile.x_avatar_url || "";
                const updated: HunterProfile = {
                  ...prev,
                  unlockedSectors: merged,
                  zcashAddress: nextZcash,
                  username: nextUsername || prev.username,
                  avatarUrl: nextAvatar || prev.avatarUrl,
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
          const userMeta = session.user.user_metadata;
          const username = extractUsername(userMeta, session.user.id);
          const avatarUrl = extractAvatar(userMeta, username);
          const rawProvider = session.user.app_metadata?.provider;
          const authProvider =
            rawProvider === "twitter" || rawProvider === "x"
              ? "twitter"
              : rawProvider === "google"
                ? "google"
                : undefined;

          const cloudProfile = await fetchHunterProfile(session.user.id);
          const cloudSectors: number[] = Array.isArray(cloudProfile?.unlocked_sectors)
            ? cloudProfile.unlocked_sectors
            : [];

          const mergedSectors = Array.from(new Set([...getStoredClearances(), ...cloudSectors, 1])).sort(
            (a, b) => a - b
          );

          const authProfile: HunterProfile = {
            userId: session.user.id,
            username: cloudProfile?.x_username || username,
            avatarUrl: cloudProfile?.x_avatar_url || avatarUrl,
            isGuest: false,
            isLoggedIn: true,
            zcashAddress: cloudProfile?.zcash_address || (userMeta as any)?.zcash_address || "",
            authProvider,
            unlockedSectors: mergedSectors,
          };

          setProfile(authProfile);
          gameEventBus.emit("AVATAR_CHANGED", { avatarUrl: authProfile.avatarUrl });

          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(authProfile));
            localStorage.setItem(CLEARANCES_STORAGE_KEY, JSON.stringify(mergedSectors));
          } catch {}
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
          isGuest: false,
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
    (updates: { username?: string; avatarUrl?: string; zcashAddress?: string }) => {
      setProfile((prev) => {
        const nextUsername = updates.username !== undefined ? updates.username.trim() : prev.username;
        const nextAvatar = updates.avatarUrl !== undefined ? updates.avatarUrl : prev.avatarUrl;
        const nextZcash =
          updates.zcashAddress !== undefined ? updates.zcashAddress.trim() : prev.zcashAddress;

        const updated: HunterProfile = {
          ...prev,
          username: nextUsername || prev.username,
          avatarUrl: nextAvatar || prev.avatarUrl,
          zcashAddress: nextZcash,
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
    setCustomUsername,
    updateProfile,
    unlockSector,
    logout,
    isSupabaseConfigured,
  };
}
