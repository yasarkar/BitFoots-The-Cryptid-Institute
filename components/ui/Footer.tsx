"use client";
import React from "react";
import {
  Compass,
  Radio,
  Share2,
  ArrowUpRight,
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
    <footer className="relative z-20 mt-6 w-full overflow-hidden border-t border-[#3a475c]/70 bg-[#0d1014]/95 text-[#aab6c9] backdrop-blur-md">
      {/* Radiant Top Gold Accent Line */}
      <div className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#eaba49]/70 to-transparent" />

      {/* Main Footer Content Container */}
      <div className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:flex-wrap xl:flex-nowrap">
          {/* ============================================================ */}
          {/* Column 1: Institutional Identity & Mission                   */}
          {/* ============================================================ */}
          <div className="w-full space-y-4 md:w-[calc(50%-1.25rem)] xl:w-[274px] xl:shrink-0">
            <div
              onClick={scrollToTop}
              className="group flex inline-flex cursor-pointer select-none items-center space-x-3"
            >
              {/* BitFoots 90° Pixel Footprint Seal */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1f26] to-[#0f1216] text-[#eaba49] shadow-lg shadow-[#eaba49]/10 transition-all group-hover:scale-105">
                <svg
                  viewBox="163 0 20 34"
                  className="h-6 w-4 text-[#eaba49] drop-shadow-[0_0_6px_rgba(234,186,73,0.6)] transition-colors group-hover:text-[#f3c85f]"
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
                <div className="absolute -right-1 -top-1 h-2 w-2 animate-ping rounded-full bg-[#eaba49]" />
                <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#eaba49]" />
              </div>

              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold uppercase tracking-[0.16em] text-[#ffddcc] transition-colors group-hover:text-white">
                  BITFOOTS
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#eaba49]">
                  THE CRYPTID INSTITUTE
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#aab6c9]">
              An autonomous cryptographic field experiment exploring shielded digital cryptids. Inscribed on
              Bitcoin Ordinals and concealed within Zcash's zero-knowledge pool.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="bitfoots-chip bitfoots-chip--solid px-2.5 py-0.5 text-[10px]">SERIES 303</span>
              {onOpenAbout && (
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="flex items-center gap-1 rounded border border-[#eaba49]/40 bg-[#eaba49]/10 px-2 py-0.5 font-mono text-[10px] text-[#eaba49] transition-colors hover:bg-[#eaba49]/20 hover:text-[#ffddcc]"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>FIELD DOSSIER</span>
                </button>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* Column 2: Expedition Sectors (Telemetry Overview)            */}
          {/* ============================================================ */}
          <div className="w-full space-y-3 md:w-[calc(50%-1.25rem)] xl:w-[274px] xl:shrink-0">
            <h4 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#ffddcc]">
              <Compass className="h-3.5 w-3.5 text-[#eaba49]" />
              <span>EXPEDITION SECTORS</span>
            </h4>

            <p className="text-xs leading-relaxed text-[#aab6c9]">
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
                      className={`flex w-full select-none items-center justify-between rounded-xl border p-2 text-left transition-all ${
                        isActive
                          ? "border-[#eaba49] bg-[#161c24] font-bold text-[#eaba49] shadow-[0_0_12px_rgba(234,186,73,0.12)]"
                          : "border-[#3a475c] bg-[#0f1216] text-[#aab6c9]"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            isActive ? "animate-pulse bg-[#eaba49]" : "bg-[#3a475c]"
                          }`}
                        />
                        <span className="truncate">{sec.name}</span>
                      </div>
                      <span
                        className={`ml-1 shrink-0 text-[10px] font-normal ${
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
          <div className="w-full space-y-3 md:w-[calc(50%-1.25rem)] xl:w-[274px] xl:shrink-0">
            <h4 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#ffddcc]">
              <Share2 className="h-3.5 w-3.5 text-[#eaba49]" />
              <span>CONNECT</span>
            </h4>

            <p className="text-xs leading-relaxed text-[#aab6c9]">
              Join our field dispatch network and follow real-time cryptid transmission logs across encrypted
              communication channels.
            </p>

            <div className="space-y-2 pt-1">
              {/* X (Twitter) Link */}
              <a
                href="https://x.com/BITFOOTS_"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-[#3a475c] bg-[#0f1216] p-2.5 shadow-sm transition-all hover:border-[#eaba49] hover:bg-[#1a1f26]"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#3a475c] bg-black/60 text-[#ffddcc] transition-colors group-hover:border-[#eaba49]/50 group-hover:text-[#eaba49]">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-mono text-xs font-bold text-[#ffddcc] transition-colors group-hover:text-white">
                      X
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#7d8898] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#eaba49]" />
              </a>

              {/* Telegram (TG) Link */}
              <a
                href="https://t.me/bitfoots"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-[#3a475c] bg-[#0f1216] p-2.5 shadow-sm transition-all hover:border-[#eaba49] hover:bg-[#1a1f26]"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#3a475c] bg-black/60 text-[#ffddcc] transition-colors group-hover:border-[#eaba49]/50 group-hover:text-[#eaba49]">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.313 4.673c.458 0 .66-.21.916-.457l2.199-2.138 4.574 3.379c.843.465 1.45.226 1.66-.783l2.998-14.128c.308-1.233-.472-1.794-1.278-1.429z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-mono text-xs font-bold text-[#ffddcc] transition-colors group-hover:text-white">
                      Telegram
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#7d8898] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#eaba49]" />
              </a>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Column 4: Live Telemetry & Field Status                      */}
          {/* ============================================================ */}
          <div className="w-full space-y-3 md:w-[calc(50%-1.25rem)] xl:w-[420px] xl:shrink-0">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#ffddcc]">
                <Radio className="h-3.5 w-3.5 animate-pulse text-[#7fc98f]" />
                <span>LIVE FIELD TELEMETRY</span>
              </h4>

              {/* Live Signal Status Badge & Refresh Button */}
              <div className="flex items-center space-x-2">
                <div
                  className="flex select-none items-center space-x-1.5 rounded-full border border-[#3a475c]/60 bg-[#121921] px-2 py-0.5 font-mono text-[10px]"
                  title={
                    isLive
                      ? "Connected to Supabase Realtime Telemetry Grid"
                      : "Autonomous Field Telemetry Drift"
                  }
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7fc98f] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7fc98f]" />
                  </span>
                  <span className="font-semibold tracking-wider text-[#7fc98f]">
                    {isLive ? "LIVE SYNC" : "ACTIVE"}
                  </span>
                </div>

                <button
                  onClick={refreshTelemetry}
                  disabled={isSyncing}
                  className="rounded-lg border border-[#3a475c]/60 bg-[#121921] p-1 text-[#7d8898] transition-colors hover:border-[#eaba49]/40 hover:text-[#eaba49] disabled:opacity-50"
                  title="Resync Telemetry Packets"
                >
                  <RotateCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-[#eaba49]" : ""}`} />
                </button>
              </div>
            </div>

            <div className="relative space-y-3 overflow-hidden rounded-xl border border-[#3a475c]/70 bg-[#0a0d11] p-4 font-mono text-[11px] shadow-lg shadow-black/40">
              {/* Subtle Scanning Line Animation */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#7fc98f]/[0.02] to-transparent opacity-50" />

              {/* 1. Live Active Hunters */}
              <div className="flex items-center justify-between border-b border-[#3a475c]/40 pb-2.5">
                <span className="flex items-center gap-1.5 text-[#7d8898]">
                  <Activity className="h-3 w-3 text-[#7fc98f]" />
                  ACTIVE IN FIELD
                </span>
                <span className="flex items-center gap-1.5 font-bold tracking-wider text-[#7fc98f]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#7fc98f]" />
                  {onlineHunters} HUNTERS
                </span>
              </div>

              {/* 2. Latest Sighting Log (Interactive Rotating Feed & Ticker) */}
              <div
                className="group/ticker flex items-center justify-between overflow-hidden border-b border-[#3a475c]/40 pb-2.5"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div className="flex shrink-0 items-center gap-1">
                  <span className="whitespace-nowrap text-[#7d8898]">LATEST SIGHTING</span>
                  {totalSightings > 1 && (
                    <span className="font-mono text-[9px] text-[#7d8898]/70">
                      [{currentIndex + 1}/{totalSightings}]
                    </span>
                  )}
                </div>

                <div className="relative ml-3 h-4 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                  <div
                    key={currentIndex}
                    className="animate-telemetry-slide-right cursor-default font-medium text-[#ffddcc] transition-all group-hover/ticker:[animation-play-state:paused]"
                    title={latestDispatch}
                  >
                    {latestDispatch}
                  </div>
                </div>

                {/* Sighting navigation controls on hover */}
                {totalSightings > 1 && (
                  <div className="ml-1.5 flex items-center space-x-0.5 opacity-0 transition-opacity group-hover/ticker:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevSighting();
                      }}
                      className="p-0.5 text-[#7d8898] transition-colors hover:text-[#eaba49]"
                      title="Previous sighting"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextSighting();
                      }}
                      className="p-0.5 text-[#7d8898] transition-colors hover:text-[#eaba49]"
                      title="Next sighting"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Apex Record (Clickable to open Leaderboard) */}
              <div
                onClick={onOpenLeaderboard}
                className={`group -mx-1 flex cursor-pointer items-center justify-between rounded border-b border-[#3a475c]/40 p-1 pb-2 transition-all hover:bg-[#161c24]/80 ${
                  hasNewApex ? "bg-[#eaba49]/10 ring-1 ring-[#eaba49]" : ""
                }`}
                title="View Full Expedition Leaderboard"
              >
                <span className="flex items-center gap-1.5 text-[#7d8898] transition-colors group-hover:text-[#ffddcc]">
                  <span className="text-[#eaba49]">▲</span>
                  APEX RECON RECORD
                </span>
                <span className="flex items-center gap-1.5 font-bold text-[#eaba49] transition-colors group-hover:text-[#f3c85f]">
                  <span>{apexRecord.time}</span>
                  <span className="text-[9px] font-normal text-[#7d8898]">({apexRecord.name})</span>
                  <span className="py-0.2 rounded border border-[#eaba49]/30 bg-[#eaba49]/15 px-1 text-[9px] text-[#eaba49]">
                    {apexRecord.points}P
                  </span>
                </span>
              </div>

              {/* 4. Live Bitcoin Block Height & ZK Pool */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#7d8898]">NETWORK LEDGER</span>
                <span className="flex items-center gap-1.5 text-right font-semibold text-[#aab6c9]">
                  <span className="text-[#ffddcc]">BTC #{btcBlock}</span>
                  <span className="flex items-center gap-1 text-[10px] text-[#7fc98f]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7fc98f]" />
                    {zkStatus}
                  </span>
                </span>
              </div>
            </div>

            {/* Iconic BitFoots Philosophy Lore Quote */}
            <p className="border-l-2 border-[#eaba49]/50 pl-3 font-serif text-[12px] italic leading-relaxed text-[#eaba49]/90">
              "Never caught. You don't buy a Bitfoot, you spot him."
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Bottom Legal & Attribution Strip                             */}
        {/* ============================================================ */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#3a475c]/60 pt-6 font-mono text-[11px] text-[#7d8898] sm:flex-row">
          <div className="flex items-center space-x-2">
            <span>© 2026 The Cryptid Institute.</span>
            <span className="text-[#3a475c]">•</span>
            <span>Bitfoots Series 303.</span>
            <span className="hidden text-[#3a475c] sm:inline">•</span>
            <span className="hidden sm:inline">All anomalous coordinates reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-2">
            {onOpenAbout && (
              <>
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="text-[#ffddcc] underline underline-offset-2 transition-colors hover:text-[#eaba49]"
                >
                  Field Dossier (Archive)
                </button>
                <span className="text-[#3a475c]">•</span>
              </>
            )}
            <span className="hidden text-[#3a475c] md:inline">•</span>
            <span className="hidden text-[#ffddcc]/60 lg:inline">ZCASH SHIELDED POOL + BITCOIN ORDINALS</span>
            <span className="text-[#3a475c]">•</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="text-[#eaba49] underline underline-offset-2 transition-colors hover:text-[#f3c85f]"
            >
              Back to Deck ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
