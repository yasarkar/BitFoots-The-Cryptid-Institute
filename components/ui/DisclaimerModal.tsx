"use client";

import React from "react";
import { ShieldAlert, ArrowRight, Info, Sparkles } from "lucide-react";
import { audioManager } from "@/lib/audioManager";

interface DisclaimerModalProps {
  isOpen: boolean;
  onProceed: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onProceed }) => {
  if (!isOpen) return null;

  const handleProceedClick = () => {
    try {
      audioManager.playUiClick();
    } catch {}
    onProceed();
  };

  return (
    <div
      id="disclaimer-modal-overlay"
      className="animate-in fade-in fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-md duration-300 sm:p-6"
    >
      <div
        id="disclaimer-modal-card"
        className="bitfoots-glass-card relative my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#eaba49]/85 p-6 text-[#aab6c9] shadow-2xl sm:p-9"
      >
        {/* Glowing top accent line */}
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#eaba49] to-transparent" />

        {/* BitFoots Pixel Card Mark Ornament */}
        <div className="bitfoots-card-mark" aria-hidden="true" />

        {/* Header & Badges */}
        <div className="mb-6 flex flex-col items-center space-y-2.5 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#eaba49] sm:text-[12px]">
            THE CRYPTID INSTITUTE // COMMUNITY NOTICE
          </p>

          <span className="bitfoots-chip bitfoots-chip--solid">
            Status: <strong>INDEPENDENT FAN PROJECT</strong>
          </span>

          <h2 className="font-serif text-2xl font-medium tracking-tight text-[#ffddcc] sm:text-3xl">
            Important Notice & Disclaimer
          </h2>

          <p className="mx-auto max-w-sm text-xs leading-relaxed text-[#c9ccd2] sm:text-sm">
            Please read and acknowledge the official community disclaimer before entering the expedition.
          </p>
        </div>

        {/* Main Disclaimer Box */}
        <div className="relative mb-6 overflow-hidden rounded-xl border border-[#3a475c] bg-[#0f1216]/95 p-4 shadow-inner sm:p-5">
          {/* Subtle Ambient Light Wash */}
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#eaba49]/5 blur-2xl"
            aria-hidden="true"
          />

          <div className="flex items-start space-x-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#eaba49]/50 bg-[#eaba49]/15 text-[#eaba49] shadow-md shadow-[#eaba49]/10">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div className="space-y-3 text-left">
              {/* Point 1: Imagination & Developer notice */}
              <p className="font-sans text-xs leading-relaxed text-[#ffddcc] sm:text-sm">
                <strong className="font-semibold text-[#eaba49]">Independent Creation:</strong> This game is a
                work of imagination brought together independently by a community developer.
              </p>

              {/* Point 2: No affiliation */}
              <p className="font-sans text-xs leading-relaxed text-[#c9ccd2] sm:text-sm">
                <strong className="font-semibold text-[#eaba49]">No Official Affiliation:</strong> It has{" "}
                <span className="font-medium text-[#ffddcc]">
                  no official connection, endorsement, or partnership
                </span>{" "}
                with the official Bitfoots project.
              </p>

              {/* Point 3: Liability */}
              <p className="font-sans text-xs leading-relaxed text-[#c9ccd2] sm:text-sm">
                <strong className="font-semibold text-[#eaba49]">Disclaimer of Liability:</strong> Under no
                circumstances shall the official Bitfoots account, team, or entity be held responsible or
                liable for any situation, interaction, or outcome arising from this game.
              </p>
            </div>
          </div>

          {/* Cryptid Explorer Note */}
          <div className="mt-4 flex items-center gap-2 border-t border-[#3a475c]/60 pt-3 font-mono text-[11px] text-[#7d8898]">
            <Info className="h-3.5 w-3.5 shrink-0 text-[#eaba49]" />
            <span>Proceed at your own discretion. Explore the dark forest responsibly.</span>
          </div>
        </div>

        {/* Action Button: Proceed */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            id="disclaimer-proceed-btn"
            onClick={handleProceedClick}
            className="bitfoots-btn bitfoots-btn--solid group flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl py-3.5 text-xs font-bold tracking-[0.2em] shadow-xl shadow-[#eaba49]/20 transition-all hover:scale-[1.01] active:scale-[0.99] sm:text-sm"
          >
            <Sparkles className="h-4 w-4 text-[#14171c] transition-transform group-hover:rotate-12" />
            <span>ACKNOWLEDGE & PROCEED</span>
            <ArrowRight className="h-4 w-4 text-[#14171c] transition-transform group-hover:translate-x-1" />
          </button>

          <p className="text-center font-mono text-[10px] text-[#7d8898]">
            PRESS TO ACCEPT AND CONTINUE TO EXPEDITION ACCESS
          </p>
        </div>
      </div>
    </div>
  );
};
