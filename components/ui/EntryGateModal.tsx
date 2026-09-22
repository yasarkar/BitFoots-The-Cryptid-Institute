"use client";

import React, { useState, useEffect } from "react";
import { Gamepad2, ArrowRight, Shuffle, X as CloseIcon, AlertCircle } from "lucide-react";

interface EntryGateModalProps {
  isOpen: boolean;
  currentUsername: string;
  isSupabaseConfigured: boolean;
  canDismiss?: boolean;
  onEnterWithUsername: (username: string) => void;
  onLoginWithGoogle: () => Promise<any>;
  onLoginWithX: () => Promise<any>;
  onClose?: () => void;
}

// Curated atmospheric sci-fi call-signs for quick randomization
const RANDOM_CALLSIGNS = [
  "Shadow_Seeker",
  "Apex_Hunter",
  "Cipher_303",
  "Crypto_Fauna",
  "Monolith_Ranger",
  "Zcash_Ghost",
  "Vector_Scout",
  "Shielded_Echo",
  "Forest_Drifter",
  "Bitfoot_Tracker",
  "Anomaly_Pilot",
  "Grid_Walker",
];

export const EntryGateModal: React.FC<EntryGateModalProps> = ({
  isOpen,
  currentUsername,
  isSupabaseConfigured,
  canDismiss = false,
  onEnterWithUsername,
  onLoginWithGoogle,
  onLoginWithX,
  onClose,
}) => {
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitting(false);
      setAuthError(null);
      if (currentUsername && currentUsername !== "Loading Hunter...") {
        setUsernameInput(currentUsername.replace(/^@/, ""));
      } else {
        const randIdx = Math.floor(Math.random() * RANDOM_CALLSIGNS.length);
        const randNum = Math.floor(100 + Math.random() * 900);
        setUsernameInput(`${RANDOM_CALLSIGNS[randIdx]}_${randNum}`);
      }
    }
  }, [currentUsername, isOpen]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const randIdx = Math.floor(Math.random() * RANDOM_CALLSIGNS.length);
    const randNum = Math.floor(100 + Math.random() * 900);
    setUsernameInput(`${RANDOM_CALLSIGNS[randIdx]}_${randNum}`);
    setAuthError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = usernameInput.trim();
    if (!cleanName) {
      setAuthError("Please enter a valid hunter call-sign.");
      return;
    }
    setSubmitting(true);
    try {
      await onEnterWithUsername(cleanName);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      setAuthError(
        "Supabase integration is not configured. You can start directly with your call-sign above."
      );
      return;
    }
    try {
      setSubmitting(true);
      const res = await onLoginWithGoogle();
      if (res?.error) {
        setAuthError(res.error.message || "Failed to initiate Google sign-in.");
      }
    } catch {
      setAuthError("An error occurred during Google sign-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleXClick = async () => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      setAuthError(
        "Supabase integration is not configured. You can start directly with your call-sign above."
      );
      return;
    }
    try {
      setSubmitting(true);
      const res = await onLoginWithX();
      if (res?.error) {
        setAuthError(res.error.message || "Failed to initiate X sign-in.");
      }
    } catch {
      setAuthError("An error occurred during X sign-in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="entry-gate-overlay"
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-md duration-300 sm:p-6"
    >
      <div
        id="entry-gate-modal"
        className="bitfoots-glass-card relative my-auto w-full max-w-lg overflow-hidden rounded-2xl p-6 text-[#aab6c9] sm:p-9"
      >
        {/* Optional Close Button */}
        {canDismiss && onClose && (
          <button
            id="entry-modal-close-btn"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-lg border border-[#3a475c] bg-[#0f1216] p-2 text-[#7d8898] transition-colors hover:bg-[#1a1f26] hover:text-[#eaba49]"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}

        {/* BitFoots Pixel Card Mark Ornament */}
        <div className="bitfoots-card-mark" aria-hidden="true" />

        {/* Header & Badges */}
        <div className="mb-6 flex flex-col items-center space-y-2.5 text-center">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.24em] text-[#eaba49]">
            THE CRYPTID INSTITUTE // SERIES 303
          </p>

          <span className="bitfoots-chip bitfoots-chip--solid">
            Status: <strong>READY TO HUNT</strong>
          </span>

          <h2 className="font-serif text-2xl font-medium tracking-tight text-[#ffddcc] sm:text-3xl">
            Good luck, hunter.
          </h2>

          <p className="mx-auto max-w-sm text-sm leading-relaxed text-[#c9ccd2]">
            Choose your hunter call-sign to track missing Bitfoot footprints across the dark forest or connect
            with your archive identity.
          </p>
        </div>

        {/* Form 1: Enter with Hunter Call-Sign */}
        <form onSubmit={handleFormSubmit} className="mb-5 space-y-4">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between font-mono text-[11px] tracking-wider">
              <label htmlFor="player-username-input" className="font-semibold uppercase text-[#eaba49]">
                HUNTER CALL-SIGN
              </label>
              <button
                type="button"
                id="randomize-callsign-btn"
                onClick={handleRandomize}
                className="flex items-center gap-1 font-mono text-[#7d8898] transition-colors hover:text-[#f3c85f]"
              >
                <Shuffle className="h-3 w-3" />
                <span>randomize</span>
              </button>
            </div>

            <div className="relative">
              <input
                id="player-username-input"
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  if (authError) setAuthError(null);
                }}
                maxLength={24}
                autoFocus
                placeholder="Enter call-sign (e.g. Hunter_902)"
                className="w-full rounded-lg border border-[#3a475c] bg-[#0f1216] px-4 py-3 font-mono text-sm tracking-wide text-[#ffddcc] placeholder-[#7d8898] shadow-inner outline-none transition-all focus:border-[#eaba49] focus:ring-1 focus:ring-[#eaba49]/50"
              />
            </div>
          </div>

          <button
            type="submit"
            id="start-expedition-btn"
            disabled={submitting || !usernameInput.trim()}
            className="bitfoots-btn bitfoots-btn--solid w-full rounded-lg py-3.5 text-xs tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            <Gamepad2 className="h-4 w-4" />
            <span>Enter Field</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#3a475c]/60" />
          </div>
          <span className="relative bg-[#11151c] px-3 font-mono text-[10px] uppercase tracking-widest text-[#7d8898]">
            OR CONNECT WITH ARCHIVE IDENTITY
          </span>
        </div>

        {/* Form 2: Google & X (Twitter) Sign-in */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Google Button */}
          <button
            type="button"
            id="google-login-btn"
            onClick={handleGoogleClick}
            disabled={submitting}
            className="bitfoots-btn rounded-lg py-3 text-xs disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* X (Twitter) Button */}
          <button
            type="button"
            id="x-login-btn"
            onClick={handleXClick}
            disabled={submitting}
            className="bitfoots-btn rounded-lg py-3 text-xs disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0 fill-current text-[#eaba49]" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Sign in with X</span>
          </button>
        </div>

        {/* Auth Error or Informational Alert */}
        {authError && (
          <div className="animate-in fade-in mt-4 flex items-start space-x-2 rounded-lg border border-[#e07a6b]/50 bg-[#e07a6b]/15 p-3 text-xs text-[#ffddcc] duration-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#e07a6b]" />
            <span className="leading-snug">{authError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
