"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { gameEventBus } from "@/lib/eventBus";
import { TelemetrySighting, TelemetryData } from "@/app/api/telemetry/route";

interface UseFieldTelemetryOptions {
  currentUsername?: string;
  currentUserId?: string;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const past = new Date(dateStr).getTime();
    if (isNaN(past)) return "just now";
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - past) / 1000));

    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  } catch {
    return "just now";
  }
}

export function useFieldTelemetry(options: UseFieldTelemetryOptions = {}) {
  const { currentUsername, currentUserId } = options;

  const [onlineHunters, setOnlineHunters] = useState<number>(38);
  const [btcBlock, setBtcBlock] = useState<string>("968,034");
  const [zkStatus, setZkStatus] = useState<string>("ZK OK");
  const [apexRecord, setApexRecord] = useState<{
    name: string;
    time: string;
    points: number;
  }>({
    name: "@SHADOW_AGENT",
    time: "00:48s",
    points: 340,
  });

  const [sightings, setSightings] = useState<TelemetrySighting[]>([
    {
      id: "initial_1",
      hunter: "@satoshi_footprint",
      avatarUrl: "/bitfoot-heads/bitfoot-head-01.png",
      chapter: 1,
      sectorCode: "S01",
      sectorName: "Canopy Fog",
      points: 310,
      durationMs: 22400,
      type: "silhouette",
      createdAt: new Date(Date.now() - 45000).toISOString(),
      message: "@satoshi_footprint spotted silhouette in S01",
    },
    {
      id: "initial_2",
      hunter: "@pixel_stalker",
      avatarUrl: "/bitfoot-heads/bitfoot-head-02.png",
      chapter: 2,
      sectorCode: "S02",
      sectorName: "Abandoned Bunker",
      points: 290,
      durationMs: 26100,
      type: "clearance",
      message: "@pixel_stalker cleared S02 (290 PTS)",
      createdAt: new Date(Date.now() - 150000).toISOString(),
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastPacketTime, setLastPacketTime] = useState<Date>(new Date());
  const [hasNewApex, setHasNewApex] = useState<boolean>(false);
  const [relativeTimeTick, setRelativeTimeTick] = useState<number>(0);

  const broadcastChannelRef = useRef<any>(null);

  // 1. Initial & Refresh Fetch from /api/telemetry
  const fetchTelemetryData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/telemetry", { cache: "no-store" });
      if (res.ok) {
        const data: TelemetryData = await res.json();
        if (data.success) {
          if (data.btcBlock) setBtcBlock(data.btcBlock);
          if (data.zkStatus) setZkStatus(data.zkStatus);
          if (data.apexRecord) {
            setApexRecord((prev) => {
              if (
                prev.points !== data.apexRecord.points ||
                prev.name !== data.apexRecord.name
              ) {
                setHasNewApex(true);
                setTimeout(() => setHasNewApex(false), 3000);
              }
              return data.apexRecord;
            });
          }
          if (data.recentSightings && data.recentSightings.length > 0) {
            setSightings(data.recentSightings);
          }
          if (data.onlineHuntersEstimate) {
            setOnlineHunters((prev) => Math.max(prev, data.onlineHuntersEstimate));
          }
          setIsLive(Boolean(data.isLiveSupabase));
          setLastPacketTime(new Date());
        }
      }
    } catch (err) {
      console.warn("Field telemetry fetch error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 2. Initial Mount Fetch
  useEffect(() => {
    fetchTelemetryData();
  }, [fetchTelemetryData]);

  // 3. Periodic relative time ticker (every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTimeTick((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 4. Rotating Sighting Feed (every 6 seconds unless paused)
  useEffect(() => {
    if (isPaused || sightings.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sightings.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused, sightings.length]);

  // 5. Polling Bitcoin Block Tip every 35 seconds
  useEffect(() => {
    let isMounted = true;

    const pollBtc = async () => {
      try {
        const res = await fetch("https://mempool.space/api/blocks/tip/height", {
          cache: "no-store",
        });
        if (res.ok) {
          const text = await res.text();
          const num = parseInt(text.trim(), 10);
          if (!isNaN(num) && num > 800000 && isMounted) {
            const formatted = num.toLocaleString("en-US");
            setBtcBlock((prev) => {
              if (prev !== formatted) {
                setLastPacketTime(new Date());
              }
              return formatted;
            });
          }
        }
      } catch {}
    };

    const interval = setInterval(pollBtc, 35000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 6. Supabase Realtime Channels: Presence + Postgres Changes + Broadcast
  useEffect(() => {
    let presenceChannel: any = null;
    let scoresChannel: any = null;
    let broadcastChannel: any = null;
    let driftInterval: any = null;

    const baseCount = 36;

    if (isSupabaseConfigured && supabase) {
      try {
        const guestTag =
          currentUsername ||
          `hunter_${(currentUserId || Math.random().toString(36)).substring(0, 6)}`;

        // A. Presence Channel (Active Hunters)
        presenceChannel = supabase.channel("online-hunters", {
          config: { presence: { key: guestTag } },
        });

        presenceChannel
          .on("presence", { event: "sync" }, () => {
            const state = presenceChannel.presenceState();
            const realCount = Object.keys(state).length;
            setOnlineHunters(baseCount + Math.max(1, realCount));
            setIsLive(true);
            setLastPacketTime(new Date());
          })
          .subscribe(async (status: string) => {
            if (status === "SUBSCRIBED") {
              await presenceChannel.track({
                username: guestTag,
                online_at: new Date().toISOString(),
              });
              setIsLive(true);
            }
          });

        // B. Database Changes (Live Scores / Chapter Completions)
        scoresChannel = supabase
          .channel("live_telemetry_scores")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "chapter_scores",
            },
            async (payload: any) => {
              const newScore = payload.new;
              if (!newScore) return;

              setLastPacketTime(new Date());

              // Fetch username of the player who just scored
              let hunterName = "Operative";
              try {
                const { data: profileData } = await supabase!
                  .from("profiles")
                  .select("x_username, x_avatar_url")
                  .eq("id", newScore.user_id)
                  .maybeSingle();

                if (profileData?.x_username) {
                  hunterName = profileData.x_username.startsWith("@")
                    ? profileData.x_username
                    : `@${profileData.x_username}`;
                }
              } catch {}

              const chapter = Number(newScore.chapter) || 1;
              const points = Number(newScore.points) || 0;
              const sectorCode = `S0${chapter}`;

              const newSighting: TelemetrySighting = {
                id: newScore.id || `live_${Date.now()}`,
                hunter: hunterName,
                avatarUrl: "/bitfoot-heads/bitfoot-head-01.png",
                chapter,
                sectorCode,
                sectorName: `Sector ${chapter}`,
                points,
                durationMs: Number(newScore.duration_ms) || 0,
                type: points >= 300 ? "silhouette" : "clearance",
                createdAt: new Date().toISOString(),
                message:
                  points >= 300
                    ? `${hunterName} spotted silhouette in ${sectorCode}`
                    : `${hunterName} cleared ${sectorCode} (${points} PTS)`,
              };

              // Prepend to sightings stream
              setSightings((prev) => [newSighting, ...prev.slice(0, 14)]);
              setCurrentIndex(0); // Focus newly arrived telemetry

              // Re-fetch telemetry to refresh apex record
              fetchTelemetryData();
            }
          )
          .subscribe();

        // C. Broadcast Channel for Instant Cross-Client Sightings
        broadcastChannel = supabase.channel("live_field_telemetry");
        broadcastChannelRef.current = broadcastChannel;

        broadcastChannel
          .on("broadcast", { event: "sighting" }, (event: any) => {
            if (event.payload) {
              setSightings((prev) => [event.payload, ...prev.slice(0, 14)]);
              setCurrentIndex(0);
              setLastPacketTime(new Date());
            }
          })
          .subscribe();
      } catch (err) {
        console.warn("Telemetry realtime setup warning:", err);
      }
    } else {
      // Offline / Local organic drift
      driftInterval = setInterval(() => {
        setOnlineHunters((prev) => {
          const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
          return Math.min(48, Math.max(34, prev + delta));
        });
      }, 7000);
    }

    return () => {
      if (driftInterval) clearInterval(driftInterval);
      if (presenceChannel && supabase) supabase.removeChannel(presenceChannel);
      if (scoresChannel && supabase) supabase.removeChannel(scoresChannel);
      if (broadcastChannel && supabase) supabase.removeChannel(broadcastChannel);
      broadcastChannelRef.current = null;
    };
  }, [currentUsername, currentUserId, fetchTelemetryData]);

  // 7. Local In-Game Events from gameEventBus
  useEffect(() => {
    const handleSecret = (payload: any) => {
      const userTag = currentUsername || "@You";
      const newSighting: TelemetrySighting = {
        id: `local_secret_${Date.now()}`,
        hunter: userTag,
        avatarUrl: "/bitfoot-heads/bitfoot-head-01.png",
        chapter: 1,
        sectorCode: "S01",
        sectorName: "Canopy Fog",
        points: payload?.bonusScore || 50,
        durationMs: 0,
        type: "silhouette",
        createdAt: new Date().toISOString(),
        message: `${userTag} spotted anomaly silhouette in S01!`,
      };

      setSightings((prev) => [newSighting, ...prev.slice(0, 14)]);
      setCurrentIndex(0);
      setLastPacketTime(new Date());

      // Broadcast to other hunters if channel is live
      try {
        broadcastChannelRef.current?.send({
          type: "broadcast",
          event: "sighting",
          payload: newSighting,
        });
      } catch {}
    };

    const handleChapterFinished = (payload: any) => {
      if (!payload?.success) return;
      const userTag = currentUsername || "@You";
      const chapter = Number(payload.chapterId) || 1;
      const score = Number(payload.totalScore) || 0;
      const sectorCode = `S0${chapter}`;

      const newSighting: TelemetrySighting = {
        id: `local_clear_${Date.now()}`,
        hunter: userTag,
        avatarUrl: "/bitfoot-heads/bitfoot-head-01.png",
        chapter,
        sectorCode,
        sectorName: `Sector ${chapter}`,
        points: score,
        durationMs: Number(payload.durationMs) || 0,
        type: "clearance",
        createdAt: new Date().toISOString(),
        message: `${userTag} cleared ${sectorCode} (${score} PTS)`,
      };

      setSightings((prev) => [newSighting, ...prev.slice(0, 14)]);
      setCurrentIndex(0);
      setLastPacketTime(new Date());

      try {
        broadcastChannelRef.current?.send({
          type: "broadcast",
          event: "sighting",
          payload: newSighting,
        });
      } catch {}
    };

    gameEventBus.on("SECRET_DISCOVERED", handleSecret);
    gameEventBus.on("CHAPTER_FINISHED", handleChapterFinished);

    return () => {
      gameEventBus.off("SECRET_DISCOVERED", handleSecret);
      gameEventBus.off("CHAPTER_FINISHED", handleChapterFinished);
    };
  }, [currentUsername]);

  // Derived current sighting
  const currentSighting =
    sightings.length > 0
      ? sightings[Math.min(currentIndex, sightings.length - 1)]
      : null;

  // Formatted string with dynamically computed relative time
  const currentDispatchText = currentSighting
    ? `${currentSighting.message} (${formatRelativeTime(currentSighting.createdAt)})`
    : "@hunter_09 spotted silhouette in S01 (just now)";

  const nextSighting = () => {
    if (sightings.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % sightings.length);
    }
  };

  const prevSighting = () => {
    if (sightings.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + sightings.length) % sightings.length);
    }
  };

  return {
    onlineHunters,
    btcBlock,
    zkStatus,
    apexRecord,
    sightings,
    currentSighting,
    currentIndex,
    totalSightings: sightings.length,
    latestDispatch: currentDispatchText,
    isLive,
    isSyncing,
    lastPacketTime,
    hasNewApex,
    isPaused,
    setIsPaused,
    nextSighting,
    prevSighting,
    refreshTelemetry: fetchTelemetryData,
  };
}
