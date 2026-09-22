"use client";

import React, { useState } from "react";
import {
  Settings,
  X,
  Monitor,
  Volume2,
  VolumeX,
  Gamepad2,
  Trash2,
  Check,
  Sparkles,
  Sliders,
  Wind,
} from "lucide-react";
import { GameSettings } from "@/hooks/useGameSettings";
import { audioManager } from "@/lib/audioManager";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onToggleCrt: (enabled: boolean) => void;
  onToggleSound: (enabled: boolean) => void;
  onToggleAmbience: (enabled: boolean) => void;
  onToggleContrast: (enabled: boolean) => void;
  onChangeVolume: (volume: number) => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onToggleCrt,
  onToggleSound,
  onToggleAmbience,
  onToggleContrast,
  onChangeVolume,
  onResetSettings,
}) => {
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClearCache = () => {
    if (window.confirm("Are you sure you want to reset your local expedition preferences and cache?")) {
      audioManager.playUiClick();
      onResetSettings();
      setResetFeedback("Preferences reset to defaults and cache cleared.");
      setTimeout(() => setResetFeedback(null), 3000);
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md duration-200 sm:p-5">
      <div className="bitfoots-glass-card animate-in zoom-in-95 relative flex max-h-[92vh] w-full max-w-lg select-none flex-col space-y-4 overflow-hidden overflow-y-auto rounded-2xl border border-[#eaba49]/60 p-5 font-sans text-[#aab6c9] shadow-2xl duration-200 sm:p-7">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#eaba49]/50 bg-[#eaba49]/15 text-[#eaba49] shadow-md shadow-[#eaba49]/10">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#eaba49]">
                THE CRYPTID INSTITUTE // SYSTEM CONFIGURATION
              </span>
              <h2 className="font-serif text-base font-medium tracking-wide text-[#ffddcc] sm:text-lg">
                Expedition Settings
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#3a475c] bg-[#0f1216] p-1.5 text-[#7d8898] transition-colors hover:bg-[#1a1f26] hover:text-[#eaba49]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Settings Group 1: Visuals & Surveillance */}
        <div className="space-y-2 font-mono">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#eaba49]">
            <Monitor className="h-3.5 w-3.5" />
            <span>Display & Surveillance Optics</span>
          </span>

          {/* CRT Surveillance Filter */}
          <div className="flex items-center justify-between rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-3 transition-colors hover:border-[#eaba49]/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg border border-[#3a475c]/60 bg-[#1a1f26] p-2 text-[#eaba49]">
                <Monitor className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#ffddcc] sm:text-sm">
                  CRT Retro Surveillance Scanlines
                </p>
                <p className="text-[10px] text-[#7d8898] sm:text-[11px]">
                  Retro cathode-ray tube curvature and scanline overlay
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleCrt(!settings.crtEnabled)}
              className={`relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors ${
                settings.crtEnabled ? "border-[#f3c85f] bg-[#eaba49]" : "border-[#3a475c] bg-[#1a1f26]"
              }`}
            >
              <span
                className={`block h-4 w-4 transform rounded-full bg-[#14171c] shadow-md transition-transform ${
                  settings.crtEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* High Contrast Radar Vectors */}
          <div className="flex items-center justify-between rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-3 transition-colors hover:border-[#eaba49]/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg border border-[#3a475c]/60 bg-[#1a1f26] p-2 text-[#eaba49]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#ffddcc] sm:text-sm">High Contrast Radar Vectors</p>
                <p className="text-[10px] text-[#7d8898] sm:text-[11px]">
                  Enhanced luminosity for 90° orthogonal maze traces
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleContrast(!settings.highContrast)}
              className={`relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors ${
                settings.highContrast ? "border-[#f3c85f] bg-[#eaba49]" : "border-[#3a475c] bg-[#1a1f26]"
              }`}
            >
              <span
                className={`block h-4 w-4 transform rounded-full bg-[#14171c] shadow-md transition-transform ${
                  settings.highContrast ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Settings Group 2: Audio & Sonar FX */}
        <div className="space-y-2 pt-1 font-mono">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#eaba49]">
            <Volume2 className="h-3.5 w-3.5" />
            <span>Acoustic & Sonar Telemetry</span>
          </span>

          {/* Sonar Audio Cues */}
          <div className="flex items-center justify-between rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-3 transition-colors hover:border-[#eaba49]/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg border border-[#3a475c]/60 bg-[#1a1f26] p-2 text-[#eaba49]">
                {settings.soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4 text-[#7d8898]" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#ffddcc] sm:text-sm">Sonar & Footprint Sound FX</p>
                <p className="text-[10px] text-[#7d8898] sm:text-[11px]">
                  Acoustic cues on footprint anomaly discovery
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !settings.soundEnabled;
                onToggleSound(nextVal);
                audioManager.updateSettings({ ...settings, soundEnabled: nextVal });
                if (nextVal) {
                  audioManager.playFootprintCollect();
                }
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors ${
                settings.soundEnabled ? "border-[#f3c85f] bg-[#eaba49]" : "border-[#3a475c] bg-[#1a1f26]"
              }`}
            >
              <span
                className={`block h-4 w-4 transform rounded-full bg-[#14171c] shadow-md transition-transform ${
                  settings.soundEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Ambient Soundscape */}
          <div className="flex items-center justify-between rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-3 transition-colors hover:border-[#eaba49]/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg border border-[#3a475c]/60 bg-[#1a1f26] p-2 text-[#eaba49]">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#ffddcc] sm:text-sm">
                  Living Forest & Wind Ambience
                </p>
                <p className="text-[10px] text-[#7d8898] sm:text-[11px]">
                  Atmospheric murmurs and field environment hum
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !settings.ambienceEnabled;
                onToggleAmbience(nextVal);
                audioManager.updateSettings({ ...settings, ambienceEnabled: nextVal });
                if (nextVal) {
                  audioManager.playUiClick();
                }
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors ${
                settings.ambienceEnabled ? "border-[#f3c85f] bg-[#eaba49]" : "border-[#3a475c] bg-[#1a1f26]"
              }`}
            >
              <span
                className={`block h-4 w-4 transform rounded-full bg-[#14171c] shadow-md transition-transform ${
                  settings.ambienceEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Master Volume Slider */}
          <div className="space-y-1.5 rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#ffddcc]">
                <Sliders className="h-3.5 w-3.5 text-[#eaba49]" />
                Volume
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#eaba49]">{settings.volume}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => {
                const newVol = parseInt(e.target.value, 10);
                onChangeVolume(newVol);
                audioManager.updateSettings({ ...settings, volume: newVol });
                audioManager.playVolumeTestPing();
              }}
              className="h-1.5 w-full cursor-pointer rounded-lg bg-[#1a1f26] accent-[#eaba49]"
            />
          </div>
        </div>

        {/* Settings Group 3: Tactical Keybinds Reference */}
        <div className="flex items-start space-x-3 rounded-xl border border-[#3a475c]/50 bg-[#0f1216]/50 p-3">
          <Gamepad2 className="mt-0.5 h-4 w-4 shrink-0 text-[#eaba49]" />
          <div className="space-y-1 font-mono text-xs">
            <p className="font-semibold text-[#ffddcc]">Controls Reference</p>
            <p className="leading-relaxed text-[#7d8898]">
              Use <span className="font-bold text-[#eaba49]">W / A / S / D</span> or{" "}
              <span className="font-bold text-[#eaba49]">Arrow Keys</span> on desktop. On mobile or touch
              devices, an on-screen tactical D-pad appears automatically.
            </p>
          </div>
        </div>

        {/* Footer Actions: Reset on far left, Apply & Close on far right */}
        <div className="flex items-center justify-between border-t border-[#3a475c]/50 pt-3 font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearCache}
              className="flex items-center gap-1.5 rounded-lg border border-[#e07a6b]/30 bg-[#e07a6b]/10 px-2.5 py-1.5 text-xs text-[#e07a6b] transition-colors hover:bg-[#e07a6b]/20 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            {resetFeedback && (
              <span className="animate-in fade-in flex items-center gap-1 text-xs text-[#7fc98f] duration-200">
                <Check className="h-3.5 w-3.5" />
                <span>{resetFeedback}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              audioManager.playUiClick();
              onClose();
            }}
            className="bitfoots-btn bitfoots-btn--solid rounded-xl px-5 py-2 font-mono text-xs font-bold"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
