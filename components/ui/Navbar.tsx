"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  Trophy,
  BookOpen,
  LogIn,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";
import { HunterProfile } from "@/hooks/useHunterSession";

interface NavbarProps {
  profile: HunterProfile;
  activeTab?: "home" | "leaderboard" | "about";
  onOpenLeaderboard: () => void;
  onOpenAbout: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onGoHome?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  activeTab = "home",
  onOpenLeaderboard,
  onOpenAbout,
  onOpenLogin,
  onLogout,
  onGoHome,
  onOpenProfile,
  onOpenSettings,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <header className="w-full sticky top-0 z-40 bg-[#14171c]/90 backdrop-blur-md border-b border-[#3a475c]/70 shadow-2xl transition-all">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 relative flex items-center justify-between gap-4">
        {/* ============================================================ */}
        {/* EN SOL: Logo ve Marka Adı                                    */}
        {/* ============================================================ */}
        <div
          onClick={onGoHome}
          className="flex items-center space-x-3 cursor-pointer select-none group shrink-0 z-20"
        >
          {/* Authentic BitFoots 90° Pixel Footprint Seal */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1f26] to-[#0f1216] flex items-center justify-center text-[#eaba49] shadow-lg shadow-[#eaba49]/10 group-hover:scale-105 transition-all overflow-hidden">
            {/* The 90° Pixel Footprint SVG from Entry Gate Header */}
            <svg
              viewBox="163 0 20 34"
              className="w-4 h-6 text-[#eaba49] group-hover:text-[#f3c85f] transition-colors drop-shadow-[0_0_6px_rgba(234,186,73,0.6)]"
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

            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#eaba49] animate-ping" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#eaba49]" />
          </div>

          {/* Brand Titles */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base sm:text-lg tracking-[0.16em] text-[#ffddcc] uppercase group-hover:text-white transition-colors">
                BITFOOTS
              </span>
              <span className="hidden md:inline-block bitfoots-chip text-[9px] py-0.5 px-1.5 font-mono">
                SERIES 303
              </span>
            </div>
            <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-mono tracking-[0.18em] text-[#eaba49] uppercase">
              THE CRYPTID INSTITUTE
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ORTA: Home, Leaderboard, About (Tam Ortalanmış)              */}
        {/* ============================================================ */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1 sm:space-x-2 bg-[#0f1216]/90 p-1 sm:p-1.5 rounded-2xl border border-[#3a475c]/70 shadow-inner z-10">
          {/* Home Link */}
          <button
            onClick={onGoHome}
            id="nav-home-btn"
            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "home"
                ? "bg-[#eaba49]/20 border border-[#eaba49] text-[#ffddcc] shadow-sm font-bold"
                : "text-[#7d8898] hover:text-[#e6e8ec] hover:bg-[#1a1f26]/60 border border-transparent"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#eaba49]" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Leaderboard Link */}
          <button
            onClick={onOpenLeaderboard}
            id="nav-leaderboard-btn"
            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "leaderboard"
                ? "bg-[#eaba49]/20 border border-[#eaba49] text-[#ffddcc] shadow-sm font-bold"
                : "text-[#7d8898] hover:text-[#e6e8ec] hover:bg-[#1a1f26]/60 border border-transparent"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#eaba49]" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          {/* About Link */}
          <button
            onClick={onOpenAbout}
            id="nav-about-btn"
            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-mono font-medium flex items-center gap-1.5 transition-all ${
              activeTab === "about"
                ? "bg-[#eaba49]/20 border border-[#eaba49] text-[#ffddcc] shadow-sm font-bold"
                : "text-[#7d8898] hover:text-[#e6e8ec] hover:bg-[#1a1f26]/60 border border-transparent"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#eaba49]" />
            <span className="hidden sm:inline">About</span>
          </button>
        </nav>

        {/* ============================================================ */}
        {/* EN SAĞ: Kullanıcı Giriş / Active Kullanıcı Menüsü             */}
        {/* ============================================================ */}
        <div className="flex items-center space-x-2 shrink-0 z-20">
          {!profile.isLoggedIn ? (
            // Giriş yapmamış kullanıcı: SADECE "Sign In" butonu sunulur
            <button
              onClick={onOpenLogin}
              id="nav-login-btn"
              className="bitfoots-btn bitfoots-btn--solid py-1.5 px-3.5 sm:px-4 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 tracking-wider shadow-lg"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          ) : (
            // Kullanıcı adı belirlemiş / giriş yapmış: Active kullanıcı alanı ve alta doğru açılan droplist
            <div className="flex items-center space-x-2">
              <div className="relative" ref={dropdownRef}>
                {/* Active Kullanıcı Alanı Butonu */}
                <button
                  type="button"
                  id="nav-user-menu-btn"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                  className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-[#0f1216] border text-xs shadow-sm cursor-pointer select-none transition-all group ${
                    isDropdownOpen
                      ? "border-[#eaba49] bg-[#1a1f26]/90 ring-1 ring-[#eaba49]/40"
                      : "border-[#eaba49]/60 hover:border-[#eaba49] hover:bg-[#1a1f26]/70"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.username}
                      className="w-5 h-5 rounded-full border border-[#eaba49] bg-black/60 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `/bitfoot-heads/bitfoot-head-01.png`;
                      }}
                    />
                  </div>
                  <span className="font-mono text-[#ffddcc] font-semibold text-xs truncate max-w-[130px] sm:max-w-[200px] md:max-w-[260px] group-hover:text-white transition-colors">
                    {profile.username}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isDropdownOpen
                        ? "rotate-180 text-[#eaba49]"
                        : "text-[#7d8898] group-hover:text-[#ffddcc]"
                    }`}
                  />
                </button>

                {/* ============================================================ */}
                {/* Alta Doğru Açılan Droplist (Profile ve Settings Seçenekleri)   */}
                {/* ============================================================ */}
                {isDropdownOpen && (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute left-0 right-0 top-full mt-1.5 w-full bg-[#0f1216]/95 backdrop-blur-xl border border-[#eaba49]/60 rounded-xl shadow-2xl shadow-black/80 p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 select-none space-y-0.5"
                  >
                    {/* Profile Seçeneği */}
                    <button
                      type="button"
                      role="menuitem"
                      id="menu-profile-btn"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenProfile?.();
                      }}
                      className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs font-mono text-[#ffddcc] hover:bg-[#1a1f26] hover:text-[#eaba49] border border-transparent hover:border-[#eaba49]/30 transition-all text-left group"
                    >
                      <div className="p-1 rounded-md bg-[#14171c] border border-[#3a475c]/70 group-hover:border-[#eaba49]/60 text-[#eaba49] transition-colors shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold leading-tight truncate">Profile</span>
                    </button>

                    {/* Settings Seçeneği */}
                    <button
                      type="button"
                      role="menuitem"
                      id="menu-settings-btn"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenSettings?.();
                      }}
                      className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs font-mono text-[#ffddcc] hover:bg-[#1a1f26] hover:text-[#eaba49] border border-transparent hover:border-[#eaba49]/30 transition-all text-left group"
                    >
                      <div className="p-1 rounded-md bg-[#14171c] border border-[#3a475c]/70 group-hover:border-[#eaba49]/60 text-[#eaba49] transition-colors shrink-0">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold leading-tight truncate">Settings</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hızlı Çıkış Yap Butonu */}
              <button
                onClick={onLogout}
                id="nav-logout-btn"
                className="bitfoots-btn py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-mono font-medium text-[#e07a6b] hover:bg-[#e07a6b]/15 border border-[#e07a6b]/40 flex items-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

