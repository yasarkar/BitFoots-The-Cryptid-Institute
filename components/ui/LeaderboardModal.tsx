"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LeaderboardItem } from "@/app/api/leaderboard/route";
import { subscribeToLeaderboard } from "@/lib/supabaseClient";
import {
  Trophy,
  X,
  RotateCw,
  Crown,
  Medal,
  UserCheck,
  Radio,
  Sparkles,
} from "lucide-react";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardItem | null>(null);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = currentUserId
        ? `/api/leaderboard?userId=${encodeURIComponent(currentUserId)}`
        : "/api/leaderboard";
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success) {
        setLeaderboard(data.leaderboard || []);
        setUserRank(data.userRank);
        setCurrentUserEntry(data.currentUserEntry);
        setIsLiveSupabase(Boolean(data.isLiveSupabase));
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } else {
        setError(data.error || "Failed to load leaderboard registry.");
      }
    } catch {
      setError("Connection error occurred while contacting leaderboard registry.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      // Subscribe to live Supabase Postgres changes for real-time scores
      const unsubscribe = subscribeToLeaderboard(() => {
        fetchLeaderboard();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isOpen, fetchLeaderboard]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bitfoots-glass-card rounded-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#aab6c9] font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#3a475c]/60 bg-[#0f1216]/70">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#eaba49]/15 border border-[#eaba49]/50 flex items-center justify-center text-[#eaba49]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-medium text-[#ffddcc] tracking-wide">
                  Hunter Registry // Field Clearance
                </h2>
                <span className="bitfoots-chip bitfoots-chip--solid text-[10px] py-0.5 px-2">
                  TOP 50
                </span>
                {isLiveSupabase ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SUPABASE LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono">
                    <Radio className="w-2.5 h-2.5" />
                    STANDBY SYNC
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7d8898] font-mono tracking-wider">
                THE CRYPTID INSTITUTE // CLOUD EXPEDITION REGISTRY
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              title="Refresh telemetry"
              className="p-2 rounded-lg bg-[#0f1216] hover:bg-[#1a1f26] border border-[#3a475c] text-[#7d8898] hover:text-[#eaba49] transition-all disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${loading ? "animate-spin text-[#eaba49]" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#0f1216] hover:bg-[#e07a6b]/20 border border-[#3a475c] hover:border-[#e07a6b]/50 text-[#7d8898] hover:text-[#e07a6b] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current User Status Banner */}
        {currentUserId && (
          <div className="px-6 py-3 bg-[#14171c]/90 border-b border-[#3a475c]/50 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-[#eaba49]">
              <UserCheck className="w-4 h-4" />
              <span className="tracking-wider">Active Hunter Clearance:</span>
            </div>
            <div className="font-bold text-[#e6e8ec] flex items-center space-x-3.5">
              {userRank ? (
                <>
                  <span className="text-[#f3c85f]">Rank #{userRank}</span>
                  <span className="text-[#7fc98f]">{currentUserEntry?.total_points || 0} PTS</span>
                  <span className="text-[#7d8898]">
                    {Math.round((currentUserEntry?.best_time_ms || 0) / 1000)}s
                  </span>
                  <span className="text-[#38bdf8] text-[11px]">
                    Sector {currentUserEntry?.chapters_cleared || 0} Cleared
                  </span>
                </>
              ) : (
                <span className="text-[#7d8898] font-normal">
                  No verified survey telemetry recorded yet
                </span>
              )}
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {error && (
            <div className="p-4 rounded-xl bg-[#e07a6b]/15 border border-[#e07a6b]/40 text-[#ffddcc] text-xs text-center font-mono">
              {error}
            </div>
          )}

          {loading && leaderboard.length === 0 ? (
            <div className="py-16 text-center space-y-3 font-mono">
              <div className="w-8 h-8 border-2 border-[#eaba49] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#7d8898]">Verifying hunter telemetry records in Supabase...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#7d8898] font-mono space-y-2">
              <Sparkles className="w-8 h-8 text-[#eaba49]/40 mx-auto" />
              <p>No hunter telemetry recorded in registry yet. Be the first to clear Sector 01!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {leaderboard.map((item) => {
                const isCurrentPlayer = currentUserId && item.user_id === currentUserId;

                // Rank Badges
                let rankBadge = (
                  <span className="text-[#7d8898] font-mono font-bold w-6 text-center">{item.rank}</span>
                );
                let rowBg = "bg-[#0f1216]/60 hover:bg-[#14171c] border-[#3a475c]/60";

                if (item.rank === 1) {
                  rankBadge = (
                    <div className="w-6 flex items-center justify-center text-[#eaba49] font-bold">
                      <Crown className="w-4 h-4" />
                    </div>
                  );
                  rowBg = "bg-[#eaba49]/10 border-[#eaba49]/50 hover:bg-[#eaba49]/15";
                } else if (item.rank === 2) {
                  rankBadge = (
                    <div className="w-6 flex items-center justify-center text-[#e6e8ec] font-bold">
                      <Medal className="w-4 h-4" />
                    </div>
                  );
                  rowBg = "bg-white/5 border-white/20 hover:bg-white/10";
                } else if (item.rank === 3) {
                  rankBadge = (
                    <div className="w-6 flex items-center justify-center text-[#d8c27a] font-bold">
                      <Medal className="w-4 h-4" />
                    </div>
                  );
                  rowBg = "bg-[#d8c27a]/10 border-[#d8c27a]/30 hover:bg-[#d8c27a]/15";
                }

                if (isCurrentPlayer) {
                  rowBg = "bg-[#1a1f26] border-[#eaba49] shadow-lg shadow-[#eaba49]/15";
                }

                return (
                  <div
                    key={item.user_id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${rowBg}`}
                  >
                    {/* Rank & Operative Info */}
                    <div className="flex items-center space-x-3.5 min-w-0">
                      {rankBadge}
                      {/* Avatar */}
                      <img
                        src={item.x_avatar_url}
                        alt={item.x_username}
                        className="w-8 h-8 rounded-lg border border-[#3a475c] bg-black/60 shrink-0 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `/bitfoot-heads/bitfoot-head-01.png`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-semibold truncate max-w-[130px] sm:max-w-[190px] ${
                              isCurrentPlayer ? "text-[#eaba49]" : "text-[#e6e8ec]"
                            }`}
                          >
                            {item.x_username}
                          </span>
                          {isCurrentPlayer && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#eaba49]/20 text-[#eaba49] border border-[#eaba49]/40 font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-[#7d8898] font-mono">
                          <span>
                            {item.is_guest ? "Guest Hunter" : "Verified Hunter"}
                          </span>
                          <span>•</span>
                          <span>Sector {item.chapters_cleared} Cleared</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 sm:space-x-6 text-right shrink-0 font-mono">
                      <div>
                        <div className="text-[10px] text-[#7d8898] uppercase tracking-wider">Clearance</div>
                        <div className="font-bold text-[#f3c85f] text-sm">
                          {item.total_points} PTS
                        </div>
                      </div>

                      <div className="hidden sm:block">
                        <div className="text-[10px] text-[#7d8898] uppercase tracking-wider">Best Time</div>
                        <div className="text-[#aab6c9] text-xs">
                          {Math.round(item.best_time_ms / 1000)}s
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#3a475c]/60 bg-[#0f1216]/70 flex items-center justify-between text-[11px] text-[#7d8898] font-mono">
          <div className="text-[#7d8898]">
            {lastRefreshed ? `Last telemetry sync: ${lastRefreshed}` : "Standby"}
          </div>
          <button
            onClick={onClose}
            className="bitfoots-btn py-1.5 px-4 rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
