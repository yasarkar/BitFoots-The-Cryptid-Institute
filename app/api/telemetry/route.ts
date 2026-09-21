import { NextResponse } from "next/server";
import {
  supabaseAdmin,
  isSupabaseAnyConfigured,
  devMockStore,
} from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export interface TelemetrySighting {
  id: string;
  hunter: string;
  avatarUrl: string;
  chapter: number;
  sectorCode: string;
  sectorName: string;
  points: number;
  durationMs: number;
  type: "clearance" | "silhouette" | "trace";
  createdAt: string;
  message: string;
}

export interface TelemetryData {
  success: boolean;
  isLiveSupabase: boolean;
  onlineHuntersEstimate: number;
  btcBlock: string;
  zkStatus: string;
  apexRecord: {
    name: string;
    time: string;
    points: number;
    chaptersCleared: number;
  };
  recentSightings: TelemetrySighting[];
  serverTime: string;
}

const SECTOR_NAMES: Record<number, { code: string; title: string }> = {
  1: { code: "S01", title: "Canopy Fog" },
  2: { code: "S02", title: "Abandoned Bunker" },
  3: { code: "S03", title: "Radio Tower" },
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}s`;
}

// Cached block height to avoid spamming external mempool on rapid reloads
let cachedBtcBlock: { height: string; fetchedAt: number } = {
  height: "968,034",
  fetchedAt: 0,
};

async function fetchCurrentBtcBlock(): Promise<string> {
  const now = Date.now();
  if (now - cachedBtcBlock.fetchedAt < 30000 && cachedBtcBlock.height) {
    return cachedBtcBlock.height;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch("https://mempool.space/api/blocks/tip/height", {
      signal: controller.signal,
      headers: { "User-Agent": "Bitfoots-Mini-App/1.0" },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const num = parseInt(text.trim(), 10);
      if (!isNaN(num) && num > 800000) {
        cachedBtcBlock = {
          height: num.toLocaleString("en-US"),
          fetchedAt: now,
        };
        return cachedBtcBlock.height;
      }
    }
  } catch {
    // Fallback attempt to blockstream.info if mempool times out
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("https://blockstream.info/api/blocks/tip/height", {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);
      if (res.ok) {
        const text = await res.text();
        const num = parseInt(text.trim(), 10);
        if (!isNaN(num) && num > 800000) {
          cachedBtcBlock = {
            height: num.toLocaleString("en-US"),
            fetchedAt: now,
          };
          return cachedBtcBlock.height;
        }
      }
    } catch {}
  }

  return cachedBtcBlock.height || "968,034";
}

export async function GET() {
  try {
    let rawScores: any[] = [];
    let isLiveSupabase = false;

    // 1. Fetch recent score logs
    if (isSupabaseAnyConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("chapter_scores")
          .select(
            "id, user_id, chapter, points, duration_ms, created_at, profiles(x_username, x_avatar_url)"
          )
          .order("created_at", { ascending: false })
          .limit(12);

        if (!error && data && data.length > 0) {
          rawScores = data;
          isLiveSupabase = true;
        } else {
          rawScores = devMockStore.getRecentScores(10);
        }
      } catch {
        rawScores = devMockStore.getRecentScores(10);
      }
    } else {
      rawScores = devMockStore.getRecentScores(10);
    }

    // 2. Map raw scores into rich telemetry sightings
    const recentSightings: TelemetrySighting[] = rawScores.map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const rawUsername = profile?.x_username || "Anonymous Hunter";
      const hunter = rawUsername.startsWith("@") ? rawUsername : `@${rawUsername}`;
      const avatarUrl = profile?.x_avatar_url || "/bitfoot-heads/bitfoot-head-01.png";
      const chapter = Number(row.chapter) || 1;
      const points = Number(row.points) || 0;
      const durationMs = Number(row.duration_ms) || 0;
      const sectorInfo = SECTOR_NAMES[chapter] || { code: `S0${chapter}`, title: `Sector ${chapter}` };

      let type: "clearance" | "silhouette" | "trace" = "clearance";
      let message = `${hunter} cleared ${sectorInfo.code} (${points} PTS)`;

      if (chapter === 1 && points >= 300) {
        type = "silhouette";
        message = `${hunter} spotted silhouette in ${sectorInfo.code}`;
      } else if (chapter === 3) {
        message = `${hunter} locked radio signal in ${sectorInfo.code}`;
      }

      return {
        id: row.id || `sighting_${Math.random().toString(36).substring(2, 9)}`,
        hunter,
        avatarUrl,
        chapter,
        sectorCode: sectorInfo.code,
        sectorName: sectorInfo.title,
        points,
        durationMs,
        type,
        createdAt: row.created_at || new Date().toISOString(),
        message,
      };
    });

    // 3. Fetch Apex Record
    let apexRecord = {
      name: "@SHADOW_AGENT",
      time: "00:48s",
      points: 340,
      chaptersCleared: 3,
    };

    if (isLiveSupabase && supabaseAdmin) {
      try {
        const { data: topRow } = await supabaseAdmin
          .from("leaderboard")
          .select("x_username, best_time_ms, total_points, chapters_cleared")
          .order("rank", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (topRow) {
          const rawName = topRow.x_username || "Apex Hunter";
          apexRecord = {
            name: rawName.startsWith("@") ? rawName : `@${rawName}`,
            time: formatDuration(Number(topRow.best_time_ms || 0)),
            points: Number(topRow.total_points || 0),
            chaptersCleared: Number(topRow.chapters_cleared || 0),
          };
        }
      } catch {}
    } else {
      const topMock = devMockStore.getLeaderboard()[0];
      if (topMock) {
        const rawName = topMock.x_username || "Apex Hunter";
        apexRecord = {
          name: rawName.startsWith("@") ? rawName : `@${rawName}`,
          time: formatDuration(Number(topMock.best_time_ms || 0)),
          points: Number(topMock.total_points || 0),
          chaptersCleared: Number(topMock.chapters_cleared || 0),
        };
      }
    }

    // 4. BTC Block Height
    const btcBlock = await fetchCurrentBtcBlock();

    // 5. Estimated Online Hunters
    // Base active field agents + dynamic variance
    const onlineHuntersEstimate = 38 + Math.floor((new Date().getUTCMinutes() % 10));

    const responseData: TelemetryData = {
      success: true,
      isLiveSupabase,
      onlineHuntersEstimate,
      btcBlock,
      zkStatus: "ZK OK",
      apexRecord,
      recentSightings,
      serverTime: new Date().toISOString(),
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to compile live field telemetry.",
      },
      { status: 500 }
    );
  }
}
