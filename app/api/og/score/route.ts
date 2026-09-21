import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Resolves avatar URL/path to a self-contained base64 data URI.
 * Guarantees zero CORS/taint issues on canvas export and full offline independence.
 */
async function getAvatarDataUri(avatarParam: string | null): Promise<string> {
  const defaultHeadPath = path.join(
    process.cwd(),
    "public",
    "bitfoot-heads",
    "bitfoot-head-01.png"
  );

  if (avatarParam) {
    const cleanAvatar = avatarParam.trim();
    if (cleanAvatar.startsWith("data:image/")) {
      return cleanAvatar;
    }

    if (cleanAvatar.startsWith("http://") || cleanAvatar.startsWith("https://")) {
      try {
        const res = await fetch(cleanAvatar, {
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const mime = res.headers.get("content-type") || "image/png";
          const buffer = Buffer.from(await res.arrayBuffer());
          return `data:${mime};base64,${buffer.toString("base64")}`;
        }
      } catch (err) {
        console.warn("Could not fetch remote avatar for OG card, falling back", err);
      }
    } else {
      // Local path e.g. /bitfoot-heads/bitfoot-head-05.png
      const sanitized = cleanAvatar.replace(/^\/+/, "");
      const fullPath = path.join(process.cwd(), "public", sanitized);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        return `data:image/png;base64,${buffer.toString("base64")}`;
      }
    }
  }

  // Fallback to authentic BitFoot head 01
  if (fs.existsSync(defaultHeadPath)) {
    const buffer = fs.readFileSync(defaultHeadPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }

  return "";
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const score = escapeXml(searchParams.get("score") || "0");
    const time = escapeXml(searchParams.get("time") || "0.0s");
    const chapter = searchParams.get("chapter") || "1";
    const rawUsername = searchParams.get("username") || "Cryptid_Hunter";
    const username = escapeXml(
      rawUsername.startsWith("@") ? rawUsername : `@${rawUsername}`
    );
    const avatarParam = searchParams.get("avatar");
    const uuidParam = escapeXml(searchParams.get("uuid") || "N/A");

    // Format UUID display
    const uuidDisplay =
      uuidParam !== "N/A" && uuidParam.length > 18
        ? `${uuidParam.slice(0, 8)}...${uuidParam.slice(-6)}`
        : uuidParam !== "N/A"
        ? uuidParam
        : "BF-ORD-7749-ZK";

    const defaultBadge =
      chapter === "3"
        ? "Apex Grand Hunter"
        : chapter === "2"
        ? "Grid Navigator"
        : "Forest Walker";

    const badge = escapeXml(searchParams.get("badge") || defaultBadge);

    const chapterTitle =
      chapter === "3"
        ? "SECTOR 03: SHIELDED ZK EXPEDITION"
        : chapter === "2"
        ? "SECTOR 02: 90° GEOMETRIC FOREST"
        : "SECTOR 01: FIRST TRACE EXPEDITION";

    // Retrieve avatar data URI
    const avatarDataUri = await getAvatarDataUri(avatarParam);

    // High resolution 1200x630 BitFoots Official Theme Card
    const svgContent = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Fonts -->
    <style>
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,500;0,700;1,400&amp;family=JetBrains+Mono:wght@400;600;800&amp;display=swap');

      .font-serif {
        font-family: 'IBM Plex Serif', Georgia, Cambria, serif;
      }
      .font-mono {
        font-family: 'JetBrains Mono', 'SF Mono', Monaco, Consolas, monospace;
      }
      .pixel-avatar {
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
    </style>

    <!-- Deep Forest Atmosphere Gradient -->
    <radialGradient id="bgAtmosphere" cx="50%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#192524" />
      <stop offset="35%" stop-color="#14171c" />
      <stop offset="80%" stop-color="#0d1014" />
      <stop offset="100%" stop-color="#080a0d" />
    </radialGradient>

    <!-- Top Moonlight Haze -->
    <radialGradient id="moonlight" cx="50%" cy="0%" r="60%">
      <stop offset="0%" stop-color="#b9c8eb" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#b9c8eb" stop-opacity="0" />
    </radialGradient>

    <!-- Signature Antique Gold Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f3c85f" />
      <stop offset="50%" stop-color="#eaba49" />
      <stop offset="100%" stop-color="#c19330" />
    </linearGradient>

    <!-- Warm Peach Parchment Gradient -->
    <linearGradient id="parchmentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#ffddcc" />
    </linearGradient>

    <!-- Card Divider Gradient -->
    <linearGradient id="dividerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#eaba49" stop-opacity="0" />
      <stop offset="50%" stop-color="#eaba49" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#eaba49" stop-opacity="0" />
    </linearGradient>

    <!-- Gold Glow Filter -->
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <!-- Subtle Drop Shadow for Panels -->
    <filter id="panelShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.65" />
    </filter>
  </defs>

  <!-- Base Canvas Background -->
  <rect width="1200" height="630" fill="url(#bgAtmosphere)" />
  <rect width="1200" height="630" fill="url(#moonlight)" />

  <!-- 90° Geometric Coordinate Grid Lines -->
  <g stroke="#243040" stroke-width="1" opacity="0.22">
    ${Array.from({ length: 41 }, (_, i) => `<line x1="${i * 30}" y1="0" x2="${i * 30}" y2="630" />`).join("")}
    ${Array.from({ length: 22 }, (_, i) => `<line x1="0" y1="${i * 30}" x2="1200" y2="${i * 30}" />`).join("")}
  </g>

  <!-- Distant Pine Forest Silhouette at Bottom -->
  <g opacity="0.35" fill="#090d12">
    <path d="M0,630 L0,510 L25,485 L50,510 L80,470 L110,510 L145,460 L180,510 L210,480 L240,510 L280,455 L320,510 L360,475 L400,510 L445,450 L490,510 L530,470 L570,510 L615,445 L660,510 L700,470 L740,510 L790,455 L840,510 L880,475 L920,510 L965,450 L1010,510 L1050,470 L1090,510 L1135,460 L1180,510 L1200,490 L1200,630 Z" />
  </g>

  <!-- Near Pine Layer for Depth -->
  <g opacity="0.22" fill="#05070a">
    <path d="M0,630 L0,540 L40,515 L80,540 L130,495 L180,540 L230,510 L280,540 L340,490 L400,540 L460,505 L520,540 L590,485 L660,540 L720,505 L780,540 L850,490 L920,540 L980,510 L1040,540 L1110,495 L1170,540 L1200,520 L1200,630 Z" />
  </g>

  <!-- Lurking Gold Eyes in the Dark Woods (Living World UI) -->
  <!-- Left Eye Pair -->
  <g filter="url(#goldGlow)" opacity="0.85">
    <circle cx="150" cy="515" r="3.5" fill="#eaba49" />
    <circle cx="163" cy="515" r="3.5" fill="#eaba49" />
  </g>
  <!-- Right Eye Pair -->
  <g filter="url(#goldGlow)" opacity="0.9">
    <circle cx="1060" cy="495" r="3.5" fill="#eaba49" />
    <circle cx="1073" cy="495" r="3.5" fill="#eaba49" />
  </g>
  <!-- Center Background Subtle Eye Pair -->
  <g opacity="0.6">
    <circle cx="890" cy="528" r="2.5" fill="#f3c85f" />
    <circle cx="900" cy="528" r="2.5" fill="#f3c85f" />
  </g>

  <!-- Outer Double Gold & Lead Border -->
  <rect x="24" y="24" width="1152" height="582" rx="6" fill="none" stroke="#eaba49" stroke-width="2" opacity="0.9" />
  <rect x="30" y="30" width="1140" height="570" rx="4" fill="none" stroke="#3a475c" stroke-width="1" opacity="0.75" />

  <!-- 90° Stepped Pixel Corner Brackets (Signature BitFoots Style) -->
  <!-- Top-Left Corner Bracket -->
  <path d="M24,44 L24,24 L44,24" fill="none" stroke="#f3c85f" stroke-width="4" />
  <rect x="32" y="32" width="6" height="6" fill="#eaba49" />
  <!-- Top-Right Corner Bracket -->
  <path d="M1176,44 L1176,24 L1156,24" fill="none" stroke="#f3c85f" stroke-width="4" />
  <rect x="1162" y="32" width="6" height="6" fill="#eaba49" />
  <!-- Bottom-Left Corner Bracket -->
  <path d="M24,586 L24,606 L44,606" fill="none" stroke="#f3c85f" stroke-width="4" />
  <rect x="32" y="592" width="6" height="6" fill="#eaba49" />
  <!-- Bottom-Right Corner Bracket -->
  <path d="M1176,586 L1176,606 L1156,606" fill="none" stroke="#f3c85f" stroke-width="4" />
  <rect x="1162" y="592" width="6" height="6" fill="#eaba49" />

  <!-- Border Telemetry Stamps -->
  <text x="54" y="20" class="font-mono" font-size="9" fill="#7d8898" letter-spacing="1.5">
    COORD: 47°36'22"N • 122°19'55"W // BITFOOTS CRYPTID TELEMETRY
  </text>
  <text x="1146" y="20" class="font-mono" font-size="9" fill="#7d8898" letter-spacing="1.5" text-anchor="end">
    EXPEDITION DOSSIER // AUTHENTIC VERIFIED RECORD
  </text>

  <!-- ==================== HEADER SECTION ==================== -->
  <!-- BitFoots Pixel Mark Ornament (.card__mark) at Top Center -->
  <g transform="translate(600, 48)">
    <line x1="-160" y1="0" x2="-22" y2="0" stroke="url(#dividerGrad)" stroke-width="1.5" />
    <line x1="22" y1="0" x2="160" y2="0" stroke="url(#dividerGrad)" stroke-width="1.5" />
    <!-- 8-Bit Gold Footprint Icon -->
    <g transform="translate(-8, -9) scale(0.9)" fill="#eaba49">
      <rect x="13" y="0" width="4" height="4" />
      <rect x="9" y="1" width="3" height="3" />
      <rect x="5" y="2" width="3" height="3" />
      <rect x="2" y="3" width="2" height="2" />
      <rect x="2" y="6" width="15" height="9" />
      <rect x="2" y="15" width="10" height="6" />
    </g>
  </g>

  <!-- Header Left: Brand & Chapter Info -->
  <g transform="translate(54, 62)">
    <!-- Golden Paw Emblem Icon Box -->
    <rect x="0" y="0" width="46" height="46" rx="4" fill="#1a1f26" stroke="#eaba49" stroke-width="1.5" />
    <g transform="translate(13, 11) scale(1.15)" fill="#f3c85f">
      <rect x="13" y="0" width="4" height="4" />
      <rect x="9" y="1" width="3" height="3" />
      <rect x="5" y="2" width="3" height="3" />
      <rect x="2" y="3" width="2" height="2" />
      <rect x="2" y="6" width="15" height="9" />
      <rect x="2" y="15" width="10" height="6" />
    </g>

    <!-- Main Title & Subtitle -->
    <text x="60" y="24" class="font-serif" font-size="25" font-weight="700" fill="url(#parchmentGrad)" letter-spacing="0.5">
      BITFOOTS EXPEDITION ARCHIVE
    </text>
    <text x="60" y="42" class="font-mono" font-size="11.5" font-weight="600" fill="#eaba49" letter-spacing="2">
      ${chapterTitle} • ON-CHAIN VERIFIED TELEMETRY
    </text>
  </g>

  <!-- Header Right: Clearance Badge Seal -->
  <g transform="translate(900, 62)">
    <rect x="0" y="2" width="246" height="42" rx="21" fill="#1a1f26" stroke="#eaba49" stroke-width="1.5" />
    <!-- Gold Star / Trophy Icon -->
    <text x="24" y="28" font-size="16">🏆</text>
    <text x="50" y="28" class="font-mono" font-size="12" font-weight="800" fill="#f3c85f" letter-spacing="1.8">
      ${badge.toUpperCase()}
    </text>
    <!-- Sub-label -->
    <text x="123" y="56" class="font-mono" font-size="9" font-weight="600" fill="#7fc98f" letter-spacing="1.5" text-anchor="middle">
      STATUS: CLEARANCE GRANTED
    </text>
  </g>

  <!-- Header Horizontal Divider Line -->
  <line x1="54" y1="126" x2="1146" y2="126" stroke="#2a384c" stroke-width="1.5" />

  <!-- ==================== BODY SECTION (TWO MAIN PANELS) ==================== -->

  <!-- ===== LEFT PANEL: OPERATIVE FIELD DOSSIER ===== -->
  <g transform="translate(54, 142)" filter="url(#panelShadow)">
    <!-- Dossier Panel Container -->
    <rect x="0" y="0" width="526" height="364" rx="8" fill="#12171e" stroke="#3a475c" stroke-width="1.5" />
    <rect x="0" y="0" width="526" height="34" rx="8" fill="#18202b" />
    <!-- Panel Header Text -->
    <text x="18" y="22" class="font-mono" font-size="10.5" font-weight="600" fill="#7d8898" letter-spacing="2">
      // FIELD OPERATIVE DOSSIER
    </text>
    <g transform="translate(380, 13)">
      <circle cx="6" cy="7" r="4" fill="#7fc98f" />
      <text x="16" y="11" class="font-mono" font-size="9.5" font-weight="600" fill="#7fc98f" letter-spacing="1">
        VERIFIED RECON
      </text>
    </g>
    <line x1="0" y1="34" x2="526" y2="34" stroke="#253244" stroke-width="1" />

    <!-- Avatar Frame (Double Gold & Lead Pixel Border) -->
    <g transform="translate(24, 52)">
      <!-- Avatar Outer Halo / Shadow -->
      <rect x="0" y="0" width="144" height="144" rx="6" fill="#0b0e12" stroke="#eaba49" stroke-width="2" />
      <rect x="4" y="4" width="136" height="136" rx="4" fill="#000000" stroke="#3a475c" stroke-width="1" />

      <!-- Pixel Corner Marks on Avatar Frame -->
      <rect x="0" y="0" width="8" height="8" fill="#f3c85f" />
      <rect x="136" y="0" width="8" height="8" fill="#f3c85f" />
      <rect x="0" y="136" width="8" height="8" fill="#f3c85f" />
      <rect x="136" y="136" width="8" height="8" fill="#f3c85f" />

      <!-- Avatar Image (Selected Authentic BitFoot Head or Custom URL) -->
      ${
        avatarDataUri
          ? `<image href="${avatarDataUri}" x="8" y="8" width="128" height="128" preserveAspectRatio="xMidYMid meet" class="pixel-avatar" />`
          : `<text x="72" y="82" class="font-mono" font-size="44" fill="#eaba49" text-anchor="middle">🐾</text>`
      }

      <!-- Avatar Sub-label -->
      <rect x="14" y="152" width="116" height="18" rx="3" fill="#18202b" stroke="#3a475c" stroke-width="1" />
      <text x="72" y="164" class="font-mono" font-size="8.5" font-weight="600" fill="#c9ccd2" letter-spacing="1.2" text-anchor="middle">
        AUTHENTIC BITFOOT
      </text>
    </g>

    <!-- Hunter Credentials Details (Right side of Avatar) -->
    <g transform="translate(192, 54)">
      <!-- Codename Label -->
      <text x="0" y="14" class="font-mono" font-size="9.5" font-weight="600" fill="#7d8898" letter-spacing="2">
        OPERATIVE CODENAME
      </text>
      <!-- Username Display in Warm Peach Parchment -->
      <text x="0" y="46" class="font-serif" font-size="28" font-weight="700" fill="url(#parchmentGrad)">
        ${username.length > 17 ? username.slice(0, 16) + "…" : username}
      </text>

      <!-- Clearance Level Tag -->
      <g transform="translate(0, 64)">
        <rect x="0" y="0" width="175" height="24" rx="4" fill="#1c2533" stroke="#eaba49" stroke-width="1" />
        <text x="8" y="16" class="font-mono" font-size="10" font-weight="700" fill="#f3c85f" letter-spacing="1">
          ★ TIER ${chapter} EXPEDITIONIST
        </text>
      </g>

      <!-- Cryptographic UUID -->
      <g transform="translate(0, 104)">
        <text x="0" y="10" class="font-mono" font-size="9" font-weight="600" fill="#7d8898" letter-spacing="1.5">
          TELEMETRY HASH / UUID:
        </text>
        <text x="0" y="27" class="font-mono" font-size="11" font-weight="600" fill="#aab6c9" letter-spacing="1">
          ${uuidDisplay}
        </text>
      </g>

      <!-- Security Protocol Badges -->
      <g transform="translate(0, 148)">
        <rect x="0" y="0" width="310" height="26" rx="4" fill="#0f141a" stroke="#253244" stroke-width="1" />
        <text x="10" y="17" class="font-mono" font-size="9.5" fill="#7fc98f">
          ✓ ZK-SHIELDED
        </text>
        <line x1="110" y1="4" x2="110" y2="22" stroke="#253244" stroke-width="1" />
        <text x="120" y="17" class="font-mono" font-size="9.5" fill="#c9ccd2">
          ORCHARD PRIVACY POOL
        </text>
      </g>
    </g>

    <!-- Bottom Mission Clearance Note inside Left Panel -->
    <g transform="translate(24, 256)">
      <rect x="0" y="0" width="478" height="88" rx="6" fill="#0c1015" stroke="#253244" stroke-width="1" />
      <g transform="translate(16, 18)">
        <text x="0" y="10" class="font-mono" font-size="9.5" font-weight="600" fill="#7d8898" letter-spacing="1.5">
          EXPEDITION PROTOCOL NOTE:
        </text>
        <text x="0" y="30" class="font-serif" font-size="12" fill="#c9ccd2">
          Specimen tracks telemetry verified under Zero-Knowledge consensus.
        </text>
        <text x="0" y="50" class="font-mono" font-size="10.5" font-weight="600" fill="#eaba49">
          Hunter credentials stamped into the immutable BitFoots expedition registry.
        </text>
      </g>
    </g>
  </g>

  <!-- ===== RIGHT PANEL: EXPEDITION TELEMETRY & CLEARANCE METRICS ===== -->
  <g transform="translate(614, 142)" filter="url(#panelShadow)">
    <!-- Metrics Panel Container -->
    <rect x="0" y="0" width="532" height="364" rx="8" fill="#12171e" stroke="#3a475c" stroke-width="1.5" />
    <rect x="0" y="0" width="532" height="34" rx="8" fill="#18202b" />
    <!-- Panel Header Text -->
    <text x="18" y="22" class="font-mono" font-size="10.5" font-weight="600" fill="#7d8898" letter-spacing="2">
      // EXPEDITION TELEMETRY &amp; CLEARANCE
    </text>
    <text x="514" y="22" class="font-mono" font-size="9.5" font-weight="600" fill="#eaba49" letter-spacing="1" text-anchor="end">
      ZK-SNARK AUDITED
    </text>
    <line x1="0" y1="34" x2="532" y2="34" stroke="#253244" stroke-width="1" />

    <!-- Two Main Metric Pods Side-by-Side -->
    <!-- Pod 1: Final Score -->
    <g transform="translate(20, 52)">
      <rect x="0" y="0" width="236" height="154" rx="6" fill="#151b24" stroke="#eaba49" stroke-width="2" filter="url(#goldGlow)" />
      <!-- Top Pod Label -->
      <rect x="0" y="0" width="236" height="28" rx="6" fill="#1f2835" />
      <text x="118" y="19" class="font-mono" font-size="10.5" font-weight="700" fill="#f3c85f" letter-spacing="2" text-anchor="middle">
        TOTAL SCORE
      </text>

      <!-- Huge Score Readout -->
      <text x="118" y="98" class="font-mono" font-size="52" font-weight="900" fill="url(#goldGrad)" text-anchor="middle">
        ${score}
      </text>
      <text x="118" y="132" class="font-mono" font-size="11" font-weight="600" fill="#7d8898" letter-spacing="3" text-anchor="middle">
        CLEARANCE UNITS
      </text>
    </g>

    <!-- Pod 2: Clear Time -->
    <g transform="translate(276, 52)">
      <rect x="0" y="0" width="236" height="154" rx="6" fill="#151b24" stroke="#3a475c" stroke-width="1.5" />
      <!-- Top Pod Label -->
      <rect x="0" y="0" width="236" height="28" rx="6" fill="#1c2533" />
      <text x="118" y="19" class="font-mono" font-size="10.5" font-weight="700" fill="#c9ccd2" letter-spacing="2" text-anchor="middle">
        MISSION SPEED
      </text>

      <!-- Huge Time Readout -->
      <text x="118" y="98" class="font-mono" font-size="52" font-weight="900" fill="url(#parchmentGrad)" text-anchor="middle">
        ${time}
      </text>
      <text x="118" y="132" class="font-mono" font-size="11" font-weight="600" fill="#7d8898" letter-spacing="3" text-anchor="middle">
        ELAPSED DURATION
      </text>
    </g>

    <!-- Detailed Telemetry Checklist Breakdown -->
    <g transform="translate(20, 222)">
      <rect x="0" y="0" width="492" height="122" rx="6" fill="#0c1015" stroke="#253244" stroke-width="1" />

      <!-- Row 1: Footprints -->
      <g transform="translate(18, 28)">
        <text x="0" y="0" class="font-mono" font-size="11.5" fill="#c9ccd2">
          🐾 CRYPTID TRACES LOCATED
        </text>
        <text x="456" y="0" class="font-mono" font-size="11.5" font-weight="700" fill="#7fc98f" text-anchor="end">
          VERIFIED [100% COMPLETE]
        </text>
      </g>
      <line x1="18" y1="40" x2="474" y2="40" stroke="#1c2533" stroke-width="1" />

      <!-- Row 2: Silhouettes / Gate -->
      <g transform="translate(18, 62)">
        <text x="0" y="0" class="font-mono" font-size="11.5" fill="#c9ccd2">
          👁️ ANOMALOUS SPECIMEN SIGHTING
        </text>
        <text x="456" y="0" class="font-mono" font-size="11.5" font-weight="700" fill="#f3c85f" text-anchor="end">
          CONFIRMED IN FIELD
        </text>
      </g>
      <line x1="18" y1="74" x2="474" y2="74" stroke="#1c2533" stroke-width="1" />

      <!-- Row 3: ZK Encryption -->
      <g transform="translate(18, 96)">
        <text x="0" y="0" class="font-mono" font-size="11.5" fill="#c9ccd2">
          🛡️ INTEGRITY GUARANTEE
        </text>
        <text x="456" y="0" class="font-mono" font-size="11.5" font-weight="700" fill="#eaba49" text-anchor="end">
          ANTI-CHEAT SHIELD ACTIVE
        </text>
      </g>
    </g>
  </g>

  <!-- ==================== FOOTER SECTION ==================== -->
  <g transform="translate(54, 532)">
    <line x1="0" y1="0" x2="1092" y2="0" stroke="#253244" stroke-width="1.5" />
    <!-- Center Gold Diamond Accent -->
    <polygon points="546,-5 551,0 546,5 541,0" fill="#eaba49" />

    <!-- Manifesto Quote from BitFoots Design Guide -->
    <text x="0" y="36" class="font-serif" font-size="13" font-style="italic" fill="#aab6c9">
      "Never caught. You don&apos;t buy a Bitfoot. You spot him. The only price is the hunt."
    </text>

    <!-- Barcode & Brand Telemetry -->
    <g transform="translate(830, 18)">
      <!-- Stylized Barcode Lines -->
      <g fill="#3a475c">
        <rect x="0" y="0" width="3" height="18" />
        <rect x="6" y="0" width="2" height="18" />
        <rect x="11" y="0" width="4" height="18" />
        <rect x="18" y="0" width="1" height="18" />
        <rect x="22" y="0" width="5" height="18" />
        <rect x="30" y="0" width="2" height="18" />
        <rect x="35" y="0" width="3" height="18" />
        <rect x="41" y="0" width="2" height="18" />
        <rect x="46" y="0" width="4" height="18" />
        <rect x="53" y="0" width="1" height="18" />
        <rect x="57" y="0" width="3" height="18" fill="#eaba49" />
        <rect x="63" y="0" width="2" height="18" fill="#eaba49" />
      </g>
      <!-- Official Signature -->
      <text x="76" y="14" class="font-mono" font-size="12" font-weight="700" fill="#eaba49" letter-spacing="1">
        @BITFOOTS_ • @Zcash
      </text>
    </g>
  </g>
</svg>
    `.trim();

    return new Response(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("OG Score generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate OG score card" },
      { status: 500 }
    );
  }
}
