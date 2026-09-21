"use client";

import { useState, useEffect, useCallback } from "react";

export interface GameSettings {
  crtEnabled: boolean;
  soundEnabled: boolean;
  ambienceEnabled: boolean;
  highContrast: boolean;
  volume: number; // 0 - 100
}

const STORAGE_KEYS = {
  CRT: "bitfoot_crt_pref",
  SOUND: "bitfoot_sound_pref",
  AMBIENCE: "bitfoot_ambience_pref",
  CONTRAST: "bitfoot_radar_contrast",
  VOLUME: "bitfoot_volume_pref",
};

const DEFAULT_SETTINGS: GameSettings = {
  crtEnabled: true,
  soundEnabled: true,
  ambienceEnabled: true,
  highContrast: false,
  volume: 80,
};

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Read settings from localStorage upon initial load
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const crtStored = localStorage.getItem(STORAGE_KEYS.CRT);
      const soundStored = localStorage.getItem(STORAGE_KEYS.SOUND);
      const ambienceStored = localStorage.getItem(STORAGE_KEYS.AMBIENCE);
      const contrastStored = localStorage.getItem(STORAGE_KEYS.CONTRAST);
      const volumeStored = localStorage.getItem(STORAGE_KEYS.VOLUME);

      setSettings({
        crtEnabled: crtStored !== null ? crtStored === "true" : DEFAULT_SETTINGS.crtEnabled,
        soundEnabled: soundStored !== null ? soundStored === "true" : DEFAULT_SETTINGS.soundEnabled,
        ambienceEnabled:
          ambienceStored !== null ? ambienceStored === "true" : DEFAULT_SETTINGS.ambienceEnabled,
        highContrast:
          contrastStored !== null ? contrastStored === "true" : DEFAULT_SETTINGS.highContrast,
        volume:
          volumeStored !== null
            ? Math.max(0, Math.min(100, parseInt(volumeStored, 10)))
            : DEFAULT_SETTINGS.volume,
      });
    } catch (err) {
      console.error("Failed to read settings from localStorage:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Update specific setting and persist immediately to localStorage
  const updateSetting = useCallback(
    <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        if (typeof window !== "undefined") {
          try {
            switch (key) {
              case "crtEnabled":
                localStorage.setItem(STORAGE_KEYS.CRT, String(value));
                break;
              case "soundEnabled":
                localStorage.setItem(STORAGE_KEYS.SOUND, String(value));
                break;
              case "ambienceEnabled":
                localStorage.setItem(STORAGE_KEYS.AMBIENCE, String(value));
                break;
              case "highContrast":
                localStorage.setItem(STORAGE_KEYS.CONTRAST, String(value));
                break;
              case "volume":
                localStorage.setItem(STORAGE_KEYS.VOLUME, String(value));
                break;
            }
          } catch (err) {
            console.error(`Failed to save ${key} to localStorage:`, err);
          }
        }
        return next;
      });
    },
    []
  );

  // Setters for convenience
  const setCrtEnabled = useCallback(
    (enabled: boolean) => updateSetting("crtEnabled", enabled),
    [updateSetting]
  );
  const setSoundEnabled = useCallback(
    (enabled: boolean) => updateSetting("soundEnabled", enabled),
    [updateSetting]
  );
  const setAmbienceEnabled = useCallback(
    (enabled: boolean) => updateSetting("ambienceEnabled", enabled),
    [updateSetting]
  );
  const setHighContrast = useCallback(
    (enabled: boolean) => updateSetting("highContrast", enabled),
    [updateSetting]
  );
  const setVolume = useCallback(
    (vol: number) => updateSetting("volume", Math.max(0, Math.min(100, vol))),
    [updateSetting]
  );

  // Reset all settings to defaults and purge keys
  const resetSettings = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEYS.CRT);
        localStorage.removeItem(STORAGE_KEYS.SOUND);
        localStorage.removeItem(STORAGE_KEYS.AMBIENCE);
        localStorage.removeItem(STORAGE_KEYS.CONTRAST);
        localStorage.removeItem(STORAGE_KEYS.VOLUME);
      } catch (err) {
        console.error("Failed to reset settings from localStorage:", err);
      }
    }
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    isLoaded,
    setCrtEnabled,
    setSoundEnabled,
    setAmbienceEnabled,
    setHighContrast,
    setVolume,
    updateSetting,
    resetSettings,
  };
}
