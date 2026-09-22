"use client";

import React, { useState, useEffect, useCallback } from "react";
import GameContainer from "@/components/game/GameContainer";
import { LeaderboardModal } from "@/components/ui/LeaderboardModal";
import { VirtualControls } from "@/components/ui/VirtualControls";
import { CryptidDossierModal } from "@/components/ui/CryptidDossierModal";
import { EntryGateModal } from "@/components/ui/EntryGateModal";
import { ProfileModal } from "@/components/ui/ProfileModal";
import { SettingsModal } from "@/components/ui/SettingsModal";
import { LivingWorldBackground } from "@/components/ui/LivingWorldBackground";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { SectorRoulette } from "@/components/ui/SectorRoulette";
import { ExportCardModal } from "@/components/ui/ExportCardModal";
import { useHunterSession } from "@/hooks/useHunterSession";
import { useGameSettings } from "@/hooks/useGameSettings";
import { audioManager } from "@/lib/audioManager";
import { SECTORS } from "@/game/config/sectors";
import {
  gameEventBus,
  FootprintCollectedPayload,
  SecretDiscoveredPayload,
  LoreModalPayload,
  ChapterFinishedPayload,
  PlayerDamagedPayload,
  GameOverPayload,
  HalvingEpochPayload,
  BossStatePayload,
} from "@/lib/eventBus";
import {
  Trophy,
  Footprints,
  Clock,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Gamepad2,
  Eye,
  Share2,
  AlertTriangle,
  Download,
  ArrowRight,
  Compass,
  Heart,
  Radio,
} from "lucide-react";

