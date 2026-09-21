"use client";

import React from "react";
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
} from "lucide-react";

interface CryptidDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CryptidDossierModal: React.FC<CryptidDossierModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bitfoots-glass-card rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden text-[#aab6c9] font-sans max-h-[90vh] flex flex-col">
        {/* Top classified banner */}
        <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#eaba49]/15 border border-[#eaba49]/40 flex items-center justify-center text-[#eaba49]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#eaba49] tracking-wider uppercase block">
                THE CRYPTID INSTITUTE // FIELD ARCHIVE RECORDS
              </span>
              <h2 className="text-base sm:text-xl font-serif font-medium text-[#ffddcc] tracking-wide">
                Specimen Series 303 Dossier
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#0f1216] hover:bg-[#1a1f26] border border-[#3a475c] text-[#7d8898] hover:text-[#eaba49] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="space-y-4 overflow-y-auto pr-1 text-xs sm:text-sm">
          {/* Quote Block */}
          <div className="bg-[#0f1216]/90 border border-[#eaba49]/50 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 opacity-10 pointer-events-none">
              <Footprints className="w-24 h-24 text-[#eaba49]" />
            </div>
            <p className="italic text-[#ffddcc] font-serif text-sm sm:text-base leading-relaxed">
              "Specimens are never captured, only observed. Mathematical proof of existence without exposing identity. Preserved on Bitcoin, shielded by Zcash."
            </p>
            <span className="text-[11px] font-mono text-[#7d8898] block mt-2 tracking-wider">
              — The Cryptid Institute // Field Directive (Series 303)
            </span>
          </div>

          {/* Dossier Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box 1: 303 Unique 1/1s */}
            <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 p-4 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-[#eaba49]">
                <Sparkles className="w-4 h-4 text-[#f3c85f]" />
                <h4 className="font-bold text-xs text-[#ffddcc] uppercase tracking-wider font-mono">
                  303 Unique Specimens
                </h4>
              </div>
              <p className="text-[11px] text-[#aab6c9] leading-snug">
                Each Bitfoot is an ultra-rare, individually hand-drawn 1/1 pixel art masterpiece with over 1,000+ hours of character craft.
              </p>
            </div>

            {/* Box 2: Zcash Shielded Pool */}
            <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 p-4 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-[#7fc98f]">
                <Shield className="w-4 h-4 text-[#7fc98f]" />
                <h4 className="font-bold text-xs text-[#ffddcc] uppercase tracking-wider font-mono">
                  Autonomous Shielded Pool
                </h4>
              </div>
              <p className="text-[11px] text-[#aab6c9] leading-snug">
                Deployed directly on Zcash using zero-knowledge privacy addresses (u1). Your footprints exist without exposing identity.
              </p>
            </div>

            {/* Box 3: Dual-Chain Heritage */}
            <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 p-4 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-[#eaba49]">
                <Layers className="w-4 h-4 text-[#eaba49]" />
                <h4 className="font-bold text-xs text-[#ffddcc] uppercase tracking-wider font-mono">
                  Dual-Chain Provenance
                </h4>
              </div>
              <p className="text-[11px] text-[#aab6c9] leading-snug">
                Conceived on Bitcoin Ordinals, fortified with Zcash shielding. Verified hunters access both Zcash and Bitcoin Ordinals inscriptions.
              </p>
            </div>

            {/* Box 4: The Hunt Whitelist */}
            <div className="bg-[#1a1f26]/80 border border-[#3a475c]/70 p-4 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2 text-[#d8c27a]">
                <Eye className="w-4 h-4 text-[#d8c27a]" />
                <h4 className="font-bold text-xs text-[#ffddcc] uppercase tracking-wider font-mono">
                  Hunter Clearance
                </h4>
              </div>
              <p className="text-[11px] text-[#aab6c9] leading-snug">
                No public mass dump. Access is strictly curated through "The Hunt" clearance applications, vouches, and reconnaissance.
              </p>
            </div>
          </div>

          {/* Telemetry Status Bar */}
          <div className="bg-[#0f1216]/90 border border-[#3a475c]/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex items-center space-x-1.5 text-[#7fc98f]">
              <Binary className="w-3.5 h-3.5" />
              <span>PROTOCOL: ZK-SNARKS SHIELDED (ZCASH u1)</span>
            </div>
            <div className="text-[#7d8898]">
              SUPPLY: <span className="text-[#eaba49] font-bold">303 PROVENANCE 1/1s</span>
            </div>
            <div className="text-[#7d8898]">
              NETWORK: <span className="text-[#e6e8ec] font-bold">ZCASH + BITCOIN</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-[#3a475c]/60 flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex flex-wrap gap-2">
            <a
              href="https://x.com/BITFOOTS_"
              target="_blank"
              rel="noopener noreferrer"
              className="bitfoots-btn py-2 px-3 text-xs"
            >
              <span>X @BITFOOTS_</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://apply.bitfoots.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="bitfoots-btn bitfoots-btn--solid py-2 px-3 text-xs"
            >
              <span>Clearance Application</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="bitfoots-btn py-2 px-4 text-xs ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CryptidDossierModal;
