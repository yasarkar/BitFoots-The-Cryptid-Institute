"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass, Trophy, BookOpen, LogIn, LogOut, User, Settings, ChevronDown } from "lucide-react";
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <header className="sticky top-0 z-40 w-full border-b border-[#3a475c]/70 bg-[#14171c]/90 shadow-2xl backdrop-blur-md transition-all">
      <div className="relative mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* ============================================================ */}
        {/* EN SOL: Logo ve Marka Adı                                    */}
        {/* ============================================================ */}
        <div
          onClick={onGoHome}
          className="group z-20 flex shrink-0 cursor-pointer select-none items-center space-x-3"
        >
          {/* Authentic BitFoots 90° Pixel Footprint Seal */}
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1f26] to-[#0f1216] text-[#eaba49] shadow-lg shadow-[#eaba49]/10 transition-all group-hover:scale-105">
            {/* The 90° Pixel Footprint SVG from Entry Gate Header */}
            <svg
              viewBox="163 0 20 34"
              className="h-6 w-4 text-[#eaba49] drop-shadow-[0_0_6px_rgba(234,186,73,0.6)] transition-colors group-hover:text-[#f3c85f]"
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

            <div className="absolute -right-1 -top-1 h-2 w-2 animate-ping rounded-full bg-[#eaba49]" />
            <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#eaba49]" />
          </div>

          {/* Brand Titles */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-base font-bold uppercase tracking-[0.16em] text-[#ffddcc] transition-colors group-hover:text-white sm:text-lg">
                BITFOOTS
              </span>
              <span className="bitfoots-chip hidden px-1.5 py-0.5 font-mono text-[9px] md:inline-block">
                SERIES 303
              </span>
            </div>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-[#eaba49] sm:inline-block sm:text-[10px]">
              THE CRYPTID INSTITUTE
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ORTA: Home, Leaderboard, About (Tam Ortalanmış)              */}
        {/* ============================================================ */}
        <nav className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center space-x-1 rounded-2xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-1 shadow-inner sm:space-x-2 sm:p-1.5">
          {/* Home Link */}
          <button
            onClick={onGoHome}
            id="nav-home-btn"
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-mono text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm ${
              activeTab === "home"
                ? "border border-[#eaba49] bg-[#eaba49]/20 font-bold text-[#ffddcc] shadow-sm"
                : "border border-transparent text-[#7d8898] hover:bg-[#1a1f26]/60 hover:text-[#e6e8ec]"
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-[#eaba49]" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Leaderboard Link */}
          <button
            onClick={onOpenLeaderboard}
            id="nav-leaderboard-btn"
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-mono text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm ${
              activeTab === "leaderboard"
                ? "border border-[#eaba49] bg-[#eaba49]/20 font-bold text-[#ffddcc] shadow-sm"
                : "border border-transparent text-[#7d8898] hover:bg-[#1a1f26]/60 hover:text-[#e6e8ec]"
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-[#eaba49]" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          {/* About Link */}
          <button
            onClick={onOpenAbout}
            id="nav-about-btn"
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-mono text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm ${
              activeTab === "about"
                ? "border border-[#eaba49] bg-[#eaba49]/20 font-bold text-[#ffddcc] shadow-sm"
                : "border border-transparent text-[#7d8898] hover:bg-[#1a1f26]/60 hover:text-[#e6e8ec]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-[#eaba49]" />
            <span className="hidden sm:inline">About</span>
          </button>
        </nav>

        {/* ============================================================ */}
        {/* EN SAĞ: Kullanıcı Giriş / Active Kullanıcı Menüsü             */}
        {/* ============================================================ */}
        <div className="z-20 flex shrink-0 items-center space-x-2">
          {!profile.isLoggedIn ? (
            // Giriş yapmamış kullanıcı: SADECE "Sign In" butonu sunulur
            <button
              onClick={onOpenLogin}
              id="nav-login-btn"
              className="bitfoots-btn bitfoots-btn--solid flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold tracking-wider shadow-lg sm:px-4"
            >
              <LogIn className="h-3.5 w-3.5" />
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
                  className={`group flex cursor-pointer select-none items-center space-x-2 rounded-xl border bg-[#0f1216] px-2.5 py-1.5 text-xs shadow-sm transition-all ${
                    isDropdownOpen
                      ? "border-[#eaba49] bg-[#1a1f26]/90 ring-1 ring-[#eaba49]/40"
                      : "border-[#eaba49]/60 hover:border-[#eaba49] hover:bg-[#1a1f26]/70"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.username}
                      className="h-5 w-5 rounded-full border border-[#eaba49] bg-black/60 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `/bitfoot-heads/bitfoot-head-01.png`;
                      }}
                    />
                  </div>
                  <span className="max-w-[130px] truncate font-mono text-xs font-semibold text-[#ffddcc] transition-colors group-hover:text-white sm:max-w-[200px] md:max-w-[260px]">
                    {profile.username}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
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
                    className="animate-in fade-in slide-in-from-top-2 absolute left-0 right-0 top-full z-50 mt-1.5 w-full select-none space-y-0.5 rounded-xl border border-[#eaba49]/60 bg-[#0f1216]/95 p-1 shadow-2xl shadow-black/80 backdrop-blur-xl duration-150"
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
                      className="group flex w-full items-center space-x-2 rounded-lg border border-transparent px-2 py-1.5 text-left font-mono text-xs text-[#ffddcc] transition-all hover:border-[#eaba49]/30 hover:bg-[#1a1f26] hover:text-[#eaba49]"
                    >
                      <div className="shrink-0 rounded-md border border-[#3a475c]/70 bg-[#14171c] p-1 text-[#eaba49] transition-colors group-hover:border-[#eaba49]/60">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate font-semibold leading-tight">Profile</span>
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
                      className="group flex w-full items-center space-x-2 rounded-lg border border-transparent px-2 py-1.5 text-left font-mono text-xs text-[#ffddcc] transition-all hover:border-[#eaba49]/30 hover:bg-[#1a1f26] hover:text-[#eaba49]"
                    >
                      <div className="shrink-0 rounded-md border border-[#3a475c]/70 bg-[#14171c] p-1 text-[#eaba49] transition-colors group-hover:border-[#eaba49]/60">
                        <Settings className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate font-semibold leading-tight">Settings</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hızlı Çıkış Yap Butonu */}
              <button
                onClick={onLogout}
                id="nav-logout-btn"
                className="bitfoots-btn flex items-center gap-1.5 rounded-xl border border-[#e07a6b]/40 px-2.5 py-1.5 font-mono text-xs font-medium text-[#e07a6b] transition-all hover:bg-[#e07a6b]/15 sm:px-3"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
