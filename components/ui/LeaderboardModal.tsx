"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { LeaderboardItem } from "@/app/api/leaderboard/route";
import { subscribeToLeaderboard } from "@/lib/supabaseClient";
import {
  Trophy,
  X,
  RotateCw,
  Crown,
  Medal,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Crosshair,
  File,
} from "lucide-react";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

const ITEMS_PER_PAGE = 10;

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardItem | null>(null);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

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
        setLastRefreshed(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
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

  // Total pages and pagination bounds
  const totalPages = Math.max(1, Math.ceil(leaderboard.length / ITEMS_PER_PAGE));

  // Ensure current page remains within bounds when leaderboard list updates
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Paginated records (10 per page)
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return leaderboard.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [leaderboard, currentPage]);

  // Find page of current user for quick-jump
  const userPage = useMemo(() => {
    if (!currentUserId || !userRank) return null;
    const userIndex = leaderboard.findIndex((item) => item.user_id === currentUserId);
    if (userIndex === -1) return null;
    return Math.floor(userIndex / ITEMS_PER_PAGE) + 1;
  }, [currentUserId, userRank, leaderboard]);

  const handleJumpToMyRank = () => {
    if (userPage) {
      setCurrentPage(userPage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md duration-200 sm:p-6">
      <div className="bitfoots-glass-card flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl font-sans text-[#aab6c9]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3a475c]/60 bg-[#0f1216]/70 px-6 py-5">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eaba49]/50 bg-[#eaba49]/15 text-[#eaba49]">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-medium tracking-wide text-[#ffddcc] sm:text-lg">
                  Hunter Registry
                </h2>
              </div>
              <p className="font-mono text-[11px] tracking-wider text-[#7d8898]">
                THE CRYPTID INSTITUTE // CLOUD EXPEDITION REGISTRY
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              title="Refresh telemetry"
              className="rounded-lg border border-[#3a475c] bg-[#0f1216] p-2 text-[#7d8898] transition-all hover:bg-[#1a1f26] hover:text-[#eaba49] disabled:opacity-50"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin text-[#eaba49]" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-[#3a475c] bg-[#0f1216] p-2 text-[#7d8898] transition-all hover:border-[#e07a6b]/50 hover:bg-[#e07a6b]/20 hover:text-[#e07a6b]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Current User Status Banner */}
        {currentUserId && (
          <div className="flex items-center justify-between border-b border-[#3a475c]/50 bg-[#14171c]/90 px-6 py-3 font-mono text-xs">
            <div className="flex items-center space-x-2 text-[#eaba49]">
              <UserCheck className="h-4 w-4" />
              <span className="tracking-wider">Active Hunter Clearance:</span>
            </div>
            <div className="flex items-center space-x-3.5 font-bold text-[#e6e8ec]">
              {userRank ? (
                <>
                  <span className="text-[#f3c85f]">Rank #{userRank}</span>
                  <span className="text-[#7fc98f]">{currentUserEntry?.total_points || 0} PTS</span>
                  <span className="text-[#7d8898]">
                    {Math.round((currentUserEntry?.best_time_ms || 0) / 1000)}s
                  </span>
                  <span className="text-[11px] text-[#38bdf8]">
                    Sector {currentUserEntry?.chapters_cleared || 0} Cleared
                  </span>
                  {userPage && userPage !== currentPage && (
                    <button
                      onClick={handleJumpToMyRank}
                      className="inline-flex items-center gap-1 rounded border border-[#eaba49]/40 bg-[#eaba49]/15 px-2 py-0.5 font-mono text-[10px] text-[#eaba49] transition-all hover:bg-[#eaba49]/25"
                      title="Jump to my page"
                    >
                      <Crosshair className="h-3 w-3" />
                      Page {userPage}
                    </button>
                  )}
                </>
              ) : (
                <span className="font-normal text-[#7d8898]">No verified survey telemetry recorded yet</span>
              )}
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="rounded-xl border border-[#e07a6b]/40 bg-[#e07a6b]/15 p-4 text-center font-mono text-xs text-[#ffddcc]">
              {error}
            </div>
          )}

          {loading && leaderboard.length === 0 ? (
            <div className="space-y-3 py-16 text-center font-mono">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#eaba49] border-t-transparent" />
              <p className="text-xs text-[#7d8898]">Verifying hunter telemetry records in Supabase...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="space-y-2 py-16 text-center font-mono text-xs text-[#7d8898]">
              <File className="mx-auto h-8 w-8 text-[#eaba49]/40" />
              <p>No hunter telemetry recorded in registry yet. Be the first to clear Sector 01!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {paginatedItems.map((item) => {
                const isCurrentPlayer = currentUserId && item.user_id === currentUserId;

                // Rank Badges
                let rankBadge = (
                  <span className="w-6 text-center font-mono font-bold text-[#7d8898]">{item.rank}</span>
                );
                let rowBg = "bg-[#0f1216]/60 hover:bg-[#14171c] border-[#3a475c]/60";

                if (item.rank === 1) {
                  rankBadge = (
                    <div className="flex w-6 items-center justify-center font-bold text-[#eaba49]">
                      <Crown className="h-4 w-4" />
                    </div>
                  );
                  rowBg = "bg-[#eaba49]/10 border-[#eaba49]/50 hover:bg-[#eaba49]/15";
                } else if (item.rank === 2) {
                  rankBadge = (
                    <div className="flex w-6 items-center justify-center font-bold text-[#e6e8ec]">
                      <Medal className="h-4 w-4" />
                    </div>
                  );
                  rowBg = "bg-white/5 border-white/20 hover:bg-white/10";
                } else if (item.rank === 3) {
                  rankBadge = (
                    <div className="flex w-6 items-center justify-center font-bold text-[#d8c27a]">
                      <Medal className="h-4 w-4" />
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
                    className={`flex items-center justify-between rounded-xl border p-3 text-xs transition-all ${rowBg}`}
                  >
                    {/* Rank & Operative Info */}
                    <div className="flex min-w-0 items-center space-x-3.5">
                      {rankBadge}
                      {/* Avatar */}
                      <img
                        src={item.x_avatar_url}
                        alt={item.x_username}
                        className="h-8 w-8 shrink-0 rounded-lg border border-[#3a475c] bg-black/60 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `/bitfoot-heads/bitfoot-head-01.png`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`max-w-[130px] truncate font-semibold sm:max-w-[190px] ${
                              isCurrentPlayer ? "text-[#eaba49]" : "text-[#e6e8ec]"
                            }`}
                          >
                            {item.x_username}
                          </span>
                          {isCurrentPlayer && (
                            <span className="py-0.2 rounded border border-[#eaba49]/40 bg-[#eaba49]/20 px-1.5 font-mono text-[9px] text-[#eaba49]">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 font-mono text-[10px] text-[#7d8898]">
                          <span>{item.is_guest ? "Guest Hunter" : "Verified Hunter"}</span>
                          <span>•</span>
                          <span>Sector {item.chapters_cleared} Cleared</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex shrink-0 items-center space-x-4 text-right font-mono sm:space-x-6">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#7d8898]">Clearance</div>
                        <div className="text-sm font-bold text-[#f3c85f]">{item.total_points} PTS</div>
                      </div>

                      <div className="hidden sm:block">
                        <div className="text-[10px] uppercase tracking-wider text-[#7d8898]">Best Time</div>
                        <div className="text-xs text-[#aab6c9]">{Math.round(item.best_time_ms / 1000)}s</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {leaderboard.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#3a475c]/40 bg-[#0b0e12]/80 px-6 py-2.5 font-mono text-xs">
            <div className="text-[11px] text-[#7d8898]">
              Showing <span className="text-[#ffddcc]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–
              <span className="text-[#ffddcc]">
                {Math.min(currentPage * ITEMS_PER_PAGE, leaderboard.length)}
              </span>{" "}
              of <span className="text-[#ffddcc]">{leaderboard.length}</span> Hunters
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                className="rounded border border-[#3a475c] bg-[#14171c] p-1.5 text-[#7d8898] transition-all hover:bg-[#1a1f26] hover:text-[#eaba49] disabled:opacity-30 disabled:hover:text-[#7d8898]"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Previous Page"
                className="rounded border border-[#3a475c] bg-[#14171c] p-1.5 text-[#7d8898] transition-all hover:bg-[#1a1f26] hover:text-[#eaba49] disabled:opacity-30 disabled:hover:text-[#7d8898]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center space-x-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 w-7 rounded text-[11px] font-bold transition-all ${
                      pageNum === currentPage
                        ? "border border-[#eaba49] bg-[#eaba49] text-black shadow-sm shadow-[#eaba49]/30"
                        : "border border-[#3a475c] bg-[#14171c] text-[#aab6c9] hover:bg-[#1f242d] hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Next Page"
                className="rounded border border-[#3a475c] bg-[#14171c] p-1.5 text-[#7d8898] transition-all hover:bg-[#1a1f26] hover:text-[#eaba49] disabled:opacity-30 disabled:hover:text-[#7d8898]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
                className="rounded border border-[#3a475c] bg-[#14171c] p-1.5 text-[#7d8898] transition-all hover:bg-[#1a1f26] hover:text-[#eaba49] disabled:opacity-30 disabled:hover:text-[#7d8898]"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#3a475c]/60 bg-[#0f1216]/70 px-6 py-3.5 font-mono text-[11px] text-[#7d8898]">
          <div className="text-[#7d8898]">{lastRefreshed ? `Last updated: ${lastRefreshed}` : "Standby"}</div>
          <button onClick={onClose} className="bitfoots-btn rounded-lg px-4 py-1.5 text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
