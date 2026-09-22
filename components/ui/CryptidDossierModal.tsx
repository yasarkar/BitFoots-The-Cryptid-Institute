"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ExternalLink,
  X,
  Footprints,
  Eye,
  Binary,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Radio,
  Terminal,
} from "lucide-react";
import { audioManager } from "@/lib/audioManager";

interface CryptidDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "manifesto" | "specimens" | "dualchain" | "hunt";

// Curated specimen registry data representing Series 303 field sightings
const SPECIMEN_REGISTRY = [
  {
    id: "001",
    file: "/bitfoot-heads/bitfoot-head-01.png",
    name: "Apex Sylva Alpha",
    classification: "Sylva Cryptus Prime",
    habitat: "Sector 03 // Deep Abyssal Pines",
    anomalyIndex: "98.4%",
    signature: "Cold Phosphor Glow",
    provenance: "Ordinal Inscription #303-01 // Shielded u1",
    description:
      "The progenitor specimen. First spotted in the ancient old-growth pines. Emits a faint 432Hz harmonic frequency that causes compass needles to drift 90°.",
  },
  {
    id: "004",
    file: "/bitfoot-heads/bitfoot-head-04.png",
    name: "Golden Canopy Lurker",
    classification: "Arbor Umbra Aureus",
    habitat: "Sector 02 // Geometric Timberland",
    anomalyIndex: "94.8%",
    signature: "Amber Optical Flare",
    provenance: "Ordinal Inscription #303-04 // Shielded u1",
    description:
      "Characterized by high-contrast amber eye luminescence. Never leaves ground footprints; glides between dense pine boughs with zero acoustic footprint.",
  },
  {
    id: "007",
    file: "/bitfoot-heads/bitfoot-head-07.png",
    name: "Obsidian Nomad",
    classification: "Nocturnus Cryptus V",
    habitat: "Sector 01 // Mist Perimeter",
    anomalyIndex: "91.2%",
    signature: "Thermal Absorption Zero",
    provenance: "Ordinal Inscription #303-07 // Shielded u1",
    description:
      "Absorbs ambient light within a 4-meter radius. Only visible when backlit by lunar rays or retro-crt radar sweeps. Extreme camouflage adept.",
  },
  {
    id: "010",
    file: "/bitfoot-heads/bitfoot-head-10.png",
    name: "Emerald Spore Keeper",
    classification: "Bio-Verdant Anomaly",
    habitat: "Sector 03 // Lichen Basin",
    anomalyIndex: "96.5%",
    signature: "Bioluminescent Mycelia",
    provenance: "Ordinal Inscription #303-10 // Shielded u1",
    description:
      "Symbiotically fused with pre-carboniferous forest mosses. Discovered in an unmapped ravine surrounded by ring formations of glowing mushrooms.",
  },
  {
    id: "013",
    file: "/bitfoot-heads/bitfoot-head-13.png",
    name: "Cipher Shaman",
    classification: "Synthetica ZK Apex",
    habitat: "Sector 02 // Boundary Glade",
    anomalyIndex: "99.1%",
    signature: "Zero-Knowledge Wavefront",
    provenance: "Ordinal Inscription #303-13 // Shielded u1",
    description:
      "An anomalous entity exhibiting geometric pixel shifts. When observed directly, observers report hearing synthesized sine oscillations.",
  },
  {
    id: "018",
    file: "/bitfoot-heads/bitfoot-head-18.png",
    name: "Midnight Wayfarer",
    classification: "Solitarius Prime",
    habitat: "Sector 03 // Abyssal Ridge",
    anomalyIndex: "97.9%",
    signature: "Spectral Radar Echo",
    provenance: "Ordinal Inscription #303-18 // Shielded u1",
    description:
      "Spotted only once during the winter solstice. Possesses characteristic asymmetric golden horns and an ancient, contemplative gaze.",
  },
];