export default function GamePage() {
  // Hunter Profile & Session Hook
  const {
    profile,
    loading: sessionLoading,
    loginWithX,
    loginWithGoogle,
    setCustomUsername,
    updateProfile,
    unlockSector,
    logout,
    isSupabaseConfigured,
  } = useHunterSession();

  // Active Chapter State (S-01 to S-03 Final)
  const [activeChapter, setActiveChapter] = useState<1 | 2 | 3>(1);

  // Real-time HUD State
  const [score, setScore] = useState<number>(0);
  const [collectedCount, setCollectedCount] = useState<number>(0);
  const [totalFootprints, setTotalFootprints] = useState<number>(8);
  const [foundSilhouette, setFoundSilhouette] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [bonusNotification, setBonusNotification] = useState<string | null>(null);

  // Hardcore Survival & Sector-Specific HUD State
  const [hunterHealth, setHunterHealth] = useState<number>(3);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [sonarCooldown, setSonarCooldown] = useState<boolean>(false);
  const [halvingEpoch, setHalvingEpoch] = useState<number>(1);
  const [bossPillarsActive, setBossPillarsActive] = useState<number>(0);

  // Game Started / Standby State (Timer only starts when user clicks Start Expedition)
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  // Entry Gate Modal State (only opens if user has not yet signed in / set call-sign)
  const [isEntryGateOpen, setIsEntryGateOpen] = useState<boolean>(false);

  // Synchronize modal state with session authentication
  useEffect(() => {
    if (!sessionLoading) {
      if (!profile.isLoggedIn) {
        setIsEntryGateOpen(true);
      } else {
        setIsEntryGateOpen(false);
      }
    }
  }, [sessionLoading, profile.isLoggedIn]);

  // Synchronize active hunter profile to localStorage for Phaser scenes & API routes
  useEffect(() => {
    if (profile.userId && typeof window !== "undefined") {
      try {
        localStorage.setItem("bitfoot_hunter_guest_session", JSON.stringify(profile));
      } catch {}
    }
  }, [profile]);

  // UI Theme & Modals State
  const {
    settings,
    setCrtEnabled,
    setSoundEnabled,
    setAmbienceEnabled,
    setHighContrast,
    setVolume,
    resetSettings,
  } = useGameSettings();

  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExportCardModalOpen, setIsExportCardModalOpen] = useState<boolean>(false);
  const [downloadingCard, setDownloadingCard] = useState<boolean>(false);

  // Gameplay Modals State
  const [loreModalData, setLoreModalData] = useState<LoreModalPayload | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [finishedData, setFinishedData] = useState<ChapterFinishedPayload | null>(null);

  // Synchronize audio engine with user settings
  useEffect(() => {
    audioManager.updateSettings(settings);
  }, [settings]);

  // Unlock audio context on initial user interaction (click/touch/key)
  useEffect(() => {
    const unlockAudio = () => {
      audioManager.updateSettings(settings);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("click", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, [settings]);

  // HUD Timer
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Event Bus Subscriptions
  useEffect(() => {
    const handleFootprint = (data: FootprintCollectedPayload) => {
      audioManager.playFootprintCollect();
      setScore(data.totalScore);
      setCollectedCount(data.collectedCount);
      setTotalFootprints(data.totalCount);

      setBonusNotification(`+${data.scoreGained} Trace Verified`);
      setTimeout(() => setBonusNotification(null), 900);
    };

    const handleSecret = (data: SecretDiscoveredPayload) => {
      audioManager.playSecretDiscovered();
      setScore(data.totalScore);
      setFoundSilhouette(true);

      setBonusNotification("+50 Secret Silhouette Spotted!");
      setTimeout(() => setBonusNotification(null), 1500);
    };

    const handleShowLore = (data: LoreModalPayload) => {
      setIsTimerRunning(false);
      setLoreModalData(data);
      setSelectedOption(null);
      setAnswerSubmitted(false);
    };

    const handleDamaged = (data: PlayerDamagedPayload) => {
      audioManager.playLoreIncorrect();
      setHunterHealth(data.currentHealth);
      setBonusNotification(`⚠️ ${data.reason}!`);
      setTimeout(() => setBonusNotification(null), 1400);
    };

    const handleGameOver = (data: GameOverPayload) => {
      setIsTimerRunning(false);
      setGameOverReason(data.reason);
      audioManager.playRouletteDenied();
    };

    const handleFinished = (data: ChapterFinishedPayload) => {
      setIsTimerRunning(false);
      setFinishedData(data);
      if (data.success) {
        audioManager.playChapterComplete();
        // Unlock next sector if available (Sector 3 is final)
        if (activeChapter < 3) {
          unlockSector(activeChapter + 1);
        }
      }
    };

    const handleSonar = () => {
      setSonarCooldown(true);
      setTimeout(() => setSonarCooldown(false), 1800);
    };

    const handleHalving = (data: HalvingEpochPayload) => {
      setHalvingEpoch(data.epoch);
      setBonusNotification(`⚡ EPOCH ${data.epoch} HALVING!`);
      setTimeout(() => setBonusNotification(null), 2000);
    };

    const handleBoss = (data: BossStatePayload) => {
      setBossPillarsActive(data.pillarsActive);
      if (data.status === "trapped") {
        audioManager.playSecretDiscovered();
        setBonusNotification("👑 APEX BITFOOT CONFINED IN GENESIS SEAL!");
      } else {
        audioManager.playUiClick();
        setBonusNotification(`Pillar ${data.pillarsActive}/3 Charged!`);
      }
      setTimeout(() => setBonusNotification(null), 1800);
    };

    gameEventBus.on("FOOTPRINT_COLLECTED", handleFootprint);
    gameEventBus.on("SECRET_DISCOVERED", handleSecret);
    gameEventBus.on("SHOW_LORE_MODAL", handleShowLore);
    gameEventBus.on("PLAYER_DAMAGED", handleDamaged);
    gameEventBus.on("GAME_OVER", handleGameOver);
    gameEventBus.on("CHAPTER_FINISHED", handleFinished);
    gameEventBus.on("SONAR_PING_TRIGGERED", handleSonar);
    gameEventBus.on("HALVING_EPOCH_TRIGGERED", handleHalving);
    gameEventBus.on("BOSS_STATE_CHANGED", handleBoss);

    return () => {
      gameEventBus.off("FOOTPRINT_COLLECTED", handleFootprint);
      gameEventBus.off("SECRET_DISCOVERED", handleSecret);
      gameEventBus.off("SHOW_LORE_MODAL", handleShowLore);
      gameEventBus.off("PLAYER_DAMAGED", handleDamaged);
      gameEventBus.off("GAME_OVER", handleGameOver);
      gameEventBus.off("CHAPTER_FINISHED", handleFinished);
      gameEventBus.off("SONAR_PING_TRIGGERED", handleSonar);
      gameEventBus.off("HALVING_EPOCH_TRIGGERED", handleHalving);
      gameEventBus.off("BOSS_STATE_CHANGED", handleBoss);
    };
  }, [activeChapter, unlockSector]);

  // Switch Chapter Handler
  const handleSwitchChapter = (chapterId: 1 | 2 | 3, autoStart: boolean = false) => {
    audioManager.playUiClick();
    if (autoStart) {
      audioManager.playGameStart();
    }
    setActiveChapter(chapterId);
    setScore(0);
    setCollectedCount(0);
    const sec = SECTORS[chapterId] || SECTORS[1];
    setTotalFootprints(sec.tracesRequired);
    setHunterHealth(3);
    setGameOverReason(null);
    setFoundSilhouette(false);
    setElapsedSeconds(0);
    setIsGameStarted(autoStart);
    setIsTimerRunning(autoStart);
    setLoreModalData(null);
    setFinishedData(null);
    setSelectedOption(null);
    setAnswerSubmitted(false);
    setHalvingEpoch(1);
    setBossPillarsActive(0);

    gameEventBus.emit("SWITCH_CHAPTER", { chapterId, autoStart });
  };

  // React -> Phaser: Submit Chosen Answer
  const handleAnswerOptionClick = useCallback(
    (optionIndex: number) => {
      if (answerSubmitted || !loreModalData) return;
      setSelectedOption(optionIndex);
      setAnswerSubmitted(true);

      const isCorrect = optionIndex === loreModalData.correctAnswerIndex;
      if (isCorrect) {
        audioManager.playLoreCorrect();
      } else {
        audioManager.playLoreIncorrect();
      }

      setTimeout(() => {
        gameEventBus.emit("ANSWER_SUBMITTED", {
          isCorrect,
          selectedOptionIndex: optionIndex,
        });
        setLoreModalData(null);
      }, 1200);
    },
    [answerSubmitted, loreModalData]
  );

  // Restart Handler - immediately starts gameplay on retry unless explicitly passed false
  const handleRestart = useCallback(
    (param?: boolean | React.MouseEvent) => {
      const autoStart = typeof param === "boolean" ? param : true;
      audioManager.playUiClick();
      if (autoStart) {
        audioManager.playGameStart();
      }
      setScore(0);
      setCollectedCount(0);
      const sec = SECTORS[activeChapter] || SECTORS[1];
      setTotalFootprints(sec.tracesRequired);
      setHunterHealth(3);
      setGameOverReason(null);
      setFoundSilhouette(false);
      setElapsedSeconds(0);
      setIsGameStarted(autoStart);
      setIsTimerRunning(autoStart);
      setLoreModalData(null);
      setFinishedData(null);
      setSelectedOption(null);
      setAnswerSubmitted(false);
      setBonusNotification(null);
      setHalvingEpoch(1);
      setBossPillarsActive(0);

      gameEventBus.emit("RESTART_GAME", { autoStart });
    },
    [activeChapter]
  );

  // Active gameplay tracking: true when expedition is in-progress and no modal/game-over/finish is active
  const isGameActive =
    isGameStarted &&
    !gameOverReason &&
    !finishedData &&
    !loreModalData &&
    !isEntryGateOpen &&
    !isLeaderboardOpen &&
    !isDossierOpen &&
    !isProfileOpen &&
    !isSettingsOpen &&
    !isExportCardModalOpen;

  // Keep page fixed and prevent Space key (and arrows/pagedown) from scrolling during active gameplay
  useEffect(() => {
    const handlePreventScrollKeys = (e: KeyboardEvent) => {
      // Do not block keys if an input or textarea is active
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      const isInput =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isInput) return;

      // In Sector 3 (or whenever game is active), Space fires Sonar ping without scrolling page down
      if (e.code === "Space" || e.key === " " || e.key === "Spacebar" || e.keyCode === 32) {
        e.preventDefault();
      }

      // If expedition is active, prevent arrow keys and page navigation from scrolling the page
      if (isGameActive) {
        if (e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "PageUp" || e.code === "PageDown") {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handlePreventScrollKeys, { capture: true, passive: false });

    // Lock body and html scroll during active expedition to keep page stationary
    if (isGameActive) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handlePreventScrollKeys, { capture: true });
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isGameActive]);

  // Keyboard shortcut 'R' to quick reload / restart expedition
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "r" || e.key === "R") {
        if (isGameStarted && !loreModalData && !finishedData) {
          handleRestart();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGameStarted, loreModalData, finishedData, handleRestart]);

  // User Actions: Start Expedition
  const handleStartGame = () => {
    audioManager.playGameStart();
    setIsGameStarted(true);
    setIsTimerRunning(true);
    gameEventBus.emit("START_GAME");
  };

  // Handler for Entering Expedition via Entry Gate Modal
  const handleEnterWithUsername = (chosenName: string) => {
    setCustomUsername(chosenName);
    setIsEntryGateOpen(false);
    setIsGameStarted(false);
    setIsTimerRunning(false);
  };

  // Generate Dynamic OG Card URL
  const getOgCardUrl = () => {
    if (!finishedData) return "#";
    const badge =
      activeChapter === 3 ? "Apex Grand Hunter" : activeChapter === 2 ? "Grid Navigator" : "Forest Walker";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/api/og/score?score=${finishedData.totalScore}&time=${finishedData.timeElapsedSeconds}s&chapter=${activeChapter}&username=${encodeURIComponent(
      profile.username
    )}&avatar=${encodeURIComponent(profile.avatarUrl)}&badge=${encodeURIComponent(badge)}&uuid=${encodeURIComponent(profile.userId || "")}`;
  };

  // Download Badge Card Handler (Converts SVG to authentic 1200x630 PNG via canvas)
  const handleDownloadBadgeCard = async () => {
    try {
      setDownloadingCard(true);
      const url = getOgCardUrl();
      const res = await fetch(url);
      const svgText = await res.text();

      const img = new Image();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, 1200, 630);
              canvas.toBlob((blob) => {
                if (blob) {
                  const pngBlobUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  const safeName = (profile.username || "hunter").replace(/[^a-zA-Z0-9_-]/g, "");
                  a.href = pngBlobUrl;
                  a.download = `bitfoot_hunter_${safeName}_ch${activeChapter}.png`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  setTimeout(() => URL.revokeObjectURL(pngBlobUrl), 1000);
                }
                resolve();
              }, "image/png");
            } else {
              resolve();
            }
          } catch (err) {
            reject(err);
          } finally {
            URL.revokeObjectURL(blobUrl);
          }
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(blobUrl);
          reject(err);
        };
        img.src = blobUrl;
      });
    } catch (e) {
      console.error("Card download error, falling back to SVG:", e);
      const url = getOgCardUrl();
      const a = document.createElement("a");
      a.href = url;
      a.download = `bitfoot_hunt_ch${activeChapter}_${profile.username.replace(/[^a-zA-Z0-9_-]/g, "")}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setDownloadingCard(false);
    }
  };

  // Generate X (Twitter) Share Link with OG Image URL
  const getTwitterShareUrl = () => {
    if (!finishedData) return "#";
    const finalScore = finishedData.totalScore;
    const time = finishedData.timeElapsedSeconds;
    const badge =
      activeChapter === 3 ? "Apex Grand Hunter" : activeChapter === 2 ? "Grid Navigator" : "Forest Walker";
    const cardUrl = getOgCardUrl();
    const userTag = profile.username
      ? profile.username.startsWith("@")
        ? profile.username
        : `@${profile.username}`
      : "@Guest_Hunter";

    const text = `🌲 Here continues Tommy’s (@shelby_tommy0) latest high-stakes expedition across @BITFOOTS_!\n\n🐾 Operative: ${userTag}\n🧭 Sector: 0${activeChapter} Cleared\n🏆 Clearance Rank: ${badge}\n⚡ Telemetry: ${finalScore} PTS in ${time}s\n\n"Never caught. You don't buy a Bitfoot, you spot him."\n\n🔍 Inspect the verified on-chain dossier:\n${cardUrl}`;

    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&hashtags=BITFOOTS,Zcash,Web3Gaming,BitcoinOrdinals`;
  };

  // Nav Handlers
  const handleGoHome = () => {
    setIsLeaderboardOpen(false);
    setIsDossierOpen(false);
    setIsProfileOpen(false);
    setIsSettingsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-transparent font-sans text-[#aab6c9]">
      {/* Living World Background (Atmospheric Forest, Fog & Glowing Eyes) */}
      <LivingWorldBackground />

      {/* ============================================================ */}
      {/* 1. Global Command Navbar (Brand - Nav Links - Auth)          */}
      {/* ============================================================ */}
      <Navbar
        profile={profile}
        activeTab={isLeaderboardOpen ? "leaderboard" : isDossierOpen ? "about" : "home"}
        onOpenLeaderboard={() => {
          setIsDossierOpen(false);
          setIsProfileOpen(false);
          setIsSettingsOpen(false);
          setIsLeaderboardOpen(true);
        }}
        onOpenAbout={() => {
          setIsLeaderboardOpen(false);
          setIsProfileOpen(false);
          setIsSettingsOpen(false);
          setIsDossierOpen(true);
        }}
        onOpenProfile={() => {
          setIsLeaderboardOpen(false);
          setIsDossierOpen(false);
          setIsSettingsOpen(false);
          setIsProfileOpen(true);
        }}
        onOpenSettings={() => {
          setIsLeaderboardOpen(false);
          setIsDossierOpen(false);
          setIsProfileOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenLogin={() => setIsEntryGateOpen(true)}
        onLogout={async () => {
          await logout();
          setIsGameStarted(false);
          setIsTimerRunning(false);
          setElapsedSeconds(0);
          setIsEntryGateOpen(true);
        }}
        onGoHome={handleGoHome}
      />

      {/* Background Page Content (blurred when Entry Gate Modal is active) */}
      <div
        id="game-viewport-wrapper"
        className={`z-10 flex w-full max-w-6xl flex-1 flex-col items-center justify-between px-2 py-2 transition-all duration-700 ease-out sm:px-4 sm:py-3 ${
          isEntryGateOpen
            ? "pointer-events-none scale-[0.985] select-none blur-lg brightness-[0.40] filter"
            : "scale-100 brightness-100 filter-none"
        }`}
      >
        {/* Main Game Radar Stage with Refined Laboratory Bezel */}
        <div className="relative my-1 flex w-full max-w-6xl flex-1 flex-col items-center justify-center sm:my-2">
          {/* Terminal Radar Bezel Frame */}
          <div
            className={`relative aspect-[3/2] w-full max-w-5xl overflow-hidden rounded-2xl border-2 border-[#eaba49]/75 bg-black shadow-2xl ${
              settings.crtEnabled ? "crt-overlay" : ""
            } ${settings.highContrast ? "saturate-125 brightness-105 contrast-125" : ""}`}
          >
            {/* Isolated Phaser Canvas (Blurred slightly before user starts expedition) */}
            <div
              className={`h-full w-full transition-all duration-700 ease-out ${
                !isGameStarted
                  ? "pointer-events-none scale-[1.02] blur-[3.5px] brightness-[0.55] filter"
                  : "scale-100 brightness-100 filter-none"
              }`}
            >
              <GameContainer />
            </div>

            {/* LAYER 0.5: Standby Briefing & Personalized Start Expedition Overlay */}
            {!isGameStarted && (
              <div className="animate-in fade-in absolute inset-0 z-30 flex select-none items-center justify-center bg-black/45 p-4 backdrop-blur-[1.5px] duration-300">
                <div className="bitfoots-glass-card animate-in zoom-in-95 relative w-full max-w-md space-y-4 overflow-hidden rounded-2xl border border-[#eaba49]/80 p-6 text-center shadow-2xl duration-300 sm:p-8">
                  {/* Decorative radar scanline glow */}
                  <div className="absolute left-0 right-0 top-0 h-1 animate-pulse bg-gradient-to-r from-transparent via-[#eaba49] to-transparent" />

                  {/* Status chip */}
                  {/* Tactical Sector Standby Badge */}
                  <div className="flex items-center justify-center">
                    <span className="bitfoots-chip bitfoots-chip--solid px-3 py-1 text-[10px] sm:text-xs">
                      {`${SECTORS[activeChapter]?.code} // ${SECTORS[activeChapter]?.subTitle.toUpperCase()}`}
                    </span>
                  </div>

                  {/* Call-Sign Personalized Action Heading */}
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl font-medium tracking-tight text-[#ffddcc] sm:text-2xl">
                      Ready to Hunt, <span className="text-[#eaba49]">{profile.username || "Hunter"}</span>?
                    </h3>
                    <p className="mx-auto max-w-sm font-sans text-xs leading-relaxed text-[#c9ccd2] sm:text-sm">
                      {SECTORS[activeChapter]?.mechanicDescription}
                    </p>
                  </div>

                  {/* Mission Start Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleStartGame}
                      id="launch-expedition-btn"
                      className="bitfoots-btn bitfoots-btn--solid group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-xs font-bold tracking-[0.2em] shadow-xl shadow-[#eaba49]/20 transition-all hover:scale-[1.02] active:scale-[0.98] sm:text-sm"
                    >
                      <Gamepad2 className="h-4 w-4 text-[#14171c] transition-transform group-hover:scale-110" />
                      <span>START EXPEDITION</span>
                      <ArrowRight className="h-4 w-4 text-[#14171c] transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>

                  {/* Tactical Telemetry Note */}
                  <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[10px] text-[#7d8898]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7fc98f]" />
                    <span>
                      Target: {SECTORS[activeChapter]?.tracesRequired} Traces •{" "}
                      {SECTORS[activeChapter]?.difficultyRating}
                    </span>
                    <span>•</span>
                    <span>WASD / Arrow Keys</span>
                  </div>
                </div>
              </div>
            )}

            {/* LAYER 1: Tactile React HUD Overlay with High-Contrast Clear Telemetry */}
            <div className="pointer-events-none absolute inset-0 z-20 flex select-none flex-col justify-between p-2 sm:p-4">
              {/* Top HUD Telemetry Badges */}
              <div className="flex w-full flex-wrap items-center justify-between gap-1.5">
                {/* Left Group: Clearance Score + Hunter Health */}
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  {/* Telemetry Clearance Score Counter */}
                  <div className="relative flex items-center space-x-2 rounded-xl border border-[#eaba49]/80 bg-[#0f1216]/95 px-2.5 py-1.5 shadow-lg shadow-black/50 backdrop-blur-md sm:px-3">
                    <Trophy className="h-4 w-4 text-[#eaba49]" />
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#eaba49]">
                        CLEARANCE
                      </span>
                      <span className="font-mono text-xs font-extrabold leading-none text-[#f3c85f] sm:text-sm">
                        {score.toString().padStart(4, "0")}{" "}
                        <span className="text-[10px] text-[#eaba49]">PTS</span>
                      </span>
                    </div>
                    {bonusNotification && (
                      <span className="absolute -bottom-7 left-1 z-50 animate-bounce whitespace-nowrap rounded-lg border border-[#eaba49] bg-[#0f1216] px-2.5 py-1 font-mono text-[11px] font-bold text-[#ffddcc] shadow-lg shadow-[#eaba49]/20">
                        {bonusNotification}
                      </span>
                    )}
                  </div>

                  {/* Hunter Health / Hearts & HP */}
                  <div className="flex items-center space-x-1.5 rounded-xl border border-[#3a475c] bg-[#0f1216]/95 px-2.5 py-1.5 shadow-lg shadow-black/50 backdrop-blur-md sm:px-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((h) => (
                        <Heart
                          key={h}
                          className={`h-3.5 w-3.5 transition-all sm:h-4 sm:w-4 ${
                            h <= hunterHealth
                              ? "scale-105 fill-[#ef4444] text-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                              : "scale-90 fill-transparent text-[#475569] opacity-30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-0.5 font-mono text-[11px] font-bold text-[#ffddcc] sm:text-xs">
                      {hunterHealth}/3 <span className="text-[9px] uppercase text-[#7d8898]">HP</span>
                    </span>
                  </div>
                </div>

                {/* Center Group: Footprint Traces & Sector Radar Indicators */}
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  {/* Traces Counter & Visual Progress Meter */}
                  <div
                    className={`flex items-center space-x-2 rounded-xl border px-2.5 py-1.5 shadow-lg shadow-black/50 backdrop-blur-md transition-all sm:px-3 ${
                      collectedCount >= totalFootprints
                        ? "border-[#7fc98f] bg-[#064e3b]/90 text-[#7fc98f]"
                        : "border-[#eaba49]/80 bg-[#0f1216]/95 text-[#ffddcc]"
                    }`}
                  >
                    <Footprints
                      className={`h-4 w-4 ${collectedCount >= totalFootprints ? "animate-bounce text-[#7fc98f]" : "text-[#eaba49]"}`}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                          {collectedCount >= totalFootprints ? "READY" : "TRACES"}
                        </span>
                        <span className="font-mono text-xs font-bold leading-none sm:text-sm">
                          <span
                            className={
                              collectedCount >= totalFootprints ? "text-[#7fc98f]" : "text-[#eaba49]"
                            }
                          >
                            {collectedCount}
                          </span>
                          /{totalFootprints}
                        </span>
                      </div>
                      {/* Mini visual fill bar */}
                      <div className="mt-1 h-1 w-16 overflow-hidden rounded-full border border-[#3a475c]/60 bg-[#1e293b] sm:w-20">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            collectedCount >= totalFootprints
                              ? "bg-[#7fc98f] shadow-[0_0_6px_#7fc98f]"
                              : "bg-gradient-to-r from-[#eaba49] to-[#f59e0b]"
                          }`}
                          style={{
                            width: `${Math.min(100, (collectedCount / (totalFootprints || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sector Specific Badges */}
                  {activeChapter === 1 && (
                    <div
                      className={`flex items-center space-x-1.5 rounded-xl border px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-all ${
                        foundSilhouette
                          ? "border-[#38bdf8] bg-[#0284c7]/30 text-[#38bdf8]"
                          : "border-[#3a475c] bg-[#0f1216]/95 text-[#7d8898]"
                      }`}
                    >
                      <Eye
                        className={`h-3.5 w-3.5 ${foundSilhouette ? "animate-pulse text-[#38bdf8]" : ""}`}
                      />
                      <div className="flex flex-col">
                        <span className="font-mono text-[8px] font-bold uppercase tracking-wider">
                          CRYPTID
                        </span>
                        <span className="font-mono text-[10px] font-bold leading-none sm:text-xs">
                          {foundSilhouette ? "DETECTED!" : "HIDDEN"}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeChapter === 2 && (
                    <div className="flex items-center space-x-1.5 rounded-xl border border-[#00f0ff]/60 bg-[#0f1216]/95 px-2.5 py-1.5 text-[#00f0ff] shadow-lg backdrop-blur-md">
                      <Compass className="h-3.5 w-3.5 text-[#00f0ff]" />
                      <div className="flex flex-col">
                        <span className="font-mono text-[8px] font-bold uppercase tracking-wider">
                          VECTORS
                        </span>
                        <span className="font-mono text-[10px] font-bold leading-none sm:text-xs">
                          STRICT 90°
                        </span>
                      </div>
                    </div>
                  )}

                  {activeChapter === 3 && (
                    <button
                      onClick={() => gameEventBus.emit("TRIGGER_SONAR")}
                      disabled={sonarCooldown}
                      className={`pointer-events-auto flex items-center space-x-1.5 rounded-xl border px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-all ${
                        sonarCooldown
                          ? "border-[#3a475c] bg-[#0f1216]/95 text-[#7d8898]"
                          : "cursor-pointer border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8]/30 active:scale-95"
                      }`}
                    >
                      <Radio
                        className={`h-3.5 w-3.5 ${sonarCooldown ? "" : "animate-pulse text-[#38bdf8]"}`}
                      />
                      <div className="flex flex-col text-left">
                        <span className="font-mono text-[8px] font-bold uppercase tracking-wider">SONAR</span>
                        <span className="font-mono text-[10px] font-bold leading-none sm:text-xs">
                          {sonarCooldown ? "RECHARGING" : "PING [SPACE]"}
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                {/* Right Group: Expedition Clock & Tactical In-Game Reload Button */}
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  {/* Expedition Clock */}
                  <div className="flex items-center space-x-2 rounded-xl border border-[#3a475c] bg-[#0f1216]/95 px-2.5 py-1.5 shadow-lg shadow-black/50 backdrop-blur-md sm:px-3">
                    <Clock className="h-4 w-4 text-[#eaba49]" />
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-[#7d8898]">
                        TIME
                      </span>
                      <span className="font-mono text-xs font-bold leading-none text-[#ffddcc] sm:text-sm">
                        {Math.floor(elapsedSeconds / 60)
                          .toString()
                          .padStart(2, "0")}
                        :{(elapsedSeconds % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  {/* HUD Tactical Reload Button */}
                  <button
                    onClick={handleRestart}
                    id="hud-restart-btn"
                    title="Reload Sector / Restart Run (Shortcut: R)"
                    aria-label="Restart Expedition"
                    className="group pointer-events-auto flex cursor-pointer items-center justify-center rounded-xl border border-[#3a475c] bg-[#0f1216]/95 p-2 text-[#7d8898] shadow-lg backdrop-blur-md transition-all hover:border-[#eaba49] hover:text-[#f3c85f] active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4 text-[#eaba49] transition-transform duration-500 group-hover:-rotate-180" />
                  </button>
                </div>
              </div>

              {/* Bottom HUD: Dynamic Tactical Mission Directive Strip */}
              <div className="pointer-events-none mt-auto flex w-full items-center justify-between pt-2">
                <div className="flex items-center gap-2 rounded-xl border border-[#3a475c] bg-[#0f1216]/95 px-3 py-1.5 font-mono text-xs shadow-xl backdrop-blur-md">
                  <span
                    className={`h-2 w-2 rounded-full ${collectedCount >= totalFootprints ? "animate-ping bg-[#7fc98f]" : "animate-pulse bg-[#eaba49]"}`}
                  />
                  <span className="hidden text-[10px] font-bold uppercase text-[#7d8898] sm:inline">
                    OBJECTIVE:
                  </span>
                  <span
                    className={
                      collectedCount >= totalFootprints ? "font-bold text-[#7fc98f]" : "text-[#ffddcc]"
                    }
                  >
                    {collectedCount >= totalFootprints
                      ? "⚡ ALL TRACES SECURED // Monolith Gate unlocked! Enter portal to extract."
                      : `Collect ${totalFootprints - collectedCount} more anomaly traces • Avoid sector hazards`}
                  </span>
                </div>

                {/* Active Controls helper badge */}
                <div className="hidden items-center gap-2 rounded-xl border border-[#3a475c]/60 bg-[#0f1216]/90 px-2.5 py-1.5 font-mono text-[10px] text-[#7d8898] sm:flex">
                  {activeChapter === 3 && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-[#38bdf8]">[SPACE]</span> Sonar
                    </>
                  )}
                  <span>•</span>
                  <span className="font-bold text-[#f3c85f]">[R]</span> Retry
                </div>
              </div>
            </div>

            {/* LAYER 1.5: Hardcore Mission Failed Overlay */}
            {gameOverReason && (
              <div className="animate-in fade-in zoom-in-95 absolute inset-0 z-40 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md duration-200">
                <div className="bitfoots-glass-card w-full max-w-sm space-y-4 rounded-2xl border border-[#e07a6b] p-6 text-center shadow-2xl">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/60 bg-red-950/60 text-red-400 shadow-lg">
                    <AlertTriangle className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-bold tracking-wide text-[#ffddcc]">
                      SIGNAL LOST // RUN FAILED
                    </h3>
                    <p className="font-mono text-xs leading-relaxed text-[#aab6c9]">{gameOverReason}</p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleRestart}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#eaba49] px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-black shadow-xl shadow-[#eaba49]/20 transition-all hover:bg-[#f3c85f]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>RETRY</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* LAYER 2: TCI Lore Cryptographic Verification Modal */}
            {loreModalData && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md transition-all">
                <div className="bitfoots-glass-card animate-in fade-in zoom-in-95 w-full max-w-md space-y-4 rounded-2xl p-6 text-left shadow-2xl duration-200">
                  <div className="flex items-center space-x-2 border-b border-[#3a475c]/60 pb-3 text-[#eaba49]">
                    <HelpCircle className="h-5 w-5 text-[#eaba49]" />
                    <h3 className="font-serif text-sm font-medium tracking-wide text-[#ffddcc] sm:text-base">
                      Field Verification Gate
                    </h3>
                  </div>

                  <p className="font-serif text-xs font-medium leading-relaxed text-[#ffddcc] sm:text-sm">
                    {loreModalData.question}
                  </p>

                  <div className="grid grid-cols-1 gap-2 pt-1 font-mono">
                    {loreModalData.options.map((option, idx) => {
                      const isChosen = selectedOption === idx;
                      const isCorrect = idx === loreModalData.correctAnswerIndex;
                      let btnStyle =
                        "border-[#3a475c] bg-[#0f1216] hover:border-[#eaba49] text-[#aab6c9] hover:text-[#ffddcc]";

                      if (answerSubmitted) {
                        if (isCorrect) {
                          btnStyle = "border-[#7fc98f] bg-[#7fc98f]/20 text-[#7fc98f] font-bold";
                        } else if (isChosen && !isCorrect) {
                          btnStyle = "border-[#e07a6b] bg-[#e07a6b]/20 text-[#e07a6b] line-through";
                        } else {
                          btnStyle = "opacity-40 border-[#3a475c] bg-black/40";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={answerSubmitted}
                          onClick={() => handleAnswerOptionClick(idx)}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition-all sm:text-sm ${btnStyle}`}
                        >
                          <span>{option}</span>
                          {answerSubmitted && isCorrect && (
                            <CheckCircle2 className="ml-2 h-4 w-4 shrink-0 text-[#7fc98f]" />
                          )}
                          {answerSubmitted && isChosen && !isCorrect && (
                            <XCircle className="ml-2 h-4 w-4 shrink-0 text-[#e07a6b]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {answerSubmitted && (
                    <div className="animate-in fade-in rounded-lg border border-[#eaba49]/40 bg-[#0f1216] p-3 font-mono text-[11px] text-[#ffddcc] duration-300">
                      💡 <strong className="text-[10px] font-bold text-[#eaba49]">ARCHIVE CITATION:</strong>{" "}
                      {loreModalData.loreFact}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LAYER 3: Victory / Anomaly Telemetry Verified Modal */}
            {finishedData && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 p-3 backdrop-blur-lg transition-all sm:p-4">
                <div className="bitfoots-glass-card animate-in zoom-in-95 w-full max-w-md space-y-4 rounded-2xl p-6 text-center shadow-2xl duration-200 sm:p-7">
                  {finishedData.success ? (
                    <>
                      {/* Authentic BitFoots 90° Pixel Footprint Logo Seal */}
                      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#eaba49]/70 bg-gradient-to-br from-[#1a1f26] to-[#0f1216] text-[#eaba49] shadow-xl shadow-[#eaba49]/20">
                        <svg
                          viewBox="163 0 20 34"
                          className="h-8 w-6 text-[#eaba49] drop-shadow-[0_0_8px_rgba(234,186,73,0.7)]"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {/* Big Toe */}
                          <path d="M177.09 0H182V6.55H177.09V0Z" fill="currentColor" />
                          {/* Toe 2 */}
                          <path d="M172.18 1.63H175.45V6.55H172.18V1.63Z" fill="currentColor" />
                          {/* Toe 3 */}
                          <path d="M167.27 3.27H170.54V6.55H167.27V3.27Z" fill="currentColor" />
                          {/* Pinky Toe */}
                          <path d="M164 4.91H165.63V6.55H164V4.91Z" fill="currentColor" />
                          {/* Main Foot Pad */}
                          <path d="M164 8.18H182V21.28H164V8.18Z" fill="currentColor" />
                          {/* Heel */}
                          <path d="M164 21.28H175.45V32.8H164V21.28Z" fill="currentColor" />
                        </svg>
                      </div>

                      <div>
                        <h2 className="mt-1 font-serif text-xl font-medium tracking-tight text-[#ffddcc] sm:text-2xl">
                          Sector {activeChapter} Completed
                        </h2>
                        <p className="mt-0.5 font-mono text-xs text-[#d8c27a]">
                          Clearance Badge Earned:{" "}
                          {activeChapter === 1
                            ? "Forest Walker"
                            : activeChapter === 2
                              ? "Grid Navigator"
                              : "Apex Grand Hunter [FINAL]"}
                        </p>
                      </div>

                      {/* Detailed Telemetry Score Breakdown */}
                      <div className="space-y-2 rounded-xl border border-[#3a475c] bg-[#0f1216]/90 p-4 text-left font-mono text-xs">
                        <div className="flex items-center justify-between text-[#aab6c9]">
                          <span>
                            Traces Discovered ({finishedData.breakdown?.validFootprintsCount || 0}/
                            {SECTORS[activeChapter]?.tracesRequired || 6}):
                          </span>
                          <span className="font-bold text-[#7fc98f]">
                            +{finishedData.breakdown?.footprintsScore || 0} PTS
                          </span>
                        </div>

                        {activeChapter === 1 && (
                          <div className="flex items-center justify-between text-[#aab6c9]">
                            <span>Classified Specimen Sighting:</span>
                            <span
                              className={`font-bold ${
                                finishedData.breakdown?.silhouetteScore > 0
                                  ? "text-[#f3c85f]"
                                  : "text-[#7d8898]"
                              }`}
                            >
                              +{finishedData.breakdown?.silhouetteScore || 0} PTS
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[#aab6c9]">
                          <span>Field Lore Decryption:</span>
                          <span
                            className={`font-bold ${
                              finishedData.breakdown?.gateScore > 0 ? "text-[#eaba49]" : "text-[#e07a6b]"
                            }`}
                          >
                            +{finishedData.breakdown?.gateScore || 0} PTS
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[#aab6c9]">
                          <span className="flex items-center gap-1">
                            Speed Bonus ({finishedData.timeElapsedSeconds}s):
                          </span>
                          <span className="font-bold text-[#f3c85f]">
                            +{finishedData.breakdown?.speedBonus || 0} PTS
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between border-t border-[#3a475c]/70 pt-2.5 text-sm font-bold">
                          <span className="font-mono text-xs text-[#e6e8ec]">TOTAL CLEARANCE UNITS:</span>
                          <span className="font-mono text-base text-[#f3c85f]">
                            {finishedData.totalScore} PTS
                          </span>
                        </div>
                      </div>

                      {/* Intermediate Sectors (S-01 to S-02): Next Sector + Export Card + Re-survey */}
                      {activeChapter < 3 ? (
                        <div className="space-y-2.5 pt-1">
                          {/* Primary Button: Advance to Next Sector */}
                          <button
                            onClick={() => handleSwitchChapter((activeChapter + 1) as 1 | 2 | 3, true)}
                            className="bitfoots-btn bitfoots-btn--solid flex w-full cursor-pointer items-center justify-center space-x-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#eaba49]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span>Move to Sector {activeChapter + 1}</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>

                          {/* Export Card & Share on X Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setIsExportCardModalOpen(true)}
                              className="bitfoots-btn flex cursor-pointer items-center justify-center space-x-1.5 rounded-xl border-[#eaba49]/80 px-3 py-2 text-xs font-bold text-[#ffddcc] transition-all hover:bg-[#eaba49]/15"
                            >
                              <Download className="h-3.5 w-3.5 text-[#eaba49]" />
                              <span>Export Card</span>
                            </button>

                            <a
                              href={getTwitterShareUrl()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bitfoots-btn flex cursor-pointer items-center justify-center space-x-1.5 rounded-xl border-[#3a475c] px-3 py-2 text-xs font-bold text-[#aab6c9] transition-all hover:border-[#eaba49] hover:text-white"
                            >
                              <Share2 className="h-3.5 w-3.5 text-[#eaba49]" />
                              <span>Share on X</span>
                            </a>
                          </div>

                          {/* Re-survey Sector Button */}
                          <button
                            onClick={handleRestart}
                            className="bitfoots-btn flex w-full cursor-pointer items-center justify-center space-x-1.5 rounded-xl px-3 py-2 text-xs text-[#7d8898] transition-all hover:border-[#eaba49] hover:text-[#ffddcc]"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-[#eaba49]" />
                            <span>Retry Expedition</span>
                          </button>
                        </div>
                      ) : (
                        /* Final Sector (S-03 Shielded ZK): Conquered Expedition! Export Card & Share on X */
                        <div className="space-y-2.5 pt-1">
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              onClick={() => setIsExportCardModalOpen(true)}
                              className="bitfoots-btn bitfoots-btn--solid flex cursor-pointer items-center justify-center space-x-1.5 rounded-xl py-2.5 text-xs font-bold shadow-md shadow-[#eaba49]/20 transition-all hover:scale-[1.02]"
                            >
                              <Download className="h-3.5 w-3.5 text-[#14171c]" />
                              <span className="text-[#14171c]">Export Card</span>
                            </button>

                            <a
                              href={getTwitterShareUrl()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bitfoots-btn flex cursor-pointer items-center justify-center space-x-1.5 rounded-xl border-[#eaba49] py-2.5 text-xs font-bold text-[#ffddcc] transition-all hover:bg-[#eaba49]/15"
                            >
                              <Share2 className="h-3.5 w-3.5 text-[#eaba49]" />
                              <span>Share on X</span>
                            </a>
                          </div>

                          {/* Re-survey S-03 Button */}
                          <button
                            onClick={handleRestart}
                            className="bitfoots-btn flex w-full cursor-pointer items-center justify-center space-x-1.5 rounded-xl px-3 py-2.5 text-xs transition-all hover:border-[#eaba49]"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-[#eaba49]" />
                            <span>Retry S-03</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    // Telemetry Verification Failure
                    <>
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/60 bg-red-950/40 text-red-400 shadow-lg">
                        <AlertTriangle className="h-8 w-8" />
                      </div>

                      <div>
                        <h2 className="font-mono text-base font-bold uppercase tracking-wider text-red-400">
                          Telemetry Desync
                        </h2>
                        <p className="mt-1 font-mono text-xs text-slate-300">
                          {finishedData.error || "Score telemetry verification failed."}
                        </p>
                      </div>

                      <button
                        onClick={handleRestart}
                        className="bitfoots-btn flex w-full items-center justify-center space-x-2 rounded-xl px-4 py-2.5 text-xs"
                      >
                        <RotateCcw className="h-4 w-4 text-[#eaba49]" />
                        <span>Re-initialize Survey</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Optional Mobile Virtual D-Pad (Visible on small screens / touch) */}
          <div className="mt-3 block w-full max-w-xs md:hidden">
            <VirtualControls />
          </div>
        </div>
      </div>

      {/* Sector Roulette Dial (Fixed to Far Right Edge of Screen) */}
      <SectorRoulette
        activeChapter={activeChapter}
        onSelectChapter={handleSwitchChapter}
        isBlurred={isEntryGateOpen}
        unlockedSectors={Array.from(new Set([...(profile.unlockedSectors || [1]), activeChapter]))}
        isHoverDisabled={isGameActive}
      />

      {/* 4. The Cryptid Institute // Global Site Footer */}
      <Footer
        onOpenLeaderboard={() => {
          setIsDossierOpen(false);
          setIsLeaderboardOpen(true);
        }}
        onOpenAbout={() => {
          setIsLeaderboardOpen(false);
          setIsDossierOpen(true);
        }}
        onOpenLogin={() => setIsEntryGateOpen(true)}
        onSwitchChapter={handleSwitchChapter}
        activeChapter={activeChapter}
        unlockedSectors={profile.unlockedSectors}
        currentUsername={profile.username}
        currentUserId={profile.userId}
      />

      {/* 5. Modals & Overlays */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUserId={profile.userId}
      />

      <CryptidDossierModal isOpen={isDossierOpen} onClose={() => setIsDossierOpen(false)} />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        isSupabaseConfigured={isSupabaseConfigured}
        onUpdateProfile={updateProfile}
        onLoginWithGoogle={loginWithGoogle}
        onLoginWithX={loginWithX}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onToggleCrt={setCrtEnabled}
        onToggleSound={setSoundEnabled}
        onToggleAmbience={setAmbienceEnabled}
        onToggleContrast={setHighContrast}
        onChangeVolume={setVolume}
        onResetSettings={resetSettings}
      />

      {/* 6. Entry Gate Onboarding / Authentication Window */}
      <EntryGateModal
        isOpen={isEntryGateOpen}
        currentUsername={profile.username}
        isSupabaseConfigured={isSupabaseConfigured}
        canDismiss={true}
        onEnterWithUsername={handleEnterWithUsername}
        onLoginWithGoogle={loginWithGoogle}
        onLoginWithX={loginWithX}
        onClose={() => setIsEntryGateOpen(false)}
      />

      {/* 7. Export Card Modal */}
      {finishedData && (
        <ExportCardModal
          isOpen={isExportCardModalOpen}
          onClose={() => setIsExportCardModalOpen(false)}
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          score={finishedData.totalScore}
          timeElapsedSeconds={finishedData.timeElapsedSeconds}
          chapter={activeChapter}
          uuid={profile.userId}
        />
      )}
    </main>
  );
}
