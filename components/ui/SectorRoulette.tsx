"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Compass,
  Lock,
  Radio,
  Sparkles,
  Crosshair,
  ChevronRight,
  X,
  Target,
} from "lucide-react";
import { audioManager } from "@/lib/audioManager";

/**
 * ===========================================================================
 * THE APEX SECTOR RADAR — "Chrono-Dialler Mk-IV"
 * ===========================================================================
 * A military-grade cryptographic field navigation radar instrument.
 *
 *  - Fixed flush to the far right edge of the viewport (right-0).
 *  - Normal (Idle) State: Sleek half-wheel at right edge (w-[185px] h-[370px])
 *    with large, bold, crystal-clear "S 01" / "S 02" typography.
 *  - Hover (Expanded) State: Expands gracefully into full radar mode (w-[260px] h-[520px])
 *    with soft cross-fade into "Sector 1" / "Sector 2" + detailed subtitles.
 *  - Full Chapter 1 & Chapter 2 support.
 * ===========================================================================
 */

export interface SectorItem {
  id: 1 | 2 | 3;
  code: string;
  shortCode: string;
  name: string;
  subTitle: string;
  shortSubTitle: string;
  description: string;
  clearance: "OPEN" | "ACTIVE" | "RESTRICTED" | "SEALED" | "MYTHIC";
  isUnlocked: boolean;
  chapter: 1 | 2 | 3;
  coordinates: string;
  traces: string;
}

export const SECTOR_DATA: SectorItem[] = [
  {
    id: 1,
    code: "S-01",
    shortCode: "S 01",
    name: "Sector 1",
    subTitle: "Forest Canopy",
    shortSubTitle: "FOREST",
    description: "Fern-choked basin where the cryptid herd leaves its first organic footprint traces under nocturnal fog.",
    clearance: "OPEN",
    isUnlocked: true,
    chapter: 1,
    coordinates: "47°12'N 122°14'W",
    traces: "8 Organic Traces",
  },
  {
    id: 2,
    code: "S-02",
    shortCode: "S 02",
    name: "Sector 2",
    subTitle: "90° Lattice Grid",
    shortSubTitle: "90° GRID",
    description: "Shilo's orthogonal proving ground. Strict 90° vector motion, collapsing floor tiles, and glitch lasers.",
    clearance: "RESTRICTED",
    isUnlocked: false,
    chapter: 2,
    coordinates: "48°05'N 121°44'W",
    traces: "6 Vector Nodes",
  },
  {
    id: 3,
    code: "S-03",
    shortCode: "S 03",
    name: "Sector 3",
    subTitle: "Shielded ZK // FINAL",
    shortSubTitle: "FINAL ZK",
    description: "The zero-knowledge privacy abyss and final expedition destination. Use acoustic sonar to illuminate terrain, evade shadow stalkers, and claim victory.",
    clearance: "MYTHIC",
    isUnlocked: false,
    chapter: 3,
    coordinates: "ZK-STARK // 0x546b",
    traces: "6 ZK Proof Nodes",
  },
];


/* ---------------------------------------------------------------------------
 * Dial geometry — a half-circle anchored flush to the right screen edge.
 * Standard Cartesian orientation: 90° = top, 180° = left apex, 270° = bottom.
 * ------------------------------------------------------------------------- */
const DIAL = {
  width: 260,
  height: 520,
  cx: 260,
  cy: 260,
  rOuter: 246,
  rInner: 50,
  rLabelMid: 148,
  rBulb: 236,
  startAngle: 90,
  sweep: 180,
} as const;

const SLICE_COUNT = SECTOR_DATA.length;
const SLICE_ANGLE = DIAL.sweep / SLICE_COUNT; // 60° each for 3 sectors
const TICK_COUNT = 25;

const ARM_GLIDE_MS = 540;
const ARM_GLIDE_REDUCED_MS = 180;

/** Polar to Cartesian helper in SVG coordinates */
const getPoint = (radius: number, angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: DIAL.cx + radius * Math.cos(rad),
    y: DIAL.cy - radius * Math.sin(rad),
  };
};

/** Center angle of a sector slice (S-01: 120°, S-02: 180°, S-03: 240°) */
const sectorMidAngle = (sectorId: number) =>
  DIAL.startAngle + (sectorId - 1) * SLICE_ANGLE + SLICE_ANGLE / 2;

/** Shortest angular delta between current and target angle */
const shortestDelta = (current: number, target: number) =>
  ((target - current + 540) % 360) - 180;

/** Half-circle path used for the main backplate and clipping */
const HALF_CIRCLE_PATH = `M ${DIAL.cx} ${DIAL.cy - DIAL.rOuter} A ${DIAL.rOuter} ${
  DIAL.rOuter
} 0 0 0 ${DIAL.cx} ${DIAL.cy + DIAL.rOuter} Z`;

/** Open arc along outer rim */
const RIM_ARC_PATH = `M ${DIAL.cx} ${DIAL.cy - DIAL.rOuter} A ${DIAL.rOuter} ${
  DIAL.rOuter
} 0 0 0 ${DIAL.cx} ${DIAL.cy + DIAL.rOuter}`;

/** Arc generator at a specified radius */
const arcAtRadius = (radius: number, fromDeg = 90, toDeg = 270) => {
  const start = getPoint(radius, fromDeg);
  const end = getPoint(radius, toDeg);
  const largeArc = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
};

