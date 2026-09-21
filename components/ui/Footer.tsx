"use client";
import React from "react";
import {
  Compass,
  Radio,
  Share2,
  ArrowUpRight,
  Lock,
  Zap,
  ShieldCheck,
  BookOpen,
  RotateCw,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useFieldTelemetry } from "@/hooks/useFieldTelemetry";

interface FooterProps {
  onOpenLeaderboard?: () => void;
  onOpenAbout?: () => void;
  onOpenLogin?: () => void;
  onSwitchChapter: (chapterId: 1 | 2 | 3) => void;
  activeChapter: 1 | 2 | 3;
  unlockedSectors?: number[];
  currentUsername?: string;
  currentUserId?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLeaderboard,
  onOpenAbout,
  onOpenLogin,
  onSwitchChapter,
  activeChapter,
  unlockedSectors = [1],
  currentUsername,
  currentUserId,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Live Field Telemetry Engine
  const {
    onlineHunters,
    btcBlock,
    zkStatus,
    apexRecord,
    currentIndex,
    totalSightings,
    latestDispatch,
    isLive,
    isSyncing,
    hasNewApex,
    setIsPaused,
    nextSighting,
    prevSighting,
    refreshTelemetry,
  } = useFieldTelemetry({
    currentUsername,
    currentUserId,
  });

