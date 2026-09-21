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
  Sparkles,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Gamepad2,
  Eye,
  Share2,
  AlertTriangle,
  Zap,
  Download,
  ArrowRight,
  Compass,
  Heart,
  Radio,
  Shield,
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
        if (
          e.code === "ArrowUp" ||
          e.code === "ArrowDown" ||
          e.code === "PageUp" ||
          e.code === "PageDown"
        ) {
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
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
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
      activeChapter === 3
        ? "Apex Grand Hunter"
        : activeChapter === 2
        ? "Grid Navigator"
        : "Forest Walker";
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
      activeChapter === 3
        ? "Apex Grand Hunter"
        : activeChapter === 2
        ? "Grid Navigator"
        : "Forest Walker";
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
    <main className="min-h-screen w-full flex flex-col items-center justify-between bg-transparent text-[#aab6c9] relative overflow-hidden font-sans">
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
        className={`w-full max-w-6xl px-2 sm:px-4 py-2 sm:py-3 flex flex-col items-center justify-between flex-1 transition-all duration-700 ease-out z-10 ${
          isEntryGateOpen
            ? "filter blur-lg brightness-[0.40] scale-[0.985] pointer-events-none select-none"
            : "filter-none brightness-100 scale-100"
        }`}
      >
        {/* Main Game Radar Stage with Refined Laboratory Bezel */}
        <div className="relative w-full max-w-6xl flex-1 flex flex-col items-center justify-center my-1 sm:my-2">
        {/* Terminal Radar Bezel Frame */}
        <div
          className={`w-full max-w-5xl aspect-[3/2] relative rounded-2xl overflow-hidden border-2 border-[#eaba49]/75 shadow-2xl bg-black ${
            settings.crtEnabled ? "crt-overlay" : ""
          } ${settings.highContrast ? "contrast-125 saturate-125 brightness-105" : ""}`}
        >
          {/* Isolated Phaser Canvas (Blurred slightly before user starts expedition) */}
          <div
            className={`w-full h-full transition-all duration-700 ease-out ${
              !isGameStarted
                ? "filter blur-[3.5px] brightness-[0.55] scale-[1.02] pointer-events-none"
                : "filter-none brightness-100 scale-100"
            }`}
          >
            <GameContainer />
          </div>

          {/* LAYER 0.5: Standby Briefing & Personalized Start Expedition Overlay */}
          {!isGameStarted && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[1.5px] animate-in fade-in duration-300 select-none">
              <div className="w-full max-w-md bitfoots-glass-card rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl border border-[#eaba49]/80 relative overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Decorative radar scanline glow */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#eaba49] to-transparent animate-pulse" />

                {/* Status chip */}
                {/* Tactical Sector Standby Badge */}
                <div className="flex items-center justify-center">
                  <span className="bitfoots-chip bitfoots-chip--solid text-[10px] sm:text-xs py-1 px-3">
                    {SECTORS[activeChapter]?.code} // {SECTORS[activeChapter]?.subTitle.toUpperCase()}
                  </span>
                </div>

                {/* Call-Sign Personalized Action Heading */}
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-serif text-[#ffddcc] font-medium tracking-tight">
                    Ready to Hunt,{" "}
                    <span className="text-[#eaba49]">
                      {profile.username || "Hunter"}
                    </span>
                    ?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#c9ccd2] max-w-sm mx-auto leading-relaxed font-sans">
                    {SECTORS[activeChapter]?.mechanicDescription}
                  </p>
                </div>

                {/* Mission Start Button */}
                <div className="pt-2">
                  <button
                    onClick={handleStartGame}
                    id="launch-expedition-btn"
                    className="w-full bitfoots-btn bitfoots-btn--solid py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold tracking-[0.2em] shadow-xl shadow-[#eaba49]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Gamepad2 className="w-4 h-4 text-[#14171c] group-hover:scale-110 transition-transform" />
                    <span>START EXPEDITION</span>
                    <ArrowRight className="w-4 h-4 text-[#14171c] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Tactical Telemetry Note */}
                <div className="pt-1 flex items-center justify-center gap-2 text-[10px] font-mono text-[#7d8898]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7fc98f] animate-pulse" />
                  <span>Target: {SECTORS[activeChapter]?.tracesRequired} Traces • {SECTORS[activeChapter]?.difficultyRating}</span>
                  <span>•</span>
                  <span>WASD / Arrow Keys</span>
                </div>
              </div>
            </div>
          )}

          {/* LAYER 1: Tactile React HUD Overlay with High-Contrast Clear Telemetry */}
          <div className="absolute inset-0 pointer-events-none p-2 sm:p-4 flex flex-col justify-between z-20 select-none">
            {/* Top HUD Telemetry Badges */}
            <div className="flex items-center justify-between w-full gap-1.5 flex-wrap">
              {/* Left Group: Clearance Score + Hunter Health */}
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {/* Telemetry Clearance Score Counter */}
                <div className="relative flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0f1216]/95 border border-[#eaba49]/80 backdrop-blur-md shadow-lg shadow-black/50">
                  <Trophy className="w-4 h-4 text-[#eaba49]" />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[#eaba49] font-mono font-bold uppercase tracking-wider">
                      CLEARANCE
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#f3c85f] font-mono leading-none">
                      {score.toString().padStart(4, "0")} <span className="text-[10px] text-[#eaba49]">PTS</span>
                    </span>
                  </div>
                  {bonusNotification && (
                    <span className="absolute -bottom-7 left-1 text-[11px] font-mono font-bold text-[#ffddcc] whitespace-nowrap bg-[#0f1216] px-2.5 py-1 rounded-lg border border-[#eaba49] shadow-lg shadow-[#eaba49]/20 animate-bounce z-50">
                      {bonusNotification}
                    </span>
                  )}
                </div>

                {/* Hunter Health / Hearts & HP */}
                <div className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0f1216]/95 border border-[#3a475c] backdrop-blur-md shadow-lg shadow-black/50">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((h) => (
                      <Heart
                        key={h}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all ${
                          h <= hunterHealth
                            ? "text-[#ef4444] fill-[#ef4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] scale-105"
                            : "text-[#475569] fill-transparent opacity-30 scale-90"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-[#ffddcc] ml-0.5">
                    {hunterHealth}/3 <span className="text-[9px] text-[#7d8898] uppercase">HP</span>
                  </span>
                </div>
              </div>

              {/* Center Group: Footprint Traces & Sector Radar Indicators */}
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {/* Traces Counter & Visual Progress Meter */}
                <div className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg shadow-black/50 border transition-all ${
                  collectedCount >= totalFootprints
                    ? "bg-[#064e3b]/90 border-[#7fc98f] text-[#7fc98f]"
                    : "bg-[#0f1216]/95 border-[#eaba49]/80 text-[#ffddcc]"
                }`}>
                  <Footprints className={`w-4 h-4 ${collectedCount >= totalFootprints ? "text-[#7fc98f] animate-bounce" : "text-[#eaba49]"}`} />
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                        {collectedCount >= totalFootprints ? "READY" : "TRACES"}
                      </span>
                      <span className="text-xs sm:text-sm font-bold font-mono leading-none">
                        <span className={collectedCount >= totalFootprints ? "text-[#7fc98f]" : "text-[#eaba49]"}>{collectedCount}</span>/{totalFootprints}
                      </span>
                    </div>
                    {/* Mini visual fill bar */}
                    <div className="w-16 sm:w-20 h-1 mt-1 bg-[#1e293b] rounded-full overflow-hidden border border-[#3a475c]/60">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          collectedCount >= totalFootprints
                            ? "bg-[#7fc98f] shadow-[0_0_6px_#7fc98f]"
                            : "bg-gradient-to-r from-[#eaba49] to-[#f59e0b]"
                        }`}
                        style={{ width: `${Math.min(100, (collectedCount / (totalFootprints || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sector Specific Badges */}
                {activeChapter === 1 && (
                  <div
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
                      foundSilhouette
                        ? "bg-[#0284c7]/30 border-[#38bdf8] text-[#38bdf8]"
                        : "bg-[#0f1216]/95 border-[#3a475c] text-[#7d8898]"
                    }`}
                  >
                    <Eye className={`w-3.5 h-3.5 ${foundSilhouette ? "text-[#38bdf8] animate-pulse" : ""}`} />
                    <div className="flex flex-col">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider">
                        CRYPTID
                      </span>
                      <span className="text-[10px] sm:text-xs font-mono font-bold leading-none">
                        {foundSilhouette ? "DETECTED!" : "HIDDEN"}
                      </span>
                    </div>
                  </div>
                )}

                {activeChapter === 2 && (
                  <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-[#00f0ff]/60 bg-[#0f1216]/95 text-[#00f0ff] backdrop-blur-md shadow-lg">
                    <Compass className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <div className="flex flex-col">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider">
                        VECTORS
                      </span>
                      <span className="text-[10px] sm:text-xs font-mono font-bold leading-none">
                        STRICT 90°
                      </span>
                    </div>
                  </div>
                )}

                {activeChapter === 3 && (
                  <button
                    onClick={() => gameEventBus.emit("TRIGGER_SONAR")}
                    disabled={sonarCooldown}
                    className={`pointer-events-auto flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border transition-all backdrop-blur-md shadow-lg ${
                      sonarCooldown
                        ? "border-[#3a475c] bg-[#0f1216]/95 text-[#7d8898]"
                        : "border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8]/30 active:scale-95 cursor-pointer"
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${sonarCooldown ? "" : "text-[#38bdf8] animate-pulse"}`} />
                    <div className="flex flex-col text-left">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider">
                        SONAR
                      </span>
                      <span className="text-[10px] sm:text-xs font-mono font-bold leading-none">
                        {sonarCooldown ? "RECHARGING" : "PING [SPACE]"}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* Right Group: Expedition Clock & Tactical In-Game Reload Button */}
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {/* Expedition Clock */}
                <div className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0f1216]/95 border border-[#3a475c] backdrop-blur-md shadow-lg shadow-black/50">
                  <Clock className="w-4 h-4 text-[#eaba49]" />
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-[#7d8898] font-mono font-bold uppercase tracking-wider">
                      TIME
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#ffddcc] font-mono leading-none">
                      {Math.floor(elapsedSeconds / 60)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {(elapsedSeconds % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* HUD Tactical Reload Button */}
                <button
                  onClick={handleRestart}
                  id="hud-restart-btn"
                  title="Reload Sector / Restart Run (Shortcut: R)"
                  aria-label="Restart Expedition"
                  className="pointer-events-auto flex items-center justify-center p-2 rounded-xl bg-[#0f1216]/95 border border-[#3a475c] hover:border-[#eaba49] text-[#7d8898] hover:text-[#f3c85f] backdrop-blur-md shadow-lg transition-all group active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500 text-[#eaba49]" />
                </button>
              </div>
            </div>

            {/* Bottom HUD: Dynamic Tactical Mission Directive Strip */}
            <div className="flex items-center justify-between w-full pointer-events-none mt-auto pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f1216]/95 border border-[#3a475c] backdrop-blur-md shadow-xl text-xs font-mono">
                <span className={`w-2 h-2 rounded-full ${collectedCount >= totalFootprints ? "bg-[#7fc98f] animate-ping" : "bg-[#eaba49] animate-pulse"}`} />
                <span className="text-[#7d8898] uppercase font-bold text-[10px] hidden sm:inline">OBJECTIVE:</span>
                <span className={collectedCount >= totalFootprints ? "text-[#7fc98f] font-bold" : "text-[#ffddcc]"}>
                  {collectedCount >= totalFootprints
                    ? "⚡ ALL TRACES SECURED // Monolith Gate unlocked! Enter portal to extract."
                    : `Collect ${totalFootprints - collectedCount} more anomaly traces • Avoid sector hazards`}
                </span>
              </div>

              {/* Active Controls helper badge */}
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/60 text-[10px] font-mono text-[#7d8898]">
                {activeChapter === 3 && (
                  <>
                    <span>•</span>
                    <span className="text-[#38bdf8] font-bold">[SPACE]</span> Sonar
                  </>
                )}
                <span>•</span>
                <span className="text-[#f3c85f] font-bold">[R]</span> Retry
              </div>
            </div>
          </div>

          {/* LAYER 1.5: Hardcore Mission Failed Overlay */}
          {gameOverReason && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-full max-w-sm bitfoots-glass-card rounded-2xl p-6 text-center space-y-4 border border-[#e07a6b] shadow-2xl">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-red-950/60 border border-red-500/60 flex items-center justify-center text-red-400 shadow-lg">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-[#ffddcc] tracking-wide">
                    SIGNAL LOST // RUN FAILED
                  </h3>
                  <p className="font-mono text-xs text-[#aab6c9] leading-relaxed">
                    {gameOverReason}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleRestart}
                    className="w-full py-3 px-4 rounded-xl bg-[#eaba49] hover:bg-[#f3c85f] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#eaba49]/20 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RETRY</span>
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* LAYER 2: TCI Lore Cryptographic Verification Modal */}
          {loreModalData && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-30 transition-all">
              <div className="w-full max-w-md bitfoots-glass-card rounded-2xl p-6 shadow-2xl text-left space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center space-x-2 text-[#eaba49] border-b border-[#3a475c]/60 pb-3">
                  <HelpCircle className="w-5 h-5 text-[#eaba49]" />
                  <h3 className="font-serif font-medium text-sm sm:text-base text-[#ffddcc] tracking-wide">
                    Field Verification Gate
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[#ffddcc] font-serif font-medium leading-relaxed">
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
                        btnStyle =
                          "border-[#7fc98f] bg-[#7fc98f]/20 text-[#7fc98f] font-bold";
                      } else if (isChosen && !isCorrect) {
                        btnStyle =
                          "border-[#e07a6b] bg-[#e07a6b]/20 text-[#e07a6b] line-through";
                      } else {
                        btnStyle = "opacity-40 border-[#3a475c] bg-black/40";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={answerSubmitted}
                        onClick={() => handleAnswerOptionClick(idx)}
                        className={`w-full py-2.5 px-3 rounded-lg border text-xs sm:text-sm text-left transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{option}</span>
                        {answerSubmitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-[#7fc98f] ml-2 shrink-0" />
                        )}
                        {answerSubmitted && isChosen && !isCorrect && (
                          <XCircle className="w-4 h-4 text-[#e07a6b] ml-2 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {answerSubmitted && (
                  <div className="text-[11px] text-[#ffddcc] font-mono bg-[#0f1216] p-3 rounded-lg border border-[#eaba49]/40 animate-in fade-in duration-300">
                    💡 <strong className="font-bold text-[10px] text-[#eaba49]">ARCHIVE CITATION:</strong> {loreModalData.loreFact}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LAYER 3: Victory / Anomaly Telemetry Verified Modal */}
          {finishedData && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 z-30 transition-all">
              <div className="w-full max-w-md bitfoots-glass-card rounded-2xl p-6 sm:p-7 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
                {finishedData.success ? (
                  <>
                    {/* Authentic BitFoots 90° Pixel Footprint Logo Seal */}
                    <div className="relative w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#1a1f26] to-[#0f1216] border border-[#eaba49]/70 flex items-center justify-center text-[#eaba49] shadow-xl shadow-[#eaba49]/20">
                      <svg
                        viewBox="163 0 20 34"
                        className="w-6 h-8 text-[#eaba49] drop-shadow-[0_0_8px_rgba(234,186,73,0.7)]"
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
                      <h2 className="text-xl sm:text-2xl font-serif text-[#ffddcc] font-medium tracking-tight mt-1">
                        Sector {activeChapter} Completed
                      </h2>
                      <p className="text-xs text-[#d8c27a] font-mono mt-0.5">
                        Clearance Badge Earned:{" "}
                        {activeChapter === 1
                          ? "Forest Walker"
                          : activeChapter === 2
                          ? "Grid Navigator"
                          : "Apex Grand Hunter [FINAL]"}
                      </p>
                    </div>


                    {/* Detailed Telemetry Score Breakdown */}
                    <div className="bg-[#0f1216]/90 border border-[#3a475c] rounded-xl p-4 space-y-2 text-xs font-mono text-left">
                      <div className="flex justify-between items-center text-[#aab6c9]">
                        <span>
                          Traces Discovered ({finishedData.breakdown?.validFootprintsCount || 0}/
                          {SECTORS[activeChapter]?.tracesRequired || 6}):
                        </span>
                        <span className="font-bold text-[#7fc98f]">
                          +{finishedData.breakdown?.footprintsScore || 0} PTS
                        </span>
                      </div>

                      {activeChapter === 1 && (
                        <div className="flex justify-between items-center text-[#aab6c9]">
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

                      <div className="flex justify-between items-center text-[#aab6c9]">
                        <span>Field Lore Decryption:</span>
                        <span
                          className={`font-bold ${
                            finishedData.breakdown?.gateScore > 0
                              ? "text-[#eaba49]"
                              : "text-[#e07a6b]"
                          }`}
                        >
                          +{finishedData.breakdown?.gateScore || 0} PTS
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[#aab6c9]">
                        <span className="flex items-center gap-1">
                          Speed Bonus ({finishedData.timeElapsedSeconds}s):
                        </span>
                        <span className="font-bold text-[#f3c85f]">
                          +{finishedData.breakdown?.speedBonus || 0} PTS
                        </span>
                      </div>

                      <div className="border-t border-[#3a475c]/70 pt-2.5 mt-1 flex justify-between items-center text-sm font-bold">
                        <span className="text-[#e6e8ec] font-mono text-xs">TOTAL CLEARANCE UNITS:</span>
                        <span className="text-[#f3c85f] font-mono text-base">
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
                          className="w-full bitfoots-btn bitfoots-btn--solid py-3 px-4 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center space-x-2 shadow-lg shadow-[#eaba49]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <span>
                            Move to Sector {activeChapter + 1}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        {/* Export Card & Share on X Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setIsExportCardModalOpen(true)}
                            className="bitfoots-btn py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border-[#eaba49]/80 hover:bg-[#eaba49]/15 text-[#ffddcc] transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-[#eaba49]" />
                            <span>Export Card</span>
                          </button>

                          <a
                            href={getTwitterShareUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bitfoots-btn py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border-[#3a475c] hover:border-[#eaba49] text-[#aab6c9] hover:text-white transition-all cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#eaba49]" />
                            <span>Share on X</span>
                          </a>
                        </div>

                        {/* Re-survey Sector Button */}
                        <button
                          onClick={handleRestart}
                          className="w-full bitfoots-btn py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 hover:border-[#eaba49] transition-all cursor-pointer text-[#7d8898] hover:text-[#ffddcc]"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#eaba49]" />
                          <span>Retry Expedition</span>
                        </button>
                      </div>
                    ) : (
                      /* Final Sector (S-03 Shielded ZK): Conquered Expedition! Export Card & Share on X */
                      <div className="space-y-2.5 pt-1">
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={() => setIsExportCardModalOpen(true)} 
                            className="bitfoots-btn bitfoots-btn--solid py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-[#eaba49]/20 hover:scale-[1.02] transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-[#14171c]" />
                            <span className="text-[#14171c]">Export Card</span>
                          </button>

                          <a
                            href={getTwitterShareUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bitfoots-btn py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border-[#eaba49] hover:bg-[#eaba49]/15 text-[#ffddcc] transition-all cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#eaba49]" />
                            <span>Share on X</span>
                          </a>
                        </div>

                        {/* Re-survey S-03 Button */}
                        <button
                          onClick={handleRestart}
                          className="w-full bitfoots-btn py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 hover:border-[#eaba49] transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#eaba49]" />
                          <span>Retry S-03</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  // Telemetry Verification Failure
                  <>
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/40 border border-red-500/60 flex items-center justify-center text-red-400 shadow-lg">
                      <AlertTriangle className="w-8 h-8" />
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-red-400 uppercase tracking-wider font-mono">
                        Telemetry Desync
                      </h2>
                      <p className="text-xs text-slate-300 font-mono mt-1">
                        {finishedData.error || "Score telemetry verification failed."}
                      </p>
                    </div>

                    <button
                      onClick={handleRestart}
                      className="bitfoots-btn py-2.5 px-4 rounded-xl text-xs w-full flex items-center justify-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4 text-[#eaba49]" />
                      <span>Re-initialize Survey</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Optional Mobile Virtual D-Pad (Visible on small screens / touch) */}
        <div className="mt-3 block md:hidden w-full max-w-xs">
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
    />

    {/* 5. Modals & Overlays */}
    <LeaderboardModal
      isOpen={isLeaderboardOpen}
      onClose={() => setIsLeaderboardOpen(false)}
      currentUserId={profile.userId}
    />

    <CryptidDossierModal
      isOpen={isDossierOpen}
      onClose={() => setIsDossierOpen(false)}
    />

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