export const CryptidDossierModal: React.FC<CryptidDossierModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("manifesto");
  const [selectedSpecimenIdx, setSelectedSpecimenIdx] = useState<number>(0);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSpecimen = SPECIMEN_REGISTRY[selectedSpecimenIdx];

  const handleTabChange = (tab: TabType) => {
    audioManager.playFootprintCollect();
    setActiveTab(tab);
  };

  const handleNextSpecimen = () => {
    audioManager.playSecretDiscovered();
    setSelectedSpecimenIdx((prev) => (prev + 1) % SPECIMEN_REGISTRY.length);
  };

  const handlePrevSpecimen = () => {
    audioManager.playSecretDiscovered();
    setSelectedSpecimenIdx((prev) => (prev - 1 + SPECIMEN_REGISTRY.length) % SPECIMEN_REGISTRY.length);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 backdrop-blur-md duration-200 sm:p-4 md:p-6"
    >
      <div className="bitfoots-glass-card relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#eaba49]/70 bg-[#14171c]/95 font-sans text-[#aab6c9] shadow-2xl">
        {/* ============================================================ */}
        {/* Top Classified Header Bar                                    */}
        {/* ============================================================ */}
        <div className="relative flex items-center justify-between border-b border-[#3a475c]/70 bg-[#0f1216]/90 px-4 py-4 sm:px-6">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#eaba49]/50 bg-[#eaba49]/15 text-[#eaba49] shadow-[0_0_12px_rgba(234,186,73,0.25)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2"></div>
              <h2 className="mt-0.5 font-serif text-base font-medium tracking-wide text-[#ffddcc] sm:text-xl">
                The Cryptid Institute // Archival Field Dossier
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                audioManager.playFootprintCollect();
                onClose();
              }}
              aria-label="Close Archival Dossier"
              className="rounded-lg border border-[#3a475c] bg-[#0f1216] p-2 text-[#7d8898] transition-all hover:border-[#e07a6b]/60 hover:bg-[#e07a6b]/20 hover:text-[#e07a6b]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Archival Navigation Tabs (Single Row with Unified Border)    */}
        {/* ============================================================ */}
        <div className="relative z-10 w-full border-b border-[#3a475c] bg-[#0c0e12]/95">
          <div className="grid w-full grid-cols-4">
            <button
              onClick={() => handleTabChange("manifesto")}
              className={`-mb-[1px] flex select-none items-center justify-center border-b-2 px-1 py-3 text-center font-mono text-[10px] tracking-wider transition-all sm:px-3 sm:py-3.5 sm:text-xs ${
                activeTab === "manifesto"
                  ? "border-[#eaba49] bg-[#eaba49]/10 font-bold text-[#ffddcc]"
                  : "border-transparent text-[#7d8898] hover:bg-[#1a1f26]/40 hover:text-[#eaba49]"
              }`}
            >
              <span className="hidden lg:inline">[01] MANIFESTO & ORIGINS</span>
              <span className="lg:hidden">[01] MANIFESTO</span>
            </button>

            <button
              onClick={() => handleTabChange("specimens")}
              className={`-mb-[1px] flex select-none items-center justify-center border-b-2 px-1 py-3 text-center font-mono text-[10px] tracking-wider transition-all sm:px-3 sm:py-3.5 sm:text-xs ${
                activeTab === "specimens"
                  ? "border-[#eaba49] bg-[#eaba49]/10 font-bold text-[#ffddcc]"
                  : "border-transparent text-[#7d8898] hover:bg-[#1a1f26]/40 hover:text-[#eaba49]"
              }`}
            >
              <span className="hidden lg:inline">[02] SPECIMEN SERIES 303</span>
              <span className="lg:hidden">[02] SERIES 303</span>
            </button>

            <button
              onClick={() => handleTabChange("dualchain")}
              className={`-mb-[1px] flex select-none items-center justify-center border-b-2 px-1 py-3 text-center font-mono text-[10px] tracking-wider transition-all sm:px-3 sm:py-3.5 sm:text-xs ${
                activeTab === "dualchain"
                  ? "border-[#eaba49] bg-[#eaba49]/10 font-bold text-[#ffddcc]"
                  : "border-transparent text-[#7d8898] hover:bg-[#1a1f26]/40 hover:text-[#eaba49]"
              }`}
            >
              <span className="hidden lg:inline">[03] DUAL-CHAIN PROTOCOL</span>
              <span className="lg:hidden">[03] DUAL-CHAIN</span>
            </button>

            <button
              onClick={() => handleTabChange("hunt")}
              className={`-mb-[1px] flex select-none items-center justify-center border-b-2 px-1 py-3 text-center font-mono text-[10px] tracking-wider transition-all sm:px-3 sm:py-3.5 sm:text-xs ${
                activeTab === "hunt"
                  ? "border-[#eaba49] bg-[#eaba49]/10 font-bold text-[#ffddcc]"
                  : "border-transparent text-[#7d8898] hover:bg-[#1a1f26]/40 hover:text-[#eaba49]"
              }`}
            >
              <span className="hidden lg:inline">[04] THE HUNT CLEARANCE</span>
              <span className="lg:hidden">[04] THE HUNT</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Main Body Content                                            */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 text-xs sm:p-6 sm:text-sm">
          {/* TAB 1: MANIFESTO & ORIGINS */}
          {activeTab === "manifesto" && (
            <div className="animate-in fade-in space-y-6 duration-200">
              {/* Central Creed Callout */}
              <div className="relative overflow-hidden rounded-xl border border-[#eaba49]/50 bg-[#0f1216] p-5 shadow-lg">
                <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-10">
                  <Footprints className="h-36 w-36 text-[#eaba49]" />
                </div>
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-[#eaba49]">
                  The Institute Axiom
                </span>
                <p className="font-serif text-base italic leading-relaxed text-[#ffddcc] sm:text-lg">
                  "Never caught. You don’t buy a Bitfoot, you spot him. The only price is the hunt. Specimens
                  are never captured, only observed. Mathematical proof of existence without exposing
                  identity. Preserved on Bitcoin, shielded by Zcash."
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#3a475c]/50 pt-2.5 font-mono text-[11px] text-[#7d8898]">
                  <span>— The Cryptid Institute // Field Directive (Series 303)</span>
                  <span className="font-bold text-[#eaba49]">EST. 2026 // EXPEDITION BUREAU</span>
                </div>
              </div>

              {/* Two Column Narrative Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="p-4.5 space-y-2.5 rounded-xl border border-[#3a475c]/70 bg-[#1a1f26]/80">
                  <div className="m-3 flex items-center space-x-2 text-[#eaba49]">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#ffddcc]">
                      Forest Noir & 19th-Century Naturalism
                    </h3>
                  </div>
                  <p className="m-3 text-[12px] leading-relaxed text-[#aab6c9]">
                    BITFOOTS repudiates the sterile corporate aesthetics of modern Web3. Our visual language
                    is born from the weathered pages of Victorian naturalist journals, midnight pine fog, and
                    CRT phosphor glows. In these uncharted sectors, the cryptid is not a speculative
                    commodity, but a myth to be stalked through field reconnaissance.
                  </p>
                </div>

                <div className="p-4.5 space-y-2.5 rounded-xl border border-[#3a475c]/70 bg-[#1a1f26]/80">
                  <div className="m-3 flex items-center space-x-2 text-[#7fc98f]">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#ffddcc]">
                      The Cypherpunk Sanctuary
                    </h3>
                  </div>
                  <p className="m-3 text-[12px] leading-relaxed text-[#aab6c9]">
                    True observation requires stealth. By binding historical satoshi immutability with Zcash
                    zero-knowledge proofs (zk-SNARKs), Bitfoots allows hunters to demonstrate authentic
                    provenance and field rank without leaking their financial footprint, physical coordinates,
                    or identity to surveillance panopticons.
                  </p>
                </div>
              </div>

              {/* Operative Field Pillars */}
              <div className="space-y-3 rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/80 p-4">
                <h4 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#ffddcc]">
                  <Terminal className="h-3.5 w-3.5 text-[#eaba49]" />
                  INSTITUTE DISCIPLINE // OPERATIVE PILLARS
                </h4>

                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                  <div className="space-y-1 rounded-lg border border-[#3a475c]/50 bg-[#14171c] p-3">
                    <span className="block font-mono text-[10px] text-[#eaba49]">01 // INTEGRITY</span>
                    <h5 className="font-bold text-[#ffddcc]">No Public Dump</h5>
                    <p className="text-[11px] leading-tight text-[#7d8898]">
                      No predatory FOMO auctions or gas wars. Access is allocated strictly through vetted
                      reconnaissance.
                    </p>
                  </div>

                  <div className="space-y-1 rounded-lg border border-[#3a475c]/50 bg-[#14171c] p-3">
                    <span className="block font-mono text-[10px] text-[#7fc98f]">02 // PROVENANCE</span>
                    <h5 className="font-bold text-[#ffddcc]">Dual-Chain Inscription</h5>
                    <p className="text-[11px] leading-tight text-[#7d8898]">
                      Anchored on Bitcoin Ordinals for timeless permanence, shielded within Zcash Orchard for
                      sovereign privacy.
                    </p>
                  </div>

                  <div className="space-y-1 rounded-lg border border-[#3a475c]/50 bg-[#14171c] p-3">
                    <span className="block font-mono text-[10px] text-[#d8c27a]">03 // CRAFTSMANSHIP</span>
                    <h5 className="font-bold text-[#ffddcc]">1,000+ Hours Pixel Art</h5>
                    <p className="text-[11px] leading-tight text-[#7d8898]">
                      Every single one of the 303 specimens is hand-drawn pixel-by-pixel. Pure artisanal
                      craftsmanship.
                    </p>
                  </div>
                </div>
              </div>

              {/* Leadership Attribution */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#3a475c]/50 bg-[#1a1f26]/60 p-3 font-mono text-xs">
                <div className="flex items-center space-x-2 text-[#7d8898]">
                  <span>EXPEDITION COMMAND:</span>
                  <a
                    href="https://x.com/shelby_tommy0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#eaba49] hover:underline"
                  >
                    Tommy Shelby (@shelby_tommy0)
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-[#7d8898]">
                  <span>DISPATCH NETWORK:</span>
                  <a
                    href="https://x.com/BITFOOTS_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#ffddcc] hover:underline"
                  >
                    @BITFOOTS_
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPECIMEN SERIES 303 */}
          {activeTab === "specimens" && (
            <div className="animate-in fade-in space-y-6 duration-200">
              {/* Introduction Banner */}
              <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#3a475c]/80 bg-[#0f1216]/90 p-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-[#eaba49]">
                    THE ARCHIVAL CADASTRE // 303 NON-FUNGIBLE 1/1s
                  </span>
                  <h3 className="font-serif text-sm text-[#ffddcc] sm:text-base">
                    Non-Algorithmic Pure Character Craft
                  </h3>
                  <p className="max-w-xl text-xs leading-relaxed text-[#aab6c9]">
                    Unlike standard generative collections with randomized trait layers, all 303 Bitfoots were
                    conceived as distinct living cryptids. Over 1,000 hours of pixel art geometry went into
                    shaping individual expressions, horn anatomies, and woodland camouflage.
                  </p>
                </div>
                <div className="flex-shrink-0 rounded-lg border border-[#eaba49]/40 bg-[#1a1f26] px-4 py-2 text-center">
                  <span className="block font-mono text-[10px] text-[#7d8898]">TOTAL SUPPLY</span>
                  <span className="font-mono text-lg font-bold text-[#eaba49]">303</span>
                </div>
              </div>

              {/* Interactive Specimen Terminal Viewport */}
              <div className="relative overflow-hidden rounded-xl border border-[#eaba49]/60 bg-[#0f1216] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between border-b border-[#3a475c]/60 pb-3 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-[#eaba49]">
                    <Radio className="h-4 w-4 animate-pulse text-[#7fc98f]" />
                    <span className="font-bold tracking-wider">
                      SPECIMEN TELEMETRY VIEWER [{selectedSpecimenIdx + 1}/{SPECIMEN_REGISTRY.length}]
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevSpecimen}
                      aria-label="Previous Specimen"
                      className="rounded border border-[#3a475c] bg-[#1a1f26] p-1.5 text-[#ffddcc] transition-colors hover:bg-[#3a475c]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNextSpecimen}
                      aria-label="Next Specimen"
                      className="rounded border border-[#3a475c] bg-[#1a1f26] p-1.5 text-[#ffddcc] transition-colors hover:bg-[#3a475c]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-12">
                  {/* Specimen Visual Box */}
                  <div className="flex flex-col items-center md:col-span-5">
                    <div className="crt-overlay relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-xl border-2 border-[#eaba49] bg-[#14171c] p-2 shadow-[0_0_25px_rgba(234,186,73,0.2)] sm:h-48 sm:w-48">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#eaba49]/5 to-transparent" />
                      <Image
                        src={currentSpecimen.file}
                        alt={currentSpecimen.name}
                        width={160}
                        height={160}
                        className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] filter [image-rendering:pixelated]"
                      />
                      <span className="absolute bottom-2 left-2 rounded border border-[#3a475c] bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-[#7fc98f]">
                        SERIES 303 // #{currentSpecimen.id}
                      </span>
                    </div>

                    {/* Quick Selection Strip */}
                    <div className="mt-3 flex max-w-full items-center gap-1.5 overflow-x-auto pb-1">
                      {SPECIMEN_REGISTRY.map((spec, i) => (
                        <button
                          key={spec.id}
                          onClick={() => {
                            audioManager.playSecretDiscovered();
                            setSelectedSpecimenIdx(i);
                          }}
                          className={`h-8 w-8 flex-shrink-0 overflow-hidden rounded border transition-all ${
                            selectedSpecimenIdx === i
                              ? "scale-105 border-[#eaba49] ring-2 ring-[#eaba49]/50"
                              : "border-[#3a475c] opacity-60 hover:opacity-100"
                          }`}
                        >
                          <Image
                            src={spec.file}
                            alt={spec.name}
                            width={32}
                            height={32}
                            className="object-cover [image-rendering:pixelated]"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specimen Telemetry Specs */}
                  <div className="space-y-3 font-mono text-xs md:col-span-7">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[#eaba49]">
                        DESIGNATION
                      </span>
                      <h4 className="font-serif text-base font-bold text-[#ffddcc] sm:text-lg">
                        {currentSpecimen.name}
                      </h4>
                      <p className="font-sans text-[11px] italic text-[#7d8898]">
                        Classification: {currentSpecimen.classification}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded border border-[#3a475c]/60 bg-[#1a1f26]/80 p-2">
                        <span className="block text-[9px] text-[#7d8898]">NATURAL HABITAT</span>
                        <span className="font-medium text-[#aab6c9]">{currentSpecimen.habitat}</span>
                      </div>
                      <div className="rounded border border-[#3a475c]/60 bg-[#1a1f26]/80 p-2">
                        <span className="block text-[9px] text-[#7d8898]">ANOMALY INDEX</span>
                        <span className="font-bold text-[#7fc98f]">{currentSpecimen.anomalyIndex}</span>
                      </div>
                      <div className="rounded border border-[#3a475c]/60 bg-[#1a1f26]/80 p-2">
                        <span className="block text-[9px] text-[#7d8898]">BIO-SIGNATURE</span>
                        <span className="text-[#ffddcc]">{currentSpecimen.signature}</span>
                      </div>
                      <div className="rounded border border-[#3a475c]/60 bg-[#1a1f26]/80 p-2">
                        <span className="block text-[9px] text-[#7d8898]">ON-CHAIN ANCHOR</span>
                        <span className="text-[#eaba49]">Dual Inscribed</span>
                      </div>
                    </div>

                    <div className="rounded border border-[#3a475c]/60 bg-[#14171c] p-2.5 font-sans text-xs leading-relaxed text-[#aab6c9]">
                      {currentSpecimen.description}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#7d8898]">
                      <span>STATUS: OBSERVED (UNCAPTURED)</span>
                      <span className="text-[#7fc98f]">ZK VALIDATED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DUAL-CHAIN PROTOCOL */}
          {activeTab === "dualchain" && (
            <div className="animate-in fade-in space-y-6 duration-200">
              {/* Architecture Statement */}
              <div className="space-y-3 rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-5 sm:p-6">
                <div className="flex items-center space-x-2 text-[#7fc98f]">
                  <Binary className="h-4 w-4 text-[#7fc98f]" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#ffddcc] sm:text-sm">
                    Dual-Chain Engineering: Bitcoin Ordinals + Zcash Orchard Pool
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-[#aab6c9] sm:text-sm">
                  BITFOOTS leverages a hybrid multi-chain symbiosis. We recognize that permanence requires
                  Bitcoin's immutable energy, while genuine privacy and operative autonomy require Zcash's
                  zero-knowledge mathematics.
                </p>
              </div>

              {/* Chain Comparison Grid */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Bitcoin Layer */}
                <div className="flex flex-col justify-between space-y-5 rounded-xl border border-[#eaba49]/50 bg-[#1a1f26]/90 p-5 sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaba49]/20 font-mono text-sm font-bold text-[#eaba49]">
                        ₿
                      </div>
                      <div>
                        <h4 className="font-mono text-xs font-bold uppercase tracking-wide text-[#ffddcc] sm:text-sm">
                          Bitcoin Ordinals
                        </h4>
                        <span className="font-mono text-[10px] text-[#7d8898]">Immutable Base Layer</span>
                      </div>
                    </div>
                    <span className="rounded border border-[#eaba49]/30 bg-[#eaba49]/10 px-2.5 py-1 font-mono text-[10px] font-bold text-[#eaba49]">
                      PERMANENCE
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1 rounded-lg border border-[#3a475c]/50 bg-[#14171c]/80 p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">Historical Bedrock</span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#aab6c9]">
                        Directly inscribed onto Satoshi ordinal satoshis for permanent, censorship-resistant
                        preservation.
                      </p>
                    </div>

                    <div className="space-y-1 rounded-lg border border-[#3a475c]/50 bg-[#14171c]/80 p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">
                          Zero External Dependency
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#aab6c9]">
                        No off-chain IPFS nodes, centralized cloud storage, or third-party servers that can
                        rot or expire.
                      </p>
                    </div>

                    <div className="space-y-1 rounded-lg border border-[#3a475c]/50 bg-[#14171c]/80 p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">
                          Provable Satoshi Scarcity
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#aab6c9]">
                        Strict canonical satoshi numbering strictly limited to the canonical Series 303
                        archive.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Zcash Layer */}
                <div className="flex flex-col justify-between space-y-5 rounded-xl border border-[#7fc98f]/50 bg-[#1a1f26]/90 p-5 sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7fc98f]/20 font-mono text-sm font-bold text-[#7fc98f]">
                        ⓩ
                      </div>
                      <div>
                        <h4 className="font-mono text-xs font-bold uppercase tracking-wide text-[#ffddcc] sm:text-sm">
                          Zcash Orchard Pool
                        </h4>
                        <span className="font-mono text-[10px] text-[#7d8898]">Halo 2 Zero-Knowledge</span>
                      </div>
                    </div>
                    <span className="rounded border border-[#7fc98f]/30 bg-[#7fc98f]/10 px-2.5 py-1 font-mono text-[10px] font-bold text-[#7fc98f]">
                      ABSOLUTE PRIVACY
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1 rounded-lg border border-[#3a475c]/50 bg-[#14171c]/80 p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">ZK-SNARK Shielding</span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#aab6c9]">
                        Footprints and observation proofs exist without broadcasting hunter wallet addresses
                        or identities.
                      </p>
                    </div>

                    <div className="space-y-1 rounded-lg border border-[#3a475c]/50 bg-[#14171c]/80 p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">
                          Unified Address (u1...)
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#aab6c9]">
                        Seamless cryptographic verification of authentic credentials without exposing user
                        metadata or balance.
                      </p>
                    </div>

                    <div className="space-y-1 rounded-lg border border-[#3a475c]/50 bg-[#14171c]/80 p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">
                          Autonomous Registry
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#aab6c9]">
                        Fully verifiable on-chain operative telemetry with zero invasive KYC or central
                        surveillance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="space-y-4 overflow-x-auto rounded-xl border border-[#3a475c]/70 bg-[#0f1216] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#ffddcc]">
                    CRYPTOGRAPHIC ARCHITECTURE SPECIFICATION
                  </h4>
                </div>
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#3a475c] text-[#7d8898]">
                      <th className="px-3 py-2.5">METRIC</th>
                      <th className="px-3 py-2.5">BITCOIN ORDINALS</th>
                      <th className="px-3 py-2.5">ZCASH ORCHARD POOL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3a475c]/40 text-[#aab6c9]">
                    <tr className="transition-colors hover:bg-[#1a1f26]/40">
                      <td className="px-3 py-3 font-bold text-[#ffddcc]">Purpose</td>
                      <td className="px-3 py-3">Historical Inscription & Provenance</td>
                      <td className="px-3 py-3 text-[#7fc98f]">Shielded Footprint & Identity Cloak</td>
                    </tr>
                    <tr className="transition-colors hover:bg-[#1a1f26]/40">
                      <td className="px-3 py-3 font-bold text-[#ffddcc]">Cryptographic Engine</td>
                      <td className="px-3 py-3">SHA-256 / Taproot SegWit</td>
                      <td className="px-3 py-3 text-[#7fc98f]">Halo 2 zk-SNARKs (No Trusted Setup)</td>
                    </tr>
                    <tr className="transition-colors hover:bg-[#1a1f26]/40">
                      <td className="px-3 py-3 font-bold text-[#ffddcc]">Address Schema</td>
                      <td className="px-3 py-3">bc1p... (Taproot)</td>
                      <td className="px-3 py-3 text-[#7fc98f]">u1... (Unified Receiver)</td>
                    </tr>
                    <tr className="transition-colors hover:bg-[#1a1f26]/40">
                      <td className="px-3 py-3 font-bold text-[#ffddcc]">Visibility Paradigm</td>
                      <td className="px-3 py-3">Transparent On-Chain Record</td>
                      <td className="px-3 py-3 text-[#7fc98f]">Zero-Knowledge Proof of Sighting</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: THE HUNT CLEARANCE */}
          {activeTab === "hunt" && (
            <div className="animate-in fade-in space-y-6 duration-200">
              {/* Vetting Philosophy */}
              <div className="space-y-3 rounded-xl border border-[#eaba49]/50 bg-[#0f1216]/90 p-5 sm:p-6">
                <div className="flex items-center space-x-2 text-[#eaba49]">
                  <Eye className="h-4 w-4 text-[#f3c85f]" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#ffddcc] sm:text-sm">
                    The Hunt Clearance Protocol: Why There is No Public Mint
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-[#aab6c9] sm:text-sm">
                  "You don’t buy a Bitfoot, you spot him." The Cryptid Institute rejects the speculative
                  pump-and-dump mechanics of conventional crypto. Clearance to receive a Series 303 allocation
                  is earned through field scouting, lore reconnaissance, and meritocratic community vetting.
                </p>
              </div>

              {/* 4-Stage Hunter Pathway */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                {/* Phase 01 */}
                <div className="flex flex-col justify-between space-y-4 rounded-xl border border-[#3a475c]/70 bg-[#1a1f26]/80 p-5 transition-all hover:border-[#eaba49]/50 sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/50 pb-2.5">
                    <span className="rounded border border-[#eaba49]/30 bg-[#eaba49]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#eaba49]">
                      PHASE 01
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#7d8898]">
                      RADAR SIMULATION
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono text-sm font-bold uppercase tracking-wide text-[#ffddcc]">
                      Sector Reconnaissance
                    </h4>
                    <p className="text-xs leading-relaxed text-[#aab6c9]">
                      Deploy through the Bitfoots Mini App engine. Navigate the 90° forest grid, avoid
                      environmental anomalies, gather tracks, and log verified chapter telemetry.
                    </p>
                  </div>
                </div>

                {/* Phase 02 */}
                <div className="flex flex-col justify-between space-y-4 rounded-xl border border-[#3a475c]/70 bg-[#1a1f26]/80 p-5 transition-all hover:border-[#eaba49]/50 sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/50 pb-2.5">
                    <span className="rounded border border-[#eaba49]/30 bg-[#eaba49]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#eaba49]">
                      PHASE 02
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#7d8898]">
                      HUNTER CLEARANCE
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono text-sm font-bold uppercase tracking-wide text-[#ffddcc]">
                      Field Dossier Submission
                    </h4>
                    <p className="text-xs leading-relaxed text-[#aab6c9]">
                      Submit formal credentials at{" "}
                      <span className="font-mono font-semibold text-[#ffddcc]">apply.bitfoots.xyz</span>.
                      Provide your Zcash Unified Address (
                      <span className="font-mono text-[#7fc98f]">u1...</span>) and documentation of your
                      research in the ecosystem.
                    </p>
                  </div>
                </div>

                {/* Phase 03 */}
                <div className="flex flex-col justify-between space-y-4 rounded-xl border border-[#3a475c]/70 bg-[#1a1f26]/80 p-5 transition-all hover:border-[#eaba49]/50 sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/50 pb-2.5">
                    <span className="rounded border border-[#eaba49]/30 bg-[#eaba49]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#eaba49]">
                      PHASE 03
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#7d8898]">
                      INSTITUTE VETTING
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono text-sm font-bold uppercase tracking-wide text-[#ffddcc]">
                      Peer Vouch & Review
                    </h4>
                    <p className="text-xs leading-relaxed text-[#aab6c9]">
                      Expedition Lead Tommy Shelby and vetted operatives review hunter dossiers. Applications
                      are evaluated for genuine cypherpunk alignment and ecosystem contribution.
                    </p>
                  </div>
                </div>

                {/* Phase 04 */}
                <div className="flex flex-col justify-between space-y-4 rounded-xl border border-[#3a475c]/70 bg-[#1a1f26]/80 p-5 transition-all hover:border-[#7fc98f]/50 sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/50 pb-2.5">
                    <span className="rounded border border-[#7fc98f]/30 bg-[#7fc98f]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#7fc98f]">
                      PHASE 04
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#7fc98f]">
                      SHIELDED DISPATCH
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono text-sm font-bold uppercase tracking-wide text-[#ffddcc]">
                      Specimen Allocation
                    </h4>
                    <p className="text-xs leading-relaxed text-[#aab6c9]">
                      Upon clearance approval, the assigned 1/1 specimen is transferred directly into your
                      shielded Zcash wallet. The footprint is permanently yours, forever unseen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Access Portal */}
              <div className="flex flex-col items-start justify-between gap-5 rounded-xl border border-[#eaba49]/60 bg-[#0f1216] p-5 shadow-lg sm:flex-row sm:items-center sm:p-6">
                <div className="space-y-1.5 text-left">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-[#eaba49]">
                    OFFICIAL GATEWAY
                  </span>
                  <h4 className="text-base font-bold text-[#ffddcc]">Ready to apply for Hunter Clearance?</h4>
                  <p className="text-xs leading-relaxed text-[#7d8898]">
                    Applications are reviewed continually by The Cryptid Institute Bureau.
                  </p>
                </div>
                <a
                  href="https://apply.bitfoots.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bitfoots-btn bitfoots-btn--solid shrink-0 whitespace-nowrap px-6 py-3 font-mono text-xs shadow-lg"
                >
                  <span>SUBMIT APPLICATION</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Bottom Permanent Telemetry Strip & Quick Actions             */}
        {/* ============================================================ */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c0e12] px-4 py-3.5 font-mono text-xs sm:px-6">
          {/* Telemetry Status Metrics */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#7d8898] sm:gap-5">
            <div className="flex items-center space-x-1.5 text-[#7fc98f]">
              <Binary className="h-3 w-3" />
              <span>CIRCUIT: ZK-SNARKS (HALO 2)</span>
            </div>
            <div>
              SUPPLY: <span className="font-bold text-[#eaba49]">303 (1/1s)</span>
            </div>
            <div>
              LEDGERS: <span className="font-bold text-[#ffddcc]">ZCASH + BITCOIN</span>
            </div>
          </div>

          {/* Action Links */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <a
              href="https://x.com/BITFOOTS_"
              target="_blank"
              rel="noopener noreferrer"
              className="bitfoots-btn px-3 py-1.5 text-[11px]"
              title="Official X Channel"
            >
              <span>X @BITFOOTS_</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href="https://apply.bitfoots.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="bitfoots-btn bitfoots-btn--solid px-3 py-1.5 text-[11px]"
              title="Official Hunter Application"
            >
              <span>APPLY</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              onClick={() => {
                audioManager.playFootprintCollect();
                onClose();
              }}
              className="bitfoots-btn px-4 py-1.5 text-[11px]"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptidDossierModal;
