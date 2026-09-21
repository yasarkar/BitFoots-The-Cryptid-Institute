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
    if (
      window.confirm(
        "Are you sure you want to reset your local expedition preferences and cache?"
      )
    ) {
      audioManager.playUiClick();
      onResetSettings();
      setResetFeedback("Preferences reset to defaults and cache cleared.");
      setTimeout(() => setResetFeedback(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bitfoots-glass-card rounded-2xl p-5 sm:p-7 shadow-2xl overflow-hidden text-[#aab6c9] font-sans border border-[#eaba49]/60 flex flex-col space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#eaba49]/15 border border-[#eaba49]/50 flex items-center justify-center text-[#eaba49] shadow-md shadow-[#eaba49]/10">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#eaba49] tracking-wider uppercase block">
                THE CRYPTID INSTITUTE // SYSTEM CONFIGURATION
              </span>
              <h2 className="text-base sm:text-lg font-serif font-medium text-[#ffddcc] tracking-wide">
                Expedition Settings
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#0f1216] hover:bg-[#1a1f26] border border-[#3a475c] text-[#7d8898] hover:text-[#eaba49] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Group 1: Visuals & Surveillance */}
        <div className="space-y-2 font-mono">
          <span className="text-[11px] font-semibold text-[#eaba49] flex items-center gap-1.5 uppercase tracking-wider">
            <Monitor className="w-3.5 h-3.5" />
            <span>Display & Surveillance Optics</span>
          </span>

          {/* CRT Surveillance Filter */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/70 hover:border-[#eaba49]/50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[#1a1f26] text-[#eaba49] border border-[#3a475c]/60">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[#ffddcc] font-semibold text-xs sm:text-sm">
                  CRT Retro Surveillance Scanlines
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#7d8898]">
                  Retro cathode-ray tube curvature and scanline overlay
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleCrt(!settings.crtEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border shrink-0 ${
                settings.crtEnabled
                  ? "bg-[#eaba49] border-[#f3c85f]"
                  : "bg-[#1a1f26] border-[#3a475c]"
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-[#14171c] shadow-md transform transition-transform ${
                  settings.crtEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* High Contrast Radar Vectors */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/70 hover:border-[#eaba49]/50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[#1a1f26] text-[#eaba49] border border-[#3a475c]/60">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[#ffddcc] font-semibold text-xs sm:text-sm">
                  High Contrast Radar Vectors
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#7d8898]">
                  Enhanced luminosity for 90° orthogonal maze traces
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleContrast(!settings.highContrast)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border shrink-0 ${
                settings.highContrast
                  ? "bg-[#eaba49] border-[#f3c85f]"
                  : "bg-[#1a1f26] border-[#3a475c]"
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-[#14171c] shadow-md transform transition-transform ${
                  settings.highContrast ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Settings Group 2: Audio & Sonar FX */}
        <div className="space-y-2 font-mono pt-1">
          <span className="text-[11px] font-semibold text-[#eaba49] flex items-center gap-1.5 uppercase tracking-wider">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Acoustic & Sonar Telemetry</span>
          </span>

          {/* Sonar Audio Cues */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/70 hover:border-[#eaba49]/50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[#1a1f26] text-[#eaba49] border border-[#3a475c]/60">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#7d8898]" />
                )}
              </div>
              <div>
                <p className="text-[#ffddcc] font-semibold text-xs sm:text-sm">
                  Sonar & Footprint Sound FX
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#7d8898]">
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
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border shrink-0 ${
                settings.soundEnabled
                  ? "bg-[#eaba49] border-[#f3c85f]"
                  : "bg-[#1a1f26] border-[#3a475c]"
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-[#14171c] shadow-md transform transition-transform ${
                  settings.soundEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Ambient Soundscape */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/70 hover:border-[#eaba49]/50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[#1a1f26] text-[#eaba49] border border-[#3a475c]/60">
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[#ffddcc] font-semibold text-xs sm:text-sm">
                  Living Forest & Wind Ambience
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#7d8898]">
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
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border shrink-0 ${
                settings.ambienceEnabled
                  ? "bg-[#eaba49] border-[#f3c85f]"
                  : "bg-[#1a1f26] border-[#3a475c]"
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-[#14171c] shadow-md transform transition-transform ${
                  settings.ambienceEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Master Volume Slider */}
          <div className="p-3 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/70 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#ffddcc] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#eaba49]" />
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
              className="w-full accent-[#eaba49] cursor-pointer h-1.5 bg-[#1a1f26] rounded-lg"
            />
          </div>
        </div>

        {/* Settings Group 3: Tactical Keybinds Reference */}
        <div className="p-3 rounded-xl bg-[#0f1216]/50 border border-[#3a475c]/50 flex items-start space-x-3">
          <Gamepad2 className="w-4 h-4 text-[#eaba49] mt-0.5 shrink-0" />
          <div className="space-y-1 text-xs font-mono">
            <p className="text-[#ffddcc] font-semibold">Controls Reference</p>
            <p className="text-[#7d8898] leading-relaxed">
              Use <span className="text-[#eaba49] font-bold">W / A / S / D</span> or{" "}
              <span className="text-[#eaba49] font-bold">Arrow Keys</span> on desktop. On
              mobile or touch devices, an on-screen tactical D-pad appears automatically.
            </p>
          </div>
        </div>

        {/* Footer Actions: Reset on far left, Apply & Close on far right */}
        <div className="pt-3 border-t border-[#3a475c]/50 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearCache}
              className="text-xs text-[#e07a6b] hover:text-red-400 flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg border border-[#e07a6b]/30 bg-[#e07a6b]/10 hover:bg-[#e07a6b]/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {resetFeedback && (
              <span className="text-xs text-[#7fc98f] flex items-center gap-1 animate-in fade-in duration-200">
                <Check className="w-3.5 h-3.5" />
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
            className="bitfoots-btn bitfoots-btn--solid px-5 py-2 rounded-xl text-xs font-mono font-bold"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