  return (
    <footer className="w-full bg-[#0d1014]/95 backdrop-blur-md border-t border-[#3a475c]/70 relative z-20 overflow-hidden text-[#aab6c9] mt-6">
      {/* Radiant Top Gold Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#eaba49]/70 to-transparent" />

      {/* Main Footer Content Container */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col md:flex-row md:flex-wrap xl:flex-nowrap justify-between gap-8 items-start">
          {/* ============================================================ */}
          {/* Column 1: Institutional Identity & Mission                   */}
          {/* ============================================================ */}
          <div className="w-full md:w-[calc(50%-1.25rem)] xl:w-[274px] xl:shrink-0 space-y-4">
            <div
              onClick={scrollToTop}
              className="flex items-center space-x-3 cursor-pointer select-none group inline-flex"
            >
              {/* BitFoots 90° Pixel Footprint Seal */}
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1f26] to-[#0f1216] flex items-center justify-center text-[#eaba49] shadow-lg shadow-[#eaba49]/10 group-hover:scale-105 transition-all overflow-hidden shrink-0">
                <svg
                  viewBox="163 0 20 34"
                  className="w-4 h-6 text-[#eaba49] group-hover:text-[#f3c85f] transition-colors drop-shadow-[0_0_6px_rgba(234,186,73,0.6)]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M177.09 0H182V6.55H177.09V0Z" fill="currentColor" />
                  <path d="M172.18 1.63H175.45V6.55H172.18V1.63Z" fill="currentColor" />
                  <path d="M167.27 3.27H170.54V6.55H167.27V3.27Z" fill="currentColor" />
                  <path d="M164 4.91H165.63V6.55H164V4.91Z" fill="currentColor" />
                  <path d="M164 8.18H182V21.28H164V8.18Z" fill="currentColor" />
                  <path d="M164 21.28H175.45V32.8H164V21.28Z" fill="currentColor" />
                </svg>
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#eaba49] animate-ping" />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#eaba49]" />
              </div>

              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg tracking-[0.16em] text-[#ffddcc] uppercase group-hover:text-white transition-colors">
                  BITFOOTS
                </span>
                <span className="text-[9px] font-mono tracking-[0.2em] text-[#eaba49] uppercase">
                  THE CRYPTID INSTITUTE
                </span>
              </div>
            </div>

            <p className="text-xs text-[#aab6c9] leading-relaxed">
              An autonomous cryptographic field experiment exploring shielded digital cryptids. Inscribed on Bitcoin Ordinals and concealed within Zcash's zero-knowledge pool.
            </p>

            <div className="flex items-center flex-wrap gap-2 pt-1">
              <span className="bitfoots-chip bitfoots-chip--solid text-[10px] py-0.5 px-2.5">
                SERIES 303
              </span>
              {onOpenAbout && (
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="px-2 py-0.5 rounded text-[10px] font-mono text-[#eaba49] hover:text-[#ffddcc] bg-[#eaba49]/10 hover:bg-[#eaba49]/20 border border-[#eaba49]/40 transition-colors flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>FIELD DOSSIER</span>
                </button>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* Column 2: Expedition Sectors (Telemetry Overview)            */}
          {/* ============================================================ */}
          <div className="w-full md:w-[calc(50%-1.25rem)] xl:w-[274px] xl:shrink-0 space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-[0.2em] text-[#ffddcc] uppercase flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-[#eaba49]" />
              <span>EXPEDITION SECTORS</span>
            </h4>

            <p className="text-xs text-[#aab6c9] leading-relaxed">
              Cryptographic survey sectors and anomalous trace requirements across the expedition.
            </p>

            <ul className="space-y-1.5 pt-1 font-mono text-xs">
              {[
                { id: 1 as const, name: "Sector 01: Forest", metric: "8 Traces" },
                { id: 2 as const, name: "Sector 02: 90° Grid", metric: "6 Nodes" },
                { id: 3 as const, name: "Sector 03: Shielded ZK (FINAL)", metric: "6 ZK Nodes" },
              ].map((sec) => {
                const isActive = activeChapter === sec.id;

                return (
                  <li key={sec.id}>
                    <div
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all select-none ${
                        isActive
                          ? "bg-[#161c24] border-[#eaba49] text-[#eaba49] font-bold shadow-[0_0_12px_rgba(234,186,73,0.12)]"
                          : "bg-[#0f1216] border-[#3a475c] text-[#aab6c9]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isActive ? "bg-[#eaba49] animate-pulse" : "bg-[#3a475c]"
                          }`}
                        />
                        <span className="truncate">{sec.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-normal shrink-0 ml-1 ${
                          isActive ? "text-[#f3c85f]" : "text-[#7d8898]"
                        }`}
                      >
                        {sec.metric}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ============================================================ */}
          {/* Column 3: Connect (X & Telegram)                             */}
          {/* ============================================================ */}
          <div className="w-full md:w-[calc(50%-1.25rem)] xl:w-[274px] xl:shrink-0 space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-[0.2em] text-[#ffddcc] uppercase flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-[#eaba49]" />
              <span>CONNECT</span>
            </h4>

            <p className="text-xs text-[#aab6c9] leading-relaxed">
              Join our field dispatch network and follow real-time cryptid transmission logs across encrypted communication channels.
            </p>

            <div className="space-y-2 pt-1">
              {/* X (Twitter) Link */}
              <a
                href="https://x.com/BITFOOTS_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f1216] hover:bg-[#1a1f26] border border-[#3a475c] hover:border-[#eaba49] transition-all group shadow-sm"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-black/60 border border-[#3a475c] flex items-center justify-center text-[#ffddcc] group-hover:text-[#eaba49] group-hover:border-[#eaba49]/50 transition-colors">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-mono font-bold text-[#ffddcc] group-hover:text-white transition-colors">
                      X
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#7d8898] group-hover:text-[#eaba49] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>

              {/* Telegram (TG) Link */}
              <a
                href="https://t.me/bitfoots"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f1216] hover:bg-[#1a1f26] border border-[#3a475c] hover:border-[#eaba49] transition-all group shadow-sm"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-black/60 border border-[#3a475c] flex items-center justify-center text-[#ffddcc] group-hover:text-[#eaba49] group-hover:border-[#eaba49]/50 transition-colors">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.673c.458 0 .66-.21.916-.457l2.199-2.138 4.574 3.379c.843.465 1.45.226 1.66-.783l2.998-14.128c.308-1.233-.472-1.794-1.278-1.429z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-mono font-bold text-[#ffddcc] group-hover:text-white transition-colors">
                      Telegram
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#7d8898] group-hover:text-[#eaba49] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Column 4: Live Telemetry & Field Status                      */}
          {/* ============================================================ */}
          <div className="w-full md:w-[calc(50%-1.25rem)] xl:w-[420px] xl:shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold tracking-[0.2em] text-[#ffddcc] uppercase flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#7fc98f] animate-pulse" />
                <span>LIVE FIELD TELEMETRY</span>
              </h4>

              {/* Live Signal Status Badge & Refresh Button */}
              <div className="flex items-center space-x-2">
                <div
                  className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#121921] border border-[#3a475c]/60 text-[10px] font-mono select-none"
                  title={isLive ? "Connected to Supabase Realtime Telemetry Grid" : "Autonomous Field Telemetry Drift"}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7fc98f] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7fc98f]" />
                  </span>
                  <span className="text-[#7fc98f] font-semibold tracking-wider">
                    {isLive ? "LIVE SYNC" : "ACTIVE"}
                  </span>
                </div>

                <button
                  onClick={refreshTelemetry}
                  disabled={isSyncing}
                  className="p-1 rounded-lg bg-[#121921] border border-[#3a475c]/60 text-[#7d8898] hover:text-[#eaba49] hover:border-[#eaba49]/40 transition-colors disabled:opacity-50"
                  title="Resync Telemetry Packets"
                >
                  <RotateCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-[#eaba49]" : ""}`} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0a0d11] border border-[#3a475c]/70 space-y-3 font-mono text-[11px] relative overflow-hidden shadow-lg shadow-black/40">
              {/* Subtle Scanning Line Animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7fc98f]/[0.02] to-transparent pointer-events-none opacity-50" />

              {/* 1. Live Active Hunters */}
              <div className="flex items-center justify-between border-b border-[#3a475c]/40 pb-2.5">
                <span className="text-[#7d8898] flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#7fc98f]" />
                  ACTIVE IN FIELD
                </span>
                <span className="text-[#7fc98f] font-bold tracking-wider flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7fc98f] animate-pulse" />
                  {onlineHunters} HUNTERS
                </span>
              </div>

              {/* 2. Latest Sighting Log (Interactive Rotating Feed & Ticker) */}
              <div
                className="flex items-center justify-between border-b border-[#3a475c]/40 pb-2.5 overflow-hidden group/ticker"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[#7d8898] whitespace-nowrap">
                    LATEST SIGHTING
                  </span>
                  {totalSightings > 1 && (
                    <span className="text-[9px] text-[#7d8898]/70 font-mono">
                      [{currentIndex + 1}/{totalSightings}]
                    </span>
                  )}
                </div>

                <div className="relative flex-1 ml-3 h-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                  <div
                    key={currentIndex}
                    className="animate-telemetry-slide-right text-[#ffddcc] font-medium group-hover/ticker:[animation-play-state:paused] cursor-default transition-all"
                    title={latestDispatch}
                  >
                    {latestDispatch}
                  </div>
                </div>

                {/* Sighting navigation controls on hover */}
                {totalSightings > 1 && (
                  <div className="flex items-center space-x-0.5 ml-1.5 opacity-0 group-hover/ticker:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevSighting();
                      }}
                      className="p-0.5 text-[#7d8898] hover:text-[#eaba49] transition-colors"
                      title="Previous sighting"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextSighting();
                      }}
                      className="p-0.5 text-[#7d8898] hover:text-[#eaba49] transition-colors"
                      title="Next sighting"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Apex Record (Clickable to open Leaderboard) */}
              <div
                onClick={onOpenLeaderboard}
                className={`flex items-center justify-between border-b border-[#3a475c]/40 pb-2 cursor-pointer group hover:bg-[#161c24]/80 p-1 -mx-1 rounded transition-all ${
                  hasNewApex ? "ring-1 ring-[#eaba49] bg-[#eaba49]/10" : ""
                }`}
                title="View Full Expedition Leaderboard"
              >
                <span className="text-[#7d8898] group-hover:text-[#ffddcc] transition-colors flex items-center gap-1.5">
                  <span className="text-[#eaba49]">▲</span>
                  APEX RECON RECORD
                </span>
                <span className="text-[#eaba49] font-bold group-hover:text-[#f3c85f] transition-colors flex items-center gap-1.5">
                  <span>{apexRecord.time}</span>
                  <span className="text-[9px] text-[#7d8898] font-normal">({apexRecord.name})</span>
                  <span className="px-1 py-0.2 rounded bg-[#eaba49]/15 border border-[#eaba49]/30 text-[9px] text-[#eaba49]">
                    {apexRecord.points}P
                  </span>
                </span>
              </div>

              {/* 4. Live Bitcoin Block Height & ZK Pool */}
              <div className="flex items-center justify-between">
                <span className="text-[#7d8898] flex items-center gap-1.5">
                  NETWORK LEDGER
                </span>
                <span className="text-[#aab6c9] font-semibold text-right flex items-center gap-1.5">
                  <span className="text-[#ffddcc]">BTC #{btcBlock}</span>
                  <span className="text-[#7fc98f] text-[10px] flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7fc98f]" />
                    {zkStatus}
                  </span>
                </span>
              </div>
            </div>

            {/* Iconic BitFoots Philosophy Lore Quote */}
            <p className="text-[12px] font-serif italic text-[#eaba49]/90 leading-relaxed border-l-2 border-[#eaba49]/50 pl-3">
              "Never caught. You don't buy a Bitfoot, you spot him."
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Bottom Legal & Attribution Strip                             */}
        {/* ============================================================ */}
        <div className="mt-10 pt-6 border-t border-[#3a475c]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#7d8898]">
          <div className="flex items-center space-x-2">
            <span>© 2026 The Cryptid Institute.</span>
            <span className="text-[#3a475c]">•</span>
            <span>Bitfoots Series 303.</span>
            <span className="text-[#3a475c] hidden sm:inline">•</span>
            <span className="hidden sm:inline">All anomalous coordinates reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-2">
            {onOpenAbout && (
              <>
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="text-[#ffddcc] hover:text-[#eaba49] transition-colors underline underline-offset-2"
                >
                  Field Dossier (Archive)
                </button>
                <span className="text-[#3a475c]">•</span>
              </>
            )}
            <span className="text-[#3a475c] hidden md:inline">•</span>
            <span className="text-[#ffddcc]/60 hidden lg:inline">ZCASH SHIELDED POOL + BITCOIN ORDINALS</span>
            <span className="text-[#3a475c]">•</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="text-[#eaba49] hover:text-[#f3c85f] transition-colors underline underline-offset-2"
            >
              Back to Deck ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
