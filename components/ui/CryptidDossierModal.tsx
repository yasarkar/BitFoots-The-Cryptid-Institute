"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Shield,
  ExternalLink,
  X,
  Footprints,
  Eye,
  Binary,
  Layers,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  CheckCircle2,
  Lock,
  Cpu,
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

export const CryptidDossierModal: React.FC<CryptidDossierModalProps> = ({
  isOpen,
  onClose,
}) => {
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
    setSelectedSpecimenIdx(
      (prev) => (prev - 1 + SPECIMEN_REGISTRY.length) % SPECIMEN_REGISTRY.length
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bitfoots-glass-card rounded-2xl shadow-2xl overflow-hidden text-[#aab6c9] font-sans max-h-[92vh] flex flex-col border border-[#eaba49]/70 bg-[#14171c]/95">
        {/* ============================================================ */}
        {/* Top Classified Header Bar                                    */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3a475c]/70 bg-[#0f1216]/90 relative">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#eaba49]/15 border border-[#eaba49]/50 flex items-center justify-center text-[#eaba49] shadow-[0_0_12px_rgba(234,186,73,0.25)] flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
              </div>
              <h2 className="text-base sm:text-xl font-serif font-medium text-[#ffddcc] tracking-wide mt-0.5">
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
              className="p-2 rounded-lg bg-[#0f1216] hover:bg-[#e07a6b]/20 border border-[#3a475c] hover:border-[#e07a6b]/60 text-[#7d8898] hover:text-[#e07a6b] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Archival Navigation Tabs (Single Row with Unified Border)    */}
        {/* ============================================================ */}
        <div className="w-full border-b border-[#3a475c] bg-[#0c0e12]/95 relative z-10">
          <div className="grid grid-cols-4 w-full">
            <button
              onClick={() => handleTabChange("manifesto")}
              className={`py-3 sm:py-3.5 px-1 sm:px-3 text-center text-[10px] sm:text-xs font-mono tracking-wider transition-all flex items-center justify-center border-b-2 -mb-[1px] select-none ${
                activeTab === "manifesto"
                  ? "border-[#eaba49] text-[#ffddcc] font-bold bg-[#eaba49]/10"
                  : "border-transparent text-[#7d8898] hover:text-[#eaba49] hover:bg-[#1a1f26]/40"
              }`}
            >
              <span className="hidden lg:inline">[01] MANIFESTO & ORIGINS</span>
              <span className="lg:hidden">[01] MANIFESTO</span>
            </button>

            <button
              onClick={() => handleTabChange("specimens")}
              className={`py-3 sm:py-3.5 px-1 sm:px-3 text-center text-[10px] sm:text-xs font-mono tracking-wider transition-all flex items-center justify-center border-b-2 -mb-[1px] select-none ${
                activeTab === "specimens"
                  ? "border-[#eaba49] text-[#ffddcc] font-bold bg-[#eaba49]/10"
                  : "border-transparent text-[#7d8898] hover:text-[#eaba49] hover:bg-[#1a1f26]/40"
              }`}
            >
              <span className="hidden lg:inline">[02] SPECIMEN SERIES 303</span>
              <span className="lg:hidden">[02] SERIES 303</span>
            </button>

            <button
              onClick={() => handleTabChange("dualchain")}
              className={`py-3 sm:py-3.5 px-1 sm:px-3 text-center text-[10px] sm:text-xs font-mono tracking-wider transition-all flex items-center justify-center border-b-2 -mb-[1px] select-none ${
                activeTab === "dualchain"
                  ? "border-[#eaba49] text-[#ffddcc] font-bold bg-[#eaba49]/10"
                  : "border-transparent text-[#7d8898] hover:text-[#eaba49] hover:bg-[#1a1f26]/40"
              }`}
            >
              <span className="hidden lg:inline">[03] DUAL-CHAIN PROTOCOL</span>
              <span className="lg:hidden">[03] DUAL-CHAIN</span>
            </button>

            <button
              onClick={() => handleTabChange("hunt")}
              className={`py-3 sm:py-3.5 px-1 sm:px-3 text-center text-[10px] sm:text-xs font-mono tracking-wider transition-all flex items-center justify-center border-b-2 -mb-[1px] select-none ${
                activeTab === "hunt"
                  ? "border-[#eaba49] text-[#ffddcc] font-bold bg-[#eaba49]/10"
                  : "border-transparent text-[#7d8898] hover:text-[#eaba49] hover:bg-[#1a1f26]/40"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs sm:text-sm">
          {/* TAB 1: MANIFESTO & ORIGINS */}
          {activeTab === "manifesto" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Central Creed Callout */}
              <div className="bg-[#0f1216] border border-[#eaba49]/50 rounded-xl p-5 relative overflow-hidden shadow-lg">
                <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                  <Footprints className="w-36 h-36 text-[#eaba49]" />
                </div>
                <span className="text-[10px] font-mono text-[#eaba49] uppercase tracking-widest block mb-1">
                  The Institute Axiom
                </span>
                <p className="italic text-[#ffddcc] font-serif text-base sm:text-lg leading-relaxed">
                  "Never caught. You don’t buy a Bitfoot, you spot him. The only price is the hunt. Specimens are never captured, only observed. Mathematical proof of existence without exposing identity. Preserved on Bitcoin, shielded by Zcash."
                </p>
                <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-[#7d8898] border-t border-[#3a475c]/50 pt-2.5">
                  <span>— The Cryptid Institute // Field Directive (Series 303)</span>
                  <span className="text-[#eaba49] font-bold">EST. 2026 // EXPEDITION BUREAU</span>
                </div>
              </div>

              {/* Two Column Narrative Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 rounded-xl p-4.5 space-y-2.5">
                  <div className="flex items-center space-x-2 text-[#eaba49] m-3">
                    <h3 className="font-bold text-xs text-[#ffddcc] uppercase tracking-wider font-mono">
                      Forest Noir & 19th-Century Naturalism
                    </h3>
                  </div>
                  <p className="text-[12px] text-[#aab6c9] leading-relaxed m-3">
                    BITFOOTS repudiates the sterile corporate aesthetics of modern Web3. Our visual language is born from the weathered pages of Victorian naturalist journals, midnight pine fog, and CRT phosphor glows. 
                    In these uncharted sectors, the cryptid is not a speculative commodity, but a myth to be stalked through field reconnaissance.
                  </p>
                </div>

                <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 rounded-xl p-4.5 space-y-2.5">
                  <div className="flex items-center space-x-2 text-[#7fc98f] m-3">
                    <h3 className="font-bold text-xs text-[#ffddcc] uppercase tracking-wider font-mono">
                      The Cypherpunk Sanctuary
                    </h3>
                  </div>
                  <p className="text-[12px] text-[#aab6c9] leading-relaxed m-3">
                    True observation requires stealth. By binding historical satoshi immutability with Zcash zero-knowledge proofs (zk-SNARKs), Bitfoots allows hunters to demonstrate authentic provenance and field rank without leaking their financial footprint, physical coordinates, or identity to surveillance panopticons.
                  </p>
                </div>
              </div>

              {/* Operative Field Pillars */}
              <div className="bg-[#0f1216]/80 border border-[#3a475c]/70 rounded-xl p-4 space-y-3">
                <h4 className="text-[11px] font-mono text-[#ffddcc] uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#eaba49]" />
                  INSTITUTE DISCIPLINE // OPERATIVE PILLARS
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#14171c] border border-[#3a475c]/50 space-y-1">
                    <span className="text-[10px] font-mono text-[#eaba49] block">01 // INTEGRITY</span>
                    <h5 className="font-bold text-[#ffddcc]">No Public Dump</h5>
                    <p className="text-[11px] text-[#7d8898] leading-tight">
                      No predatory FOMO auctions or gas wars. Access is allocated strictly through vetted reconnaissance.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#14171c] border border-[#3a475c]/50 space-y-1">
                    <span className="text-[10px] font-mono text-[#7fc98f] block">02 // PROVENANCE</span>
                    <h5 className="font-bold text-[#ffddcc]">Dual-Chain Inscription</h5>
                    <p className="text-[11px] text-[#7d8898] leading-tight">
                      Anchored on Bitcoin Ordinals for timeless permanence, shielded within Zcash Orchard for sovereign privacy.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#14171c] border border-[#3a475c]/50 space-y-1">
                    <span className="text-[10px] font-mono text-[#d8c27a] block">03 // CRAFTSMANSHIP</span>
                    <h5 className="font-bold text-[#ffddcc]">1,000+ Hours Pixel Art</h5>
                    <p className="text-[11px] text-[#7d8898] leading-tight">
                      Every single one of the 303 specimens is hand-drawn pixel-by-pixel. Pure artisanal craftsmanship.
                    </p>
                  </div>
                </div>
              </div>

              {/* Leadership Attribution */}
              <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-[#1a1f26]/60 rounded-xl border border-[#3a475c]/50 text-xs font-mono">
                <div className="flex items-center space-x-2 text-[#7d8898]">
                  <span>EXPEDITION COMMAND:</span>
                  <a
                    href="https://x.com/shelby_tommy0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#eaba49] hover:underline font-bold"
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
                    className="text-[#ffddcc] hover:underline font-bold"
                  >
                    @BITFOOTS_
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPECIMEN SERIES 303 */}
          {activeTab === "specimens" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Introduction Banner */}
              <div className="bg-[#0f1216]/90 border border-[#3a475c]/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#eaba49] uppercase tracking-wider block">
                    THE ARCHIVAL CADASTRE // 303 NON-FUNGIBLE 1/1s
                  </span>
                  <h3 className="font-serif text-sm sm:text-base text-[#ffddcc]">
                    Non-Algorithmic Pure Character Craft
                  </h3>
                  <p className="text-xs text-[#aab6c9] max-w-xl leading-relaxed">
                    Unlike standard generative collections with randomized trait layers, all 303 Bitfoots were conceived as distinct living cryptids. Over 1,000 hours of pixel art geometry went into shaping individual expressions, horn anatomies, and woodland camouflage.
                  </p>
                </div>
                <div className="bg-[#1a1f26] border border-[#eaba49]/40 px-4 py-2 rounded-lg text-center flex-shrink-0">
                  <span className="text-[10px] font-mono text-[#7d8898] block">TOTAL SUPPLY</span>
                  <span className="text-lg font-mono font-bold text-[#eaba49]">303</span>
                </div>
              </div>

              {/* Interactive Specimen Terminal Viewport */}
              <div className="bg-[#0f1216] border border-[#eaba49]/60 rounded-xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-3 mb-4 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-[#eaba49]">
                    <Radio className="w-4 h-4 animate-pulse text-[#7fc98f]" />
                    <span className="font-bold tracking-wider">
                      SPECIMEN TELEMETRY VIEWER [{selectedSpecimenIdx + 1}/{SPECIMEN_REGISTRY.length}]
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevSpecimen}
                      aria-label="Previous Specimen"
                      className="p-1.5 rounded bg-[#1a1f26] hover:bg-[#3a475c] text-[#ffddcc] border border-[#3a475c] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextSpecimen}
                      aria-label="Next Specimen"
                      className="p-1.5 rounded bg-[#1a1f26] hover:bg-[#3a475c] text-[#ffddcc] border border-[#3a475c] transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Specimen Visual Box */}
                  <div className="md:col-span-5 flex flex-col items-center">
                    <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-xl bg-[#14171c] border-2 border-[#eaba49] p-2 flex items-center justify-center shadow-[0_0_25px_rgba(234,186,73,0.2)] crt-overlay overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#eaba49]/5 to-transparent pointer-events-none" />
                      <Image
                        src={currentSpecimen.file}
                        alt={currentSpecimen.name}
                        width={160}
                        height={160}
                        className="object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] [image-rendering:pixelated]"
                      />
                      <span className="absolute bottom-2 left-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 border border-[#3a475c] text-[#7fc98f]">
                        SERIES 303 // #{currentSpecimen.id}
                      </span>
                    </div>

                    {/* Quick Selection Strip */}
                    <div className="flex items-center gap-1.5 mt-3 overflow-x-auto max-w-full pb-1">
                      {SPECIMEN_REGISTRY.map((spec, i) => (
                        <button
                          key={spec.id}
                          onClick={() => {
                            audioManager.playSecretDiscovered();
                            setSelectedSpecimenIdx(i);
                          }}
                          className={`w-8 h-8 rounded border transition-all overflow-hidden flex-shrink-0 ${
                            selectedSpecimenIdx === i
                              ? "border-[#eaba49] ring-2 ring-[#eaba49]/50 scale-105"
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
                  <div className="md:col-span-7 space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-[#eaba49] uppercase tracking-wider block">
                        DESIGNATION
                      </span>
                      <h4 className="text-base sm:text-lg font-serif font-bold text-[#ffddcc]">
                        {currentSpecimen.name}
                      </h4>
                      <p className="text-[11px] text-[#7d8898] italic font-sans">
                        Classification: {currentSpecimen.classification}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-[#1a1f26]/80 border border-[#3a475c]/60">
                        <span className="text-[#7d8898] block text-[9px]">NATURAL HABITAT</span>
                        <span className="text-[#aab6c9] font-medium">{currentSpecimen.habitat}</span>
                      </div>
                      <div className="p-2 rounded bg-[#1a1f26]/80 border border-[#3a475c]/60">
                        <span className="text-[#7d8898] block text-[9px]">ANOMALY INDEX</span>
                        <span className="text-[#7fc98f] font-bold">{currentSpecimen.anomalyIndex}</span>
                      </div>
                      <div className="p-2 rounded bg-[#1a1f26]/80 border border-[#3a475c]/60">
                        <span className="text-[#7d8898] block text-[9px]">BIO-SIGNATURE</span>
                        <span className="text-[#ffddcc]">{currentSpecimen.signature}</span>
                      </div>
                      <div className="p-2 rounded bg-[#1a1f26]/80 border border-[#3a475c]/60">
                        <span className="text-[#7d8898] block text-[9px]">ON-CHAIN ANCHOR</span>
                        <span className="text-[#eaba49]">Dual Inscribed</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#14171c] border border-[#3a475c]/60 font-sans text-xs text-[#aab6c9] leading-relaxed">
                      {currentSpecimen.description}
                    </div>

                    <div className="text-[10px] text-[#7d8898] flex items-center justify-between pt-1">
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
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Architecture Statement */}
              <div className="bg-[#0f1216]/90 border border-[#3a475c]/70 rounded-xl p-5 sm:p-6 space-y-3">
                <div className="flex items-center space-x-2 text-[#7fc98f]">
                  <Binary className="w-4 h-4 text-[#7fc98f]" />
                  <h3 className="font-bold text-xs sm:text-sm text-[#ffddcc] uppercase tracking-wider font-mono">
                    Dual-Chain Engineering: Bitcoin Ordinals + Zcash Orchard Pool
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#aab6c9] leading-relaxed">
                  BITFOOTS leverages a hybrid multi-chain symbiosis. We recognize that permanence requires Bitcoin's immutable energy, while genuine privacy and operative autonomy require Zcash's zero-knowledge mathematics.
                </p>
              </div>

              {/* Chain Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Bitcoin Layer */}
                <div className="bg-[#1a1f26]/90 border border-[#eaba49]/50 rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-[#eaba49]/20 flex items-center justify-center text-[#eaba49] font-mono font-bold text-sm">
                        ₿
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#ffddcc] font-mono uppercase tracking-wide">
                          Bitcoin Ordinals
                        </h4>
                        <span className="text-[10px] text-[#7d8898] font-mono">Immutable Base Layer</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#eaba49] px-2.5 py-1 rounded bg-[#eaba49]/10 border border-[#eaba49]/30">
                      PERMANENCE
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-[#14171c]/80 border border-[#3a475c]/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">Historical Bedrock</span>
                      </div>
                      <p className="text-xs text-[#aab6c9] leading-relaxed">
                        Directly inscribed onto Satoshi ordinal satoshis for permanent, censorship-resistant preservation.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#14171c]/80 border border-[#3a475c]/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">Zero External Dependency</span>
                      </div>
                      <p className="text-xs text-[#aab6c9] leading-relaxed">
                        No off-chain IPFS nodes, centralized cloud storage, or third-party servers that can rot or expire.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#14171c]/80 border border-[#3a475c]/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">Provable Satoshi Scarcity</span>
                      </div>
                      <p className="text-xs text-[#aab6c9] leading-relaxed">
                        Strict canonical satoshi numbering strictly limited to the canonical Series 303 archive.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Zcash Layer */}
                <div className="bg-[#1a1f26]/90 border border-[#7fc98f]/50 rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-[#7fc98f]/20 flex items-center justify-center text-[#7fc98f] font-mono font-bold text-sm">
                        ⓩ
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#ffddcc] font-mono uppercase tracking-wide">
                          Zcash Orchard Pool
                        </h4>
                        <span className="text-[10px] text-[#7d8898] font-mono">Halo 2 Zero-Knowledge</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#7fc98f] px-2.5 py-1 rounded bg-[#7fc98f]/10 border border-[#7fc98f]/30">
                      ABSOLUTE PRIVACY
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-[#14171c]/80 border border-[#3a475c]/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">ZK-SNARK Shielding</span>
                      </div>
                      <p className="text-xs text-[#aab6c9] leading-relaxed">
                        Footprints and observation proofs exist without broadcasting hunter wallet addresses or identities.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#14171c]/80 border border-[#3a475c]/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">Unified Address (u1...)</span>
                      </div>
                      <p className="text-xs text-[#aab6c9] leading-relaxed">
                        Seamless cryptographic verification of authentic credentials without exposing user metadata or balance.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#14171c]/80 border border-[#3a475c]/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#ffddcc]">Autonomous Registry</span>
                      </div>
                      <p className="text-xs text-[#aab6c9] leading-relaxed">
                        Fully verifiable on-chain operative telemetry with zero invasive KYC or central surveillance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="bg-[#0f1216] border border-[#3a475c]/70 rounded-xl p-5 sm:p-6 space-y-4 overflow-x-auto">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-mono font-bold text-[#ffddcc] uppercase tracking-wider">
                    CRYPTOGRAPHIC ARCHITECTURE SPECIFICATION
                  </h4>
                </div>
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#3a475c] text-[#7d8898]">
                      <th className="py-2.5 px-3">METRIC</th>
                      <th className="py-2.5 px-3">BITCOIN ORDINALS</th>
                      <th className="py-2.5 px-3">ZCASH ORCHARD POOL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3a475c]/40 text-[#aab6c9]">
                    <tr className="hover:bg-[#1a1f26]/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-[#ffddcc]">Purpose</td>
                      <td className="py-3 px-3">Historical Inscription & Provenance</td>
                      <td className="py-3 px-3 text-[#7fc98f]">Shielded Footprint & Identity Cloak</td>
                    </tr>
                    <tr className="hover:bg-[#1a1f26]/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-[#ffddcc]">Cryptographic Engine</td>
                      <td className="py-3 px-3">SHA-256 / Taproot SegWit</td>
                      <td className="py-3 px-3 text-[#7fc98f]">Halo 2 zk-SNARKs (No Trusted Setup)</td>
                    </tr>
                    <tr className="hover:bg-[#1a1f26]/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-[#ffddcc]">Address Schema</td>
                      <td className="py-3 px-3">bc1p... (Taproot)</td>
                      <td className="py-3 px-3 text-[#7fc98f]">u1... (Unified Receiver)</td>
                    </tr>
                    <tr className="hover:bg-[#1a1f26]/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-[#ffddcc]">Visibility Paradigm</td>
                      <td className="py-3 px-3">Transparent On-Chain Record</td>
                      <td className="py-3 px-3 text-[#7fc98f]">Zero-Knowledge Proof of Sighting</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: THE HUNT CLEARANCE */}
          {activeTab === "hunt" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Vetting Philosophy */}
              <div className="bg-[#0f1216]/90 border border-[#eaba49]/50 rounded-xl p-5 sm:p-6 space-y-3">
                <div className="flex items-center space-x-2 text-[#eaba49]">
                  <Eye className="w-4 h-4 text-[#f3c85f]" />
                  <h3 className="font-bold text-xs sm:text-sm text-[#ffddcc] uppercase tracking-wider font-mono">
                    The Hunt Clearance Protocol: Why There is No Public Mint
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#aab6c9] leading-relaxed">
                  "You don’t buy a Bitfoot, you spot him." The Cryptid Institute rejects the speculative pump-and-dump mechanics of conventional crypto. Clearance to receive a Series 303 allocation is earned through field scouting, lore reconnaissance, and meritocratic community vetting.
                </p>
              </div>

              {/* 4-Stage Hunter Pathway */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Phase 01 */}
                <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-[#eaba49]/50 transition-all">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/50 pb-2.5">
                    <span className="text-[11px] font-mono font-bold text-[#eaba49] px-2.5 py-0.5 rounded bg-[#eaba49]/10 border border-[#eaba49]/30">
                      PHASE 01
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-[#7d8898] uppercase">
                      RADAR SIMULATION
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono font-bold text-sm text-[#ffddcc] uppercase tracking-wide">
                      Sector Reconnaissance
                    </h4>
                    <p className="text-xs text-[#aab6c9] leading-relaxed">
                      Deploy through the Bitfoots Mini App engine. Navigate the 90° forest grid, avoid environmental anomalies, gather tracks, and log verified chapter telemetry.
                    </p>
                  </div>
                </div>

                {/* Phase 02 */}
                <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-[#eaba49]/50 transition-all">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/50 pb-2.5">
                    <span className="text-[11px] font-mono font-bold text-[#eaba49] px-2.5 py-0.5 rounded bg-[#eaba49]/10 border border-[#eaba49]/30">
                      PHASE 02
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-[#7d8898] uppercase">
                      HUNTER CLEARANCE
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono font-bold text-sm text-[#ffddcc] uppercase tracking-wide">
                      Field Dossier Submission
                    </h4>
                    <p className="text-xs text-[#aab6c9] leading-relaxed">
                      Submit formal credentials at <span className="text-[#ffddcc] font-mono font-semibold">apply.bitfoots.xyz</span>. Provide your Zcash Unified Address (<span className="text-[#7fc98f] font-mono">u1...</span>) and documentation of your research in the ecosystem.
                    </p>
                  </div>
                </div>

                {/* Phase 03 */}
                <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-[#eaba49]/50 transition-all">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/50 pb-2.5">
                    <span className="text-[11px] font-mono font-bold text-[#eaba49] px-2.5 py-0.5 rounded bg-[#eaba49]/10 border border-[#eaba49]/30">
                      PHASE 03
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-[#7d8898] uppercase">
                      INSTITUTE VETTING
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono font-bold text-sm text-[#ffddcc] uppercase tracking-wide">
                      Peer Vouch & Review
                    </h4>
                    <p className="text-xs text-[#aab6c9] leading-relaxed">
                      Expedition Lead Tommy Shelby and vetted operatives review hunter dossiers. Applications are evaluated for genuine cypherpunk alignment and ecosystem contribution.
                    </p>
                  </div>
                </div>

                {/* Phase 04 */}
                <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-[#7fc98f]/50 transition-all">
                  <div className="flex items-center justify-between border-b border-[#3a475c]/50 pb-2.5">
                    <span className="text-[11px] font-mono font-bold text-[#7fc98f] px-2.5 py-0.5 rounded bg-[#7fc98f]/10 border border-[#7fc98f]/30">
                      PHASE 04
                    </span>
                    <span className="text-[10px] font-mono tracking-wider text-[#7fc98f] uppercase">
                      SHIELDED DISPATCH
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono font-bold text-sm text-[#ffddcc] uppercase tracking-wide">
                      Specimen Allocation
                    </h4>
                    <p className="text-xs text-[#aab6c9] leading-relaxed">
                      Upon clearance approval, the assigned 1/1 specimen is transferred directly into your shielded Zcash wallet. The footprint is permanently yours, forever unseen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Access Portal */}
              <div className="bg-[#0f1216] border border-[#eaba49]/60 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg">
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-mono text-[#eaba49] uppercase tracking-wider block">
                    OFFICIAL GATEWAY
                  </span>
                  <h4 className="text-base font-bold text-[#ffddcc]">Ready to apply for Hunter Clearance?</h4>
                  <p className="text-xs text-[#7d8898] leading-relaxed">
                    Applications are reviewed continually by The Cryptid Institute Bureau.
                  </p>
                </div>
                <a
                  href="https://apply.bitfoots.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bitfoots-btn bitfoots-btn--solid py-3 px-6 text-xs font-mono whitespace-nowrap shadow-lg shrink-0"
                >
                  <span>SUBMIT APPLICATION</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Bottom Permanent Telemetry Strip & Quick Actions             */}
        {/* ============================================================ */}
        <div className="bg-[#0c0e12] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          {/* Telemetry Status Metrics */}
          <div className="flex items-center flex-wrap gap-3 sm:gap-5 text-[10px] text-[#7d8898]">
            <div className="flex items-center space-x-1.5 text-[#7fc98f]">
              <Binary className="w-3 h-3" />
              <span>CIRCUIT: ZK-SNARKS (HALO 2)</span>
            </div>
            <div>
              SUPPLY: <span className="text-[#eaba49] font-bold">303 (1/1s)</span>
            </div>
            <div>
              LEDGERS: <span className="text-[#ffddcc] font-bold">ZCASH + BITCOIN</span>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex items-center flex-wrap gap-2 ml-auto">
            <a
              href="https://x.com/BITFOOTS_"
              target="_blank"
              rel="noopener noreferrer"
              className="bitfoots-btn py-1.5 px-3 text-[11px]"
              title="Official X Channel"
            >
              <span>X @BITFOOTS_</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href="https://apply.bitfoots.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="bitfoots-btn bitfoots-btn--solid py-1.5 px-3 text-[11px]"
              title="Official Hunter Application"
            >
              <span>APPLY</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => {
                audioManager.playFootprintCollect();
                onClose();
              }}
              className="bitfoots-btn py-1.5 px-4 text-[11px]"
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

