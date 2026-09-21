"use client";

import { useState, useEffect, useCallback } from "react";
import {
  supabase,
  signInWithTwitter,
  signInWithGoogle,
  signOutUser,
  isSupabaseConfigured,
} from "@/lib/supabaseClient";
import { gameEventBus } from "@/lib/eventBus";

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

function generateGuestUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getStoredClearances(): number[] {
  if (typeof window === "undefined") return [1];
  try {
    const raw = localStorage.getItem(CLEARANCES_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        return Array.from(new Set([1, ...arr.filter((n) => typeof n === "number")]));
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
          if (parsed && parsed.username && parsed.isLoggedIn) {
            let restoredAvatar = parsed.avatarUrl;
            if (!restoredAvatar || restoredAvatar.includes("dicebear")) {
              restoredAvatar = getDefaultBitfootAvatar(parsed.username || parsed.userId);
            }
            activeProfile = {
              userId: parsed.userId || generateGuestUuid(),
              username: parsed.username,
              avatarUrl: restoredAvatar,
              isGuest: parsed.isGuest ?? false,
              isLoggedIn: true,
              zcashAddress: parsed.zcashAddress || "",
              authProvider: parsed.authProvider || (parsed.isGuest ? "guest" : undefined),
              unlockedSectors: Array.isArray(parsed.unlockedSectors) && parsed.unlockedSectors.length > 0
                ? Array.from(new Set([...initialClearances, ...parsed.unlockedSectors]))
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
      const guestUuid = generateGuestUuid();
      const guestAvatar = getDefaultBitfootAvatar(guestUuid);
      setProfile({
        userId: guestUuid,
        username: "",
        avatarUrl: guestAvatar,
        isGuest: true,
        isLoggedIn: false,
        zcashAddress: "",
        authProvider: "guest",
        unlockedSectors: initialClearances,
      });
      gameEventBus.emit("AVATAR_CHANGED", { avatarUrl: guestAvatar });
    }

    // Check Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata;
          const username = extractUsername(userMeta, session.user.id);
          const avatarUrl = extractAvatar(userMeta, username);
          const rawProvider = session.user.app_metadata?.provider;
          const authProvider =
            rawProvider === "twitter" ? "twitter" : rawProvider === "google" ? "google" : undefined;

          const authProfile: HunterProfile = {
            userId: session.user.id,
            username,
            avatarUrl,
            isGuest: false,
            isLoggedIn: true,
            zcashAddress: (userMeta as any)?.zcash_address || "",
            authProvider,
            unlockedSectors: initialClearances,
          };
          setProfile(authProfile);
          gameEventBus.emit("AVATAR_CHANGED", { avatarUrl });
          try {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(authProfile));
          } catch {}
        }
        setLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            const userMeta = session.user.user_metadata;
            const username = extractUsername(userMeta, session.user.id);
            const avatarUrl = extractAvatar(userMeta, username);
            const rawProvider = session.user.app_metadata?.provider;
            const authProvider =
              rawProvider === "twitter" ? "twitter" : rawProvider === "google" ? "google" : undefined;

            const authProfile: HunterProfile = {
              userId: session.user.id,
              username,
              avatarUrl,
              isGuest: false,
              isLoggedIn: true,
              zcashAddress: (userMeta as any)?.zcash_address || "",
              authProvider,
              unlockedSectors: initialClearances,
            };
            setProfile(authProfile);
            gameEventBus.emit("AVATAR_CHANGED", { avatarUrl });
            try {
              localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(authProfile));
            } catch {}
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);


  const setCustomUsername = useCallback((name: string) => {
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

      if (isSupabaseConfigured && supabase && updated.userId) {
        supabase
          .from("profiles")
          .upsert(
            {
              id: updated.userId,
              x_username: updated.username,
              x_avatar_url: updated.avatarUrl,
              is_guest: updated.isGuest ?? false,
            },
            { onConflict: "id" }
          )
          .then(
            () => {},
            (err) => {
              console.error("Failed to sync new username to Supabase:", err);
            }
          );
      }

      return updated;
    });
  }, [isSupabaseConfigured]);

  const updateProfile = useCallback(
    (updates: { username?: string; avatarUrl?: string; zcashAddress?: string }) => {
      setProfile((prev) => {
        const nextUsername = updates.username !== undefined ? updates.username.trim() : prev.username;
        const nextAvatar = updates.avatarUrl !== undefined ? updates.avatarUrl : prev.avatarUrl;
        const nextZcash = updates.zcashAddress !== undefined ? updates.zcashAddress.trim() : prev.zcashAddress;

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

        if (isSupabaseConfigured && supabase && prev.userId) {
          supabase
            .from("profiles")
            .upsert(
              {
                id: prev.userId,
                x_username: nextUsername,
                x_avatar_url: nextAvatar,
                ...(nextZcash ? { zcash_address: nextZcash } : {}),
                is_guest: prev.isGuest ?? false,
              },
              { onConflict: "id" }
            )
            .then(
              () => {},
              (err) => {
                console.error("Failed to sync profile update to Supabase:", err);
              }
            );
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

    const newGuestUuid = generateGuestUuid();
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


  const unlockSector = useCallback((sectorId: number) => {

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

      return updated;
    });
  }, []);

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