interface SectorRouletteProps {
  activeChapter: 1 | 2 | 3;
  onSelectChapter: (chapterId: 1 | 2 | 3) => void;
  isBlurred?: boolean;
  unlockedSectors?: number[];
  isHoverDisabled?: boolean;
}

interface DialNotice {
  text: string;
  tone: "ok" | "denied";
}

export const SectorRoulette: React.FC<SectorRouletteProps> = ({
  activeChapter,
  onSelectChapter,
  isBlurred = false,
  unlockedSectors = [1],
  isHoverDisabled = false,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [hoveredSectorId, setHoveredSectorId] = useState<number | null>(null);
  const [armTargetId, setArmTargetId] = useState<number | null>(null);
  const [rejectedSectorId, setRejectedSectorId] = useState<number | null>(null);
  const [notice, setNotice] = useState<DialNotice | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Dynamic Sector List with Clearances (effective unlocked combines unlockedSectors and activeChapter)
  const sectorList: SectorItem[] = React.useMemo(() => {
    const effectiveUnlocked = Array.from(new Set([...(unlockedSectors || [1]), activeChapter]));
    return SECTOR_DATA.map((sector) => ({
      ...sector,
      isUnlocked: effectiveUnlocked.includes(sector.id),
    }));
  }, [unlockedSectors, activeChapter]);

  // Rotation of the mechanical needle
  const [armRotation, setArmRotation] = useState<number>(() => sectorMidAngle(activeChapter));

  const hoveredRef = useRef<number | null>(null);
  const armTimersRef = useRef<number[]>([]);
  const joltTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const mouseLeaveTimeoutRef = useRef<number | null>(null);

  const isArmMoving = armTargetId !== null;
  const isExpanded = !isHoverDisabled && (isHovered || isArmMoving);
  const armGlideMs = prefersReducedMotion ? ARM_GLIDE_REDUCED_MS : ARM_GLIDE_MS;

  const currentSector =
    sectorList.find((s) => s.id === (armTargetId ?? activeChapter)) ?? sectorList[0];
  const focusedSector =
    hoveredSectorId !== null
      ? sectorList.find((s) => s.id === hoveredSectorId) ?? currentSector
      : currentSector;


  /* ---------------------------------------------------------------- Effects */

  const clearArmTimers = useCallback(() => {
    armTimersRef.current.forEach((id) => window.clearTimeout(id));
    armTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearArmTimers();
      if (joltTimerRef.current) window.clearTimeout(joltTimerRef.current);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
      if (mouseLeaveTimeoutRef.current) window.clearTimeout(mouseLeaveTimeoutRef.current);
    };
  }, [clearArmTimers]);

  // Accessibility reduced-motion
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    query.addEventListener?.("change", handleChange);
    return () => query.removeEventListener?.("change", handleChange);
  }, []);

  // Synchronize index needle when chapter changes externally
  useEffect(() => {
    if (isArmMoving) return;
    setArmRotation((prev) => prev + shortestDelta(prev, sectorMidAngle(activeChapter)));
  }, [activeChapter, isArmMoving]);

  // Collapse if modal entry gate is open
  useEffect(() => {
    if (!isBlurred) return;
    setIsHovered(false);
    setIsMobileOpen(false);
    setHoveredSectorId(null);
    hoveredRef.current = null;
  }, [isBlurred]);

  // Collapse and clear hover when hover is disabled during active gameplay (no visual freeze, just hover disabled)
  useEffect(() => {
    if (isHoverDisabled) {
      setIsHovered(false);
      setHoveredSectorId(null);
      hoveredRef.current = null;
      if (mouseLeaveTimeoutRef.current) {
        window.clearTimeout(mouseLeaveTimeoutRef.current);
        mouseLeaveTimeoutRef.current = null;
      }
    }
  }, [isHoverDisabled]);

  /* --------------------------------------------------------------- Handlers */

  const pushNotice = useCallback((text: string, tone: DialNotice["tone"]) => {
    setNotice({ text, tone });
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const handleMouseEnter = () => {
    if (isHoverDisabled) return;
    if (mouseLeaveTimeoutRef.current) {
      window.clearTimeout(mouseLeaveTimeoutRef.current);
      mouseLeaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (mouseLeaveTimeoutRef.current) {
      window.clearTimeout(mouseLeaveTimeoutRef.current);
    }
    mouseLeaveTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
      hoveredRef.current = null;
      setHoveredSectorId(null);
    }, 280);
  };

  const handleSectorHover = (sectorId: number) => {
    if (isHoverDisabled) return;
    if (hoveredRef.current !== sectorId) {
      hoveredRef.current = sectorId;
      audioManager.playRouletteTick();
    }
    setHoveredSectorId(sectorId);
  };

  const handleSectorBlur = (sectorId: number) => {
    if (hoveredRef.current === sectorId) hoveredRef.current = null;
    setHoveredSectorId(null);
  };

  const handleSectorClick = (sector: SectorItem) => {
    if (isHoverDisabled || isArmMoving) return;

    const chapter = sector.chapter;

    // Classified / locked sectors reject access
    if (!sector.isUnlocked || chapter === undefined) {
      audioManager.playRouletteDenied();
      setRejectedSectorId(sector.id);
      if (joltTimerRef.current) window.clearTimeout(joltTimerRef.current);
      joltTimerRef.current = window.setTimeout(() => setRejectedSectorId(null), 450);
      pushNotice(`${sector.shortCode} :: LOCKED — CLEAR SECTOR 0${sector.id - 1} FIRST`, "denied");
      return;
    }

    // Already dialled in
    if (chapter === activeChapter) {
      audioManager.playRouletteTick();
      pushNotice(`${sector.shortCode} :: SECTOR ACTIVE — ${sector.subTitle.toUpperCase()}`, "ok");
      return;
    }

    clearArmTimers();

    const targetAngle = sectorMidAngle(sector.id);
    setArmTargetId(sector.id);
    setArmRotation((prev) => prev + shortestDelta(prev, targetAngle));
    audioManager.playRouletteTick();

    armTimersRef.current.push(
      window.setTimeout(() => {
        audioManager.playRouletteLock();
        setArmTargetId(null);
        pushNotice(`TRANSMISSION LOCKED :: ${sector.name.toUpperCase()} — ${sector.subTitle.toUpperCase()}`, "ok");
        onSelectChapter(chapter);
        if (isMobileOpen) {
          setTimeout(() => setIsMobileOpen(false), 300);
        }
      }, armGlideMs)
    );
  };

  // Keyboard shortcut navigation (1 to 5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHoverDisabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const numKey = parseInt(e.key, 10);
      if (numKey >= 1 && numKey <= 5) {
        const targetSec = sectorList.find((s) => s.id === numKey);
        if (targetSec) handleSectorClick(targetSec);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSectorClick, sectorList, isHoverDisabled]);


  /* ------------------------------------------------ Render Components */

  // The Tactical Holographic Dossier HUD card
  const renderDossierCard = () => {
    const isTargetUnlocked = focusedSector.isUnlocked && focusedSector.chapter !== undefined;
    const isTargetActive = focusedSector.chapter === activeChapter;

    return (
      <div className="relative w-[240px] sm:w-[260px] rounded-2xl border border-[#eaba49]/40 bg-[#0d1117]/95 p-4 text-[#aab6c9] shadow-[0_12px_45px_rgba(0,0,0,0.95),0_0_20px_rgba(234,186,73,0.12)] backdrop-blur-xl">
        {/* Holographic corner tech brackets */}
        <div className="absolute left-2 top-2 h-2.5 w-2.5 border-l border-t border-[#eaba49]" />
        <div className="absolute right-2 top-2 h-2.5 w-2.5 border-r border-t border-[#eaba49]" />
        <div className="absolute bottom-2 left-2 h-2.5 w-2.5 border-b border-l border-[#eaba49]" />
        <div className="absolute bottom-2 right-2 h-2.5 w-2.5 border-b border-r border-[#eaba49]" />

        {/* Header telemetry ribbon */}
        <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-2.5">
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[8.5px] font-bold tracking-wider flex items-center gap-1 ${
              focusedSector.isUnlocked
                ? isTargetActive
                  ? "border-[#eaba49]/70 bg-[#eaba49]/15 text-[#f3c85f]"
                  : "border-[#7fc98f]/60 bg-[#7fc98f]/10 text-[#7fc98f]"
                : "border-[#e07a6b]/50 bg-[#e07a6b]/10 text-[#e07a6b]"
            }`}
          >
            {isTargetActive ? (
              "ACTIVE EXPEDITION"
            ) : focusedSector.isUnlocked ? (
              "UNLOCKED // RECON READY"
            ) : (
              <>
                <Lock className="w-2.5 h-2.5 text-[#e07a6b]" />
                <span>LOCKED // {focusedSector.clearance}</span>
              </>
            )}
          </span>
        </div>

        {/* Sector Identity */}
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs font-bold tracking-wider text-[#eaba49]">
              {focusedSector.shortCode}
            </span>
          </div>

          <div className="mt-0.5 font-serif text-base font-bold leading-tight text-[#ffddcc]">
            {focusedSector.name} — {focusedSector.subTitle}
          </div>
        </div>

        {/* Description */}
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-[#c9ccd2]">
          {focusedSector.description}
        </p>

        {/* Coordinates & Traces Matrix */}
        <div className="mt-3 space-y-1 rounded-lg border border-[#3a475c]/40 bg-[#07090c]/80 p-2 font-mono text-[9.5px]">
          <div className="flex items-center justify-between text-[#7d8898]">
            <span className="flex items-center gap-1">
              <Crosshair className="h-2.5 w-2.5 text-[#eaba49]" />
              COORDS:
            </span>
            <span className="text-[#ffddcc]">{focusedSector.coordinates}</span>
          </div>
          <div className="flex items-center justify-between text-[#7d8898]">
            <span className="flex items-center gap-1">
              <Target className="h-2.5 w-2.5 text-[#7fc98f]" />
              SURVEY:
            </span>
            <span className={focusedSector.isUnlocked ? "text-[#7fc98f]" : "text-[#e07a6b]"}>
              {focusedSector.traces}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3">
          {isTargetActive ? (
            <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#eaba49]/50 bg-[#eaba49]/15 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#f3c85f]">
              <Sparkles className="h-3 w-3 text-[#eaba49]" />
              <span>CURRENT EXPEDITION</span>
            </div>
          ) : isTargetUnlocked ? (
            <button
              type="button"
              onClick={() => handleSectorClick(focusedSector)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#eaba49] bg-gradient-to-r from-[#eaba49] to-[#d49e29] py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0e1014] shadow-[0_0_15px_rgba(234,186,73,0.35)] transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
            >
              <span>ENGAGE {focusedSector.name.toUpperCase()}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#e07a6b]/40 bg-[#e07a6b]/10 py-2 font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#e07a6b] select-none">
              <Lock className="h-3 w-3" />
              <span>CLEAR SECTOR 0{focusedSector.id - 1} TO UNLOCK</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // The Core SVG Dial Instrument
  const renderSvgDial = () => (
    <svg
      viewBox={`0 0 ${DIAL.width} ${DIAL.height}`}
      role="group"
      aria-label="Expedition sector radar dial"
      className="h-full w-full overflow-visible transition-all duration-400 ease-out select-none"
    >
      <defs>
        {/* Obsidian Titanium Plate Gradient */}
        <linearGradient id="sr-plate-grad" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#141a24" />
          <stop offset="45%" stopColor="#0b0f14" />
          <stop offset="100%" stopColor="#05070a" />
        </linearGradient>

        {/* 24K Gold CNC Rim Gradient */}
        <linearGradient id="sr-gold-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fadb7f" />
          <stop offset="25%" stopColor="#eaba49" />
          <stop offset="60%" stopColor="#966e1e" />
          <stop offset="85%" stopColor="#f3c85f" />
          <stop offset="100%" stopColor="#805b14" />
        </linearGradient>

        {/* Slice Fill Gradients */}
        <linearGradient id="sr-slice-active-grad" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#4f380e" />
          <stop offset="50%" stopColor="#2c2009" />
          <stop offset="100%" stopColor="#140f04" />
        </linearGradient>

        <linearGradient id="sr-slice-unlocked-grad" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#152620" />
          <stop offset="60%" stopColor="#0d1814" />
          <stop offset="100%" stopColor="#080e0c" />
        </linearGradient>

        <linearGradient id="sr-slice-sealed-grad" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#10141c" />
          <stop offset="60%" stopColor="#090c10" />
          <stop offset="100%" stopColor="#050709" />
        </linearGradient>

        <linearGradient id="sr-slice-hover-grad" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#243142" />
          <stop offset="60%" stopColor="#151e2a" />
          <stop offset="100%" stopColor="#0d131b" />
        </linearGradient>

        {/* Glass Specular Flare Gradient */}
        <linearGradient id="sr-glass-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Hazard Hatch Pattern */}
        <pattern
          id="sr-hatch-pattern"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="10" stroke="#3a475c" strokeWidth="1.2" strokeOpacity="0.32" />
        </pattern>

        <clipPath id="sr-half-clip-mk4">
          <path d={HALF_CIRCLE_PATH} />
        </clipPath>

        {/* Glow Filters */}
        <filter id="sr-glow-amber" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="sr-glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Deep Obsidian Titanium Backplate */}
      <path d={HALF_CIRCLE_PATH} fill="url(#sr-plate-grad)" />

      {/* 2. Concentric Range Rings (Radar distance calibrations) */}
      {[
        { r: DIAL.rOuter - 38, dash: "4 8", op: 0.35 },
        { r: DIAL.rOuter - 85, dash: "3 9", op: 0.25 },
        { r: DIAL.rOuter - 132, dash: "2 8", op: 0.2 },
        { r: DIAL.rInner + 24, dash: "2 6", op: 0.28 },
      ].map((ring, idx) => (
        <g key={`range-ring-${idx}`}>
          <path
            d={arcAtRadius(ring.r)}
            fill="none"
            stroke="#3a475c"
            strokeOpacity={ring.op}
            strokeWidth="1"
            strokeDasharray={ring.dash}
          />
        </g>
      ))}

      {/* 3. Sweeping Phosphor Radar Beam */}
      <g clipPath="url(#sr-half-clip-mk4)" pointerEvents="none">
        <g
          className="animate-radar-sweep motion-reduce:animate-none origin-center"
          style={{
            transformOrigin: `${DIAL.cx}px ${DIAL.cy}px`,
            transformBox: "view-box",
            animationDuration: isArmMoving ? "1.8s" : "8s",
          }}
        >
          {/* Radial gradient phosphor trail */}
          <path
            d={`M ${DIAL.cx} ${DIAL.cy} L ${DIAL.cx} ${DIAL.cy - DIAL.rOuter} A ${DIAL.rOuter} ${
              DIAL.rOuter
            } 0 0 0 ${DIAL.cx - DIAL.rOuter * 0.707} ${DIAL.cy - DIAL.rOuter * 0.707} Z`}
            fill="url(#sr-gold-rim)"
            fillOpacity={isArmMoving ? "0.15" : "0.06"}
          />
          <line
            x1={DIAL.cx}
            y1={DIAL.cy}
            x2={DIAL.cx}
            y2={DIAL.cy - DIAL.rOuter}
            stroke="#f3c85f"
            strokeWidth="1.6"
            strokeOpacity={isArmMoving ? "0.85" : "0.5"}
            filter="url(#sr-glow-amber)"
          />
        </g>
      </g>

      {/* 4. Fine Detent Micro-Ticks along outer calibration track */}
      <g clipPath="url(#sr-half-clip-mk4)" pointerEvents="none">
        {Array.from({ length: 90 }).map((_, index) => {
          const angle = index * 4;
          const isMajor = index % 5 === 0;
          const outer = getPoint(DIAL.rOuter - 18, angle);
          const inner = getPoint(DIAL.rOuter - (isMajor ? 10 : 14), angle);
          return (
            <line
              key={`hash-tick-${index}`}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke="#eaba49"
              strokeOpacity={isMajor ? 0.45 : 0.18}
              strokeWidth={isMajor ? 1.4 : 0.8}
            />
          );
        })}
      </g>

      {/* 5. Sector Slices (Interactive 36° Annular Pie Wedges) */}
      <g>
        {sectorList.map((sector, index) => {
          const theta1 = DIAL.startAngle + index * SLICE_ANGLE;

          const theta2 = theta1 + SLICE_ANGLE;
          const thetaMid = (theta1 + theta2) / 2;

          const p1In = getPoint(DIAL.rInner, theta1);
          const p1Out = getPoint(DIAL.rOuter, theta1);
          const p2Out = getPoint(DIAL.rOuter, theta2);
          const p2In = getPoint(DIAL.rInner, theta2);

          const isUnlocked = sector.isUnlocked;
          const isActive = activeChapter === sector.chapter;
          const isHoveredSlice = !isHoverDisabled && hoveredSectorId === sector.id && !isBlurred;
          const isRejected = rejectedSectorId === sector.id;
          const isArmTarget = armTargetId === sector.id;

          const wedgePath = `M ${p1In.x} ${p1In.y} L ${p1Out.x} ${p1Out.y} A ${DIAL.rOuter} ${DIAL.rOuter} 0 0 0 ${p2Out.x} ${p2Out.y} L ${p2In.x} ${p2In.y} A ${DIAL.rInner} ${DIAL.rInner} 0 0 1 ${p1In.x} ${p1In.y} Z`;

          const wedgeFill = isActive
            ? "url(#sr-slice-active-grad)"
            : isUnlocked
            ? isHoveredSlice
              ? "url(#sr-slice-hover-grad)"
              : "url(#sr-slice-unlocked-grad)"
            : isHoveredSlice
            ? "#180f12"
            : "url(#sr-slice-sealed-grad)";

          const wedgeStroke = isRejected
            ? "#e07a6b"
            : isActive
            ? "#eaba49"
            : isUnlocked
            ? isHoveredSlice
              ? "#f3c85f"
              : "#2f4036"
            : isHoveredSlice
            ? "#e07a6b"
            : "#1a222e";

          const labelAnchor = getPoint(DIAL.rLabelMid, thetaMid);
          const badgeAnchor = getPoint(DIAL.rOuter - 26, thetaMid);
          const labelAngleDeg = 180 - thetaMid;

          return (
            <g
              key={sector.id}
              className={`outline-none transition-colors duration-300 ${
                isUnlocked ? "cursor-pointer" : "cursor-not-allowed"
              }`}
              role="button"
              tabIndex={0}
              aria-label={`${sector.name} — ${sector.subTitle} (${sector.clearance})`}
              aria-pressed={isActive}
              onClick={() => handleSectorClick(sector)}
              onMouseEnter={() => handleSectorHover(sector.id)}
              onMouseLeave={() => handleSectorBlur(sector.id)}
              onFocus={() => handleSectorHover(sector.id)}
              onBlur={() => handleSectorBlur(sector.id)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSectorClick(sector);
                }
              }}
            >
              {/* The Wedge Polygon */}
              <path
                d={wedgePath}
                fill={wedgeFill}
                stroke={wedgeStroke}
                strokeWidth={isActive ? 2.2 : isHoveredSlice ? 1.8 : 1.2}
                className="transition-all duration-300"
              />

              {/* Hatched mesh for classified sectors */}
              {!sector.isUnlocked && (
                <path d={wedgePath} fill="url(#sr-hatch-pattern)" stroke="none" pointerEvents="none" />
              )}

              {/* Radiant amber contour glow when active */}
              {isActive && (
                <path
                  d={wedgePath}
                  fill="none"
                  stroke="#f3c85f"
                  strokeOpacity="0.6"
                  strokeWidth="1.5"
                  filter="url(#sr-glow-amber)"
                  pointerEvents="none"
                />
              )}

              {/* Sector Label: Smooth transition between "S 01" (idle, big font) and "Sector 1" (hover) */}
              <g
                transform={`translate(${labelAnchor.x} ${labelAnchor.y}) rotate(${labelAngleDeg})`}
                pointerEvents="none"
              >
                {/* 1. Idle state: "S 01" in LARGE, BOLD, high-contrast font */}
                <g
                  style={{
                    opacity: isExpanded ? 0 : 1,
                    transform: isExpanded ? "scale(0.72) translateY(-2px)" : "scale(1) translateY(0)",
                    transformOrigin: "0 0",
                    transition: "opacity 320ms cubic-bezier(0.4, 0, 0.2, 1), transform 320ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <text
                    x="0"
                    y="8"
                    fill={
                      isActive
                        ? "#ffddcc"
                        : isUnlocked
                        ? "#f1f5f9"
                        : "#3a475c"
                    }
                    fontSize="26"
                    fontWeight="900"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.08em"
                    textAnchor="middle"
                    paintOrder="stroke"
                    stroke="#06080b"
                    strokeWidth="4.5"
                    strokeLinejoin="round"
                    opacity={isUnlocked ? 1 : 0.4}
                  >
                    {sector.shortCode}
                  </text>
                </g>

                {/* 2. Hover/Expanded state: "Sector 1" + Subtitle with soft fade-in */}
                <g
                  style={{
                    opacity: isExpanded ? 1 : 0,
                    transform: isExpanded ? "scale(1) translateY(0)" : "scale(0.85) translateY(2px)",
                    transformOrigin: "0 0",
                    transition: "opacity 320ms cubic-bezier(0.4, 0, 0.2, 1), transform 320ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <text
                    x="0"
                    y="-3"
                    fill={
                      isActive
                        ? "#ffddcc"
                        : isUnlocked
                        ? isHoveredSlice
                          ? "#ffffff"
                          : "#e2e8f0"
                        : "#64748b"
                    }
                    fontSize="14.5"
                    fontWeight={isActive ? "800" : "700"}
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.04em"
                    textAnchor="middle"
                    paintOrder="stroke"
                    stroke="#080b0f"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    opacity={isUnlocked ? 1 : 0.55}
                  >
                    {sector.name}
                  </text>

                  <text
                    x="0"
                    y="11"
                    fill={
                      isActive
                        ? "#eaba49"
                        : isUnlocked
                        ? isHoveredSlice
                          ? "#ffd97d"
                          : "#7fc98f"
                        : "#e07a6b"
                    }
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.04em"
                    textAnchor="middle"
                    paintOrder="stroke"
                    stroke="#080b0f"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  >
                    {isUnlocked ? sector.shortSubTitle : "LOCKED"}
                  </text>
                </g>
              </g>

              {/* Outer Edge Status Indicator Badge */}
              <g
                transform={`translate(${badgeAnchor.x} ${badgeAnchor.y}) rotate(${labelAngleDeg})`}
                pointerEvents="none"
              >
                {isUnlocked ? (
                  <circle
                    cx="0"
                    cy="0"
                    r="4"
                    fill={isActive ? "#eaba49" : "#7fc98f"}
                    className={isActive ? "animate-pulse" : undefined}
                    filter={isActive ? "url(#sr-glow-amber)" : "url(#sr-glow-emerald)"}
                  />
                ) : (
                  <g>
                    <circle cx="0" cy="0" r="8" fill="#14080a" stroke="#e07a6b" strokeWidth="1.2" />
                    <path
                      d="M-2.5 -1.5 v-2 a2.5 2.5 0 0 1 5 0 v2"
                      fill="none"
                      stroke="#e07a6b"
                      strokeWidth="1.3"
                    />
                    <rect x="-3" y="-1.5" width="6" height="4.5" rx="1" fill="#e07a6b" />
                    <circle cx="0" cy="0.8" r="0.7" fill="#14080a" />
                  </g>
                )}
              </g>
            </g>
          );
        })}
      </g>

      {/* 6. Spoke Dividers between sector slices */}
      <g pointerEvents="none">
        {Array.from({ length: SLICE_COUNT + 1 }).map((_, index) => {
          const angle = DIAL.startAngle + index * SLICE_ANGLE;
          const outer = getPoint(DIAL.rOuter, angle);
          const inner = getPoint(DIAL.rInner, angle);
          return (
            <g key={`spoke-${index}`}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#040609"
                strokeWidth="3.2"
              />
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="url(#sr-gold-rim)"
                strokeWidth="1.2"
                strokeOpacity={index === 0 || index === SLICE_COUNT ? 0.8 : 0.4}
              />
            </g>
          );
        })}
      </g>

      {/* 7. Outer Bezel Scale: Major Ticks & Bearing Angles */}
      <g pointerEvents="none">
        {Array.from({ length: TICK_COUNT }).map((_, index) => {
          const angle = DIAL.startAngle + (index / (TICK_COUNT - 1)) * DIAL.sweep;
          const isMajor = index % 4 === 0;
          const start = getPoint(DIAL.rOuter - (isMajor ? 12 : 6), angle);
          const end = getPoint(DIAL.rOuter - 1, angle);
          return (
            <line
              key={`bezel-tick-${index}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#eaba49"
              strokeOpacity={isMajor ? 0.9 : 0.4}
              strokeWidth={isMajor ? 2 : 1}
            />
          );
        })}
      </g>

      {/* 8. Outer CNC Brass Rim & Right Edge Rail */}
      <path
        d={RIM_ARC_PATH}
        fill="none"
        stroke="url(#sr-gold-rim)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1={DIAL.cx}
        y1={DIAL.cy - DIAL.rOuter}
        x2={DIAL.cx}
        y2={DIAL.cy + DIAL.rOuter}
        stroke="url(#sr-gold-rim)"
        strokeWidth="3.2"
      />

      {/* 9. Hex Bolts on Outer Bezel at Cardinal Points */}
      {[90, 135, 180, 225, 270].map((boltAngle, idx) => {
        const pt = getPoint(DIAL.rOuter + 6, boltAngle);
        return (
          <g key={`hex-bolt-${idx}`} transform={`translate(${pt.x} ${pt.y})`} pointerEvents="none">
            <circle cx="0" cy="0" r="3.2" fill="#141a24" stroke="#eaba49" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.4" fill="#080b0f" />
          </g>
        );
      })}

      {/* 10. Sapphire Curved Glass Specular Highlight Overlay */}
      <path
        d={`M ${DIAL.cx} ${DIAL.cy - DIAL.rOuter} A ${DIAL.rOuter} ${DIAL.rOuter} 0 0 0 ${
          DIAL.cx - DIAL.rOuter * 0.95
        } ${DIAL.cy} L ${DIAL.cx} ${DIAL.cy} Z`}
        fill="url(#sr-glass-sheen)"
        pointerEvents="none"
      />

      {/* 11. Mechanical Precision Brass Index Needle (Counterweighted) */}
      <g
        pointerEvents="none"
        style={{
          transform: `rotate(${90 - armRotation}deg)`,
          transformOrigin: `${DIAL.cx}px ${DIAL.cy}px`,
          transformBox: "view-box",
          transition: `transform ${armGlideMs}ms cubic-bezier(0.2, 0.85, 0.25, 1)`,
        }}
      >
        {/* Needle Laser Guide Line */}
        <line
          x1={DIAL.cx}
          y1={DIAL.cy - (DIAL.rInner + 10)}
          x2={DIAL.cx}
          y2={DIAL.rOuter - 4}
          stroke="#f3c85f"
          strokeWidth="2.4"
          strokeLinecap="round"
          filter="url(#sr-glow-amber)"
        />

        {/* Counterweight rear tail */}
        <line
          x1={DIAL.cx}
          y1={DIAL.cy + 6}
          x2={DIAL.cx}
          y2={DIAL.cy + 24}
          stroke="#eaba49"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx={DIAL.cx} cy={DIAL.cy + 24} r="4" fill="#141a24" stroke="#eaba49" strokeWidth="1.5" />

        {/* Pointer Arrowhead Head */}
        <polygon
          points={`${DIAL.cx},${DIAL.rOuter - 2} ${DIAL.cx - 7.5},${DIAL.rOuter - 18} ${DIAL.cx},${
            DIAL.rOuter - 13
          } ${DIAL.cx + 7.5},${DIAL.rOuter - 18}`}
          fill="#f3c85f"
          filter="url(#sr-glow-amber)"
        />
      </g>

      {/* 12. Center Hub: Half-Circle Obsidian Dome + Bisected Bitfoots Seal */}
      <g pointerEvents="none">
        {/* Outer Hub Half-Circle Shell */}
        <path
          d={`M ${DIAL.cx} ${DIAL.cy - DIAL.rInner} A ${DIAL.rInner} ${DIAL.rInner} 0 0 0 ${
            DIAL.cx
          } ${DIAL.cy + DIAL.rInner} Z`}
          fill="#0c1015"
          stroke="url(#sr-gold-rim)"
          strokeWidth="3"
        />

        {/* Inner Hub Bevel Half-Circle */}
        <path
          d={`M ${DIAL.cx} ${DIAL.cy - (DIAL.rInner - 6)} A ${DIAL.rInner - 6} ${
            DIAL.rInner - 6
          } 0 0 0 ${DIAL.cx} ${DIAL.cy + (DIAL.rInner - 6)} Z`}
          fill="#141a24"
          stroke="#3a475c"
          strokeWidth="1"
        />

        {/* Spinning internal turbine vanes during motion */}
        <g
          clipPath="url(#sr-half-clip-mk4)"
          className={isArmMoving ? "animate-radar-sweep origin-center" : undefined}
          style={{
            transformOrigin: `${DIAL.cx}px ${DIAL.cy}px`,
            transformBox: "view-box",
            animationDuration: "0.6s",
          }}
        >
          <line
            x1={DIAL.cx - (DIAL.rInner - 12)}
            y1={DIAL.cy}
            x2={DIAL.cx + (DIAL.rInner - 12)}
            y2={DIAL.cy}
            stroke="#eaba49"
            strokeOpacity="0.4"
            strokeWidth="1.2"
          />
          <line
            x1={DIAL.cx}
            y1={DIAL.cy - (DIAL.rInner - 12)}
            x2={DIAL.cx}
            y2={DIAL.cy + (DIAL.rInner - 12)}
            stroke="#eaba49"
            strokeOpacity="0.4"
            strokeWidth="1.2"
          />
        </g>

        {/* Authentic Bitfoots 90° Pixel Footprint Emblem — Centered at (DIAL.cx, DIAL.cy), bisected so half is visible */}
        <g clipPath="url(#sr-half-clip-mk4)">
          <g
            transform={`translate(${DIAL.cx} ${DIAL.cy}) scale(2.0) translate(-173 -16.4)`}
            className="transition-all duration-300"
          >
            {/* Big Toe */}
            <path d="M177.09 0H182V6.55H177.09V0Z" fill="url(#sr-gold-rim)" filter="url(#sr-glow-amber)" />
            {/* Toe 2 */}
            <path d="M172.18 1.63H175.45V6.55H172.18V1.63Z" fill="url(#sr-gold-rim)" />
            {/* Toe 3 */}
            <path d="M167.27 3.27H170.54V6.55H167.27V3.27Z" fill="url(#sr-gold-rim)" />
            {/* Pinky Toe */}
            <path d="M164 4.91H165.63V6.55H164V4.91Z" fill="url(#sr-gold-rim)" />
            {/* Main Foot Pad */}
            <path d="M164 8.18H182V21.28H164V8.18Z" fill="url(#sr-gold-rim)" filter="url(#sr-glow-amber)" />
            {/* Heel */}
            <path d="M164 21.28H175.45V32.8H164V21.28Z" fill="url(#sr-gold-rim)" />

            {/* Glowing Anomaly Beacon on center axis */}
            <circle
              cx="173"
              cy="8"
              r="1.6"
              fill={isArmMoving ? "#ffddcc" : "#f3c85f"}
              filter="url(#sr-glow-amber)"
              className="animate-pulse"
            />
          </g>
        </g>

        {/* Closing Gold Border Line on Hub Centerline */}
        <line
          x1={DIAL.cx}
          y1={DIAL.cy - DIAL.rInner}
          x2={DIAL.cx}
          y2={DIAL.cy + DIAL.rInner}
          stroke="url(#sr-gold-rim)"
          strokeWidth="3.2"
        />
      </g>
    </svg>
  );

  /* ------------------------------------------------ Main Viewport Layout */

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. DESKTOP / TABLET DOCKED INSTRUMENT                                 */}
      {/* Sits flush against the far right edge of the page (right-0).          */}
      {/* ===================================================================== */}
      <aside
        aria-label="Sector roulette dial instrument"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 select-none md:flex items-center justify-end transition-all duration-400 ease-out ${
          isExpanded
            ? "w-[260px] h-[520px] drop-shadow-[-22px_0_44px_rgba(0,0,0,0.95)]"
            : "w-[185px] h-[370px] drop-shadow-[-12px_0_24px_rgba(0,0,0,0.85)]"
        } ${isHoverDisabled ? "pointer-events-none cursor-default" : "cursor-pointer"} ${
          isBlurred ? "pointer-events-none brightness-25 filter blur-md" : ""
        }`}
      >
        <div className="relative flex h-full w-full items-center justify-end overflow-visible">
          {/* Desktop Holographic Dossier HUD Slip (Sits directly left of the dial) */}
          <div
            aria-hidden={!isExpanded}
            className={`pointer-events-auto absolute right-full top-1/2 mr-3 -translate-y-1/2 transition-all duration-300 ease-out ${
              isExpanded && !isBlurred
                ? "translate-x-0 opacity-100 scale-100"
                : "translate-x-6 opacity-0 scale-95 pointer-events-none"
            }`}
          >
            {renderDossierCard()}
          </div>

          {/* The Dial Vector Canvas */}
          <div className="relative h-full w-full">{renderSvgDial()}</div>

          {/* Dial Notification Toast */}
          <div
            aria-hidden={notice === null}
            className={`pointer-events-none absolute bottom-4 left-0 max-w-[210px] transition-all duration-300 ${
              notice ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            {notice && (
              <div
                className={`rounded-lg border px-3 py-2 font-mono text-[9px] uppercase leading-snug tracking-wider backdrop-blur-md shadow-xl ${
                  notice.tone === "ok"
                    ? "border-[#7fc98f]/70 bg-[#07130c]/95 text-[#7fc98f]"
                    : "border-[#e07a6b]/70 bg-[#160a0a]/95 text-[#e07a6b]"
                }`}
              >
                {notice.text}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MOBILE RESPONSIVE RADAR: FLOATING RADAR BEACON & BOTTOM SHEET       */}
      {/* ===================================================================== */}
      <div className="block md:hidden">
        {/* Floating Action Radar Trigger (Bottom Right of screen) */}
        {!isBlurred && !isHoverDisabled && (
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open expedition sector radar"
            className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#eaba49] bg-[#0c1015]/95 p-2 text-[#eaba49] shadow-[0_0_24px_rgba(234,186,73,0.35)] backdrop-blur-md transition-all active:scale-95"
          >
            <div className="relative flex flex-col items-center">
              <Compass className="h-5 w-5 text-[#eaba49]" />
              <span className="mt-0.5 font-mono text-[11px] font-black tracking-wider text-[#ffddcc]">
                {currentSector.shortCode}
              </span>
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#7fc98f] animate-ping" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#7fc98f]" />
            </div>
          </button>
        )}

        {/* Mobile Radar Drawer Overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-[#eaba49]/60 bg-[#0d1117] p-5 shadow-[0_0_50px_rgba(0,0,0,0.95)]">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#3a475c] bg-[#141a24] text-[#aab6c9] hover:text-[#ffddcc]"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title Header */}
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#eaba49]">
                <Radio className="h-3.5 w-3.5 animate-pulse text-[#eaba49]" />
                <span>EXPEDITION RADAR MK-IV</span>
              </div>

              {/* Centered Dial Container */}
              <div className="relative my-2 h-[280px] w-[150px] overflow-visible">
                {renderSvgDial()}
              </div>

              {/* Dossier Card Integrated for Mobile */}
              <div className="w-full mt-2">{renderDossierCard()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Accessibility Screen-Reader Live Log */}
      <span aria-live="polite" className="sr-only">
        {notice ? notice.text : ""}
      </span>
    </>
  );
};

export default SectorRoulette;
