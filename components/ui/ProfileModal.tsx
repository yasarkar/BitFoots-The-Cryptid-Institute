"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  X,
  Copy,
  Check,
  Save,
  Dices,
  ShieldCheck,
  AlertCircle,
  Link as LinkIcon,
  Coins,
  Download,
  Sparkles,
  Palette,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { HunterProfile } from "@/hooks/useHunterSession";
import { ExportCardModal } from "./ExportCardModal";
import { fetchHunterProfile } from "@/lib/supabaseClient";

// 7-8 second timeout constant for user feedback notifications
const NOTIFICATION_TIMEOUT_MS = 7500;

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HunterProfile;
  isSupabaseConfigured: boolean;
  onUpdateProfile: (updates: {
    username?: string;
    avatarUrl?: string;
    isCustomAvatar?: boolean;
    zcashAddress?: string;
  }) => void;
  onLoginWithGoogle: () => Promise<any>;
  onLoginWithX: () => Promise<any>;
  onLinkGoogle?: () => Promise<any>;
  onLinkX?: () => Promise<any>;
}

// Authentic BitFoot heads from /bitfoot-heads (01 to 18)
const BITFOOT_HEADS = Array.from({ length: 18 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, "0");
  return `/bitfoot-heads/bitfoot-head-${num}.png`;
});

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onLoginWithGoogle,
  onLoginWithX,
  onLinkGoogle,
  onLinkX,
}) => {
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [avatarUrlInput, setAvatarUrlInput] = useState<string>("");
  const [isCustomAvatarInput, setIsCustomAvatarInput] = useState<boolean>(false);
  const [showGallery, setShowGallery] = useState<boolean>(false);
  const [zcashInput, setZcashInput] = useState<string>("");
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedZec, setCopiedZec] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showValidNotice, setShowValidNotice] = useState<boolean>(false);
  const [linkingAuth, setLinkingAuth] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const validTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (isOpen) {
      let initialZcash = profile.zcashAddress || "";
      if (!initialZcash && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("bitfoot_hunter_guest_session");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.zcashAddress) {
              initialZcash = parsed.zcashAddress;
            }
          }
        } catch {}
      }
      setUsernameInput(profile.username || "");
      setAvatarUrlInput(profile.avatarUrl || "");
      setIsCustomAvatarInput(Boolean(profile.isCustomAvatar));
      setShowGallery(false);
      setZcashInput(initialZcash);
      if (initialZcash && !profile.zcashAddress) {
        onUpdateProfile({ zcashAddress: initialZcash });
      }
      setSaveSuccess(false);
      setErrorMsg(null);
      setShowValidNotice(false);
      setCopiedId(false);
      setCopiedZec(false);
      setLinkingAuth(null);

      // Veritabanından kayıtlı Zcash adresini çek ve input alanına yükle
      if (profile.userId) {
        fetchHunterProfile(profile.userId)
          .then((dbData) => {
            if (!isCancelled && dbData?.zcash_address) {
              setZcashInput(dbData.zcash_address);
              if (dbData.zcash_address !== profile.zcashAddress) {
                onUpdateProfile({ zcashAddress: dbData.zcash_address });
              }
            }
          })
          .catch((err) => {
            console.warn("Could not fetch Zcash address from database:", err);
          });
      }
    }
    return () => {
      isCancelled = true;
      if (validTimerRef.current) {
        clearTimeout(validTimerRef.current);
        validTimerRef.current = null;
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
    };
  }, [
    isOpen,
    profile.username,
    profile.avatarUrl,
    profile.isCustomAvatar,
    profile.zcashAddress,
    profile.userId,
    onUpdateProfile,
  ]);

  if (!isOpen) return null;

  // Real-time Zcash Unified Address Validation
  const getZcashStatus = () => {
    const val = zcashInput.trim();
    if (!val) {
      return { status: "empty", message: "Optional: Zcash Unified Address (u1...)" };
    }
    if (!val.startsWith("u1")) {
      return {
        status: "invalid_prefix",
        message: "Address must begin with 'u1' (Zcash Unified Address)",
      };
    }
    if (val.length < 50) {
      return {
        status: "too_short",
        message: "Address appears incomplete (Unified addresses are typically 100+ chars)",
      };
    }
    return {
      status: "valid",
      message: "Valid Zcash Shielded Address",
    };
  };

  const zcashValidation = getZcashStatus();

  const triggerValidNotice = () => {
    setShowValidNotice(true);
    if (validTimerRef.current) clearTimeout(validTimerRef.current);
    validTimerRef.current = setTimeout(() => {
      setShowValidNotice(false);
    }, NOTIFICATION_TIMEOUT_MS);
  };

  const showErrorMessage = (msg: string) => {
    setErrorMsg(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setErrorMsg(null);
    }, NOTIFICATION_TIMEOUT_MS);
  };

  const handleZcashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setZcashInput(val);
    setErrorMsg(null);
    setSaveSuccess(false);

    const clean = val.trim();
    if (clean.startsWith("u1") && clean.length >= 50) {
      triggerValidNotice();
    } else {
      setShowValidNotice(false);
      if (validTimerRef.current) {
        clearTimeout(validTimerRef.current);
        validTimerRef.current = null;
      }
    }
  };

  // Randomize Avatar using authentic BitFoot heads (01-18)
  const handleRandomizeAvatar = () => {
    const available = BITFOOT_HEADS.filter((img) => img !== avatarUrlInput);
    const chosen = available[Math.floor(Math.random() * available.length)] || BITFOOT_HEADS[0];
    setAvatarUrlInput(chosen);
    setIsCustomAvatarInput(true);
    setSaveSuccess(false);
  };

  const handleSelectBitfootHead = (headUrl: string) => {
    setAvatarUrlInput(headUrl);
    setIsCustomAvatarInput(true);
    setSaveSuccess(false);
  };

  const handleSelectOAuthAvatar = (url: string, isFromX: boolean) => {
    setAvatarUrlInput(url);
    // Explicitly picking Google avatar when X is linked is treated as custom choice
    // Picking X avatar adheres to default priority
    setIsCustomAvatarInput(!isFromX);
    setSaveSuccess(false);
  };

  const handleCopyUserId = () => {
    if (!profile.userId) return;
    navigator.clipboard.writeText(profile.userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyZec = () => {
    if (!zcashInput) return;
    navigator.clipboard.writeText(zcashInput);
    setCopiedZec(true);
    setTimeout(() => setCopiedZec(false), 2000);
  };

  const handleConnectX = async () => {
    try {
      setLinkingAuth("twitter");
      setErrorMsg(null);
      const res = onLinkX ? await onLinkX() : await onLoginWithX();
      if (res?.error) {
        throw res.error;
      }
      if (res?.data?.url && typeof window !== "undefined") {
        window.location.href = res.data.url;
      }
    } catch (e: any) {
      console.error("X linking failed:", e);
      showErrorMessage(e?.message || "Failed to link X account.");
    } finally {
      setLinkingAuth(null);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setLinkingAuth("google");
      setErrorMsg(null);
      const res = onLinkGoogle ? await onLinkGoogle() : await onLoginWithGoogle();
      if (res?.error) {
        throw res.error;
      }
      if (res?.data?.url && typeof window !== "undefined") {
        window.location.href = res.data.url;
      }
    } catch (e: any) {
      console.error("Google linking failed:", e);
      showErrorMessage(e?.message || "Failed to link Google account.");
    } finally {
      setLinkingAuth(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = usernameInput.trim();
    if (!cleanName) {
      showErrorMessage("Call-sign cannot be blank.");
      return;
    }
    if (cleanName.length < 3) {
      showErrorMessage("Call-sign must be at least 3 characters.");
      return;
    }
    if (cleanName.length > 24) {
      showErrorMessage("Call-sign must not exceed 24 characters.");
      return;
    }

    const cleanZcash = zcashInput.trim();
    if (cleanZcash && !cleanZcash.startsWith("u1")) {
      showErrorMessage("Zcash address must start with 'u1'.");
      return;
    }

    onUpdateProfile({
      username: cleanName,
      avatarUrl: avatarUrlInput || profile.avatarUrl,
      isCustomAvatar: isCustomAvatarInput,
      zcashAddress: cleanZcash,
    });

    setSaveSuccess(true);
    setErrorMsg(null);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveSuccess(false);
    }, NOTIFICATION_TIMEOUT_MS);

    // If a valid address is present, also flash the 7-8s valid notice
    if (cleanZcash && cleanZcash.startsWith("u1") && cleanZcash.length >= 50) {
      triggerValidNotice();
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md duration-200 sm:p-5">
      <div className="bitfoots-glass-card animate-in zoom-in-95 relative flex max-h-[92vh] w-full max-w-xl select-none flex-col space-y-4 overflow-hidden overflow-y-auto rounded-2xl border border-[#eaba49]/60 p-5 font-sans text-[#aab6c9] shadow-2xl duration-200 sm:p-7">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#eaba49]/50 bg-[#eaba49]/15 text-[#eaba49] shadow-md shadow-[#eaba49]/10">
              <User className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#eaba49]">
                THE CRYPTID INSTITUTE // HUNTER CREDENTIALS
              </span>
              <h2 className="font-serif text-base font-medium tracking-wide text-[#ffddcc] sm:text-lg">
                Agent Profile Dossier
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

        {/* Profile Card Summary & Avatar Customizer */}
        <div className="space-y-3 rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {/* Avatar preview with active border */}
            <div className="group relative">
              <img
                src={avatarUrlInput || profile.avatarUrl}
                alt={profile.username}
                className="h-16 w-16 rounded-2xl border-2 border-[#eaba49] bg-black/70 object-cover p-1 shadow-lg shadow-[#eaba49]/10 transition-transform group-hover:scale-105 sm:h-20 sm:w-20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/bitfoot-heads/bitfoot-head-01.png`;
                }}
              />
              {isCustomAvatarInput && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#eaba49] bg-black text-[#eaba49] shadow">
                  <Sparkles className="h-3 w-3" />
                </span>
              )}
            </div>

            {/* Hunter Info & Avatar Seed Buttons */}
            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h3 className="font-mono text-base font-bold text-[#ffddcc] sm:text-lg">
                  {usernameInput || profile.username || "Anonymous Hunter"}
                </h3>
                {/* Active Avatar Source Indicator */}
                {isCustomAvatarInput || (avatarUrlInput && avatarUrlInput.includes("bitfoot-head")) ? (
                  <span className="flex items-center gap-1 rounded-md border border-[#eaba49]/50 bg-[#eaba49]/10 px-1.5 py-0.5 font-mono text-[9px] text-[#eaba49]">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Custom Avatar</span>
                  </span>
                ) : profile.xAvatarUrl &&
                  (avatarUrlInput === profile.xAvatarUrl || avatarUrlInput.includes("twimg")) ? (
                  <span className="flex items-center gap-1 rounded-md border border-[#7fc98f]/40 bg-[#7fc98f]/10 px-1.5 py-0.5 font-mono text-[9px] text-[#7fc98f]">
                    <Check className="h-2.5 w-2.5" />
                    <span>X Avatar</span>
                  </span>
                ) : profile.googleAvatarUrl &&
                  (avatarUrlInput === profile.googleAvatarUrl ||
                    avatarUrlInput.includes("googleusercontent")) ? (
                  <span className="flex items-center gap-1 rounded-md border border-[#3a475c] bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-[#ffddcc]">
                    <Check className="h-2.5 w-2.5" />
                    <span>Google Avatar</span>
                  </span>
                ) : null}
              </div>

              {/* Avatar Generator Button & Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 sm:justify-start">
                <button
                  type="button"
                  onClick={handleRandomizeAvatar}
                  className="bitfoots-btn flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] transition-all hover:border-[#eaba49]/60 hover:text-[#eaba49]"
                >
                  <Dices className="h-3 w-3 text-[#eaba49]" />
                  <span>Roll Random</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGallery((prev) => !prev)}
                  className={`bitfoots-btn flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] transition-all ${
                    showGallery
                      ? "border-[#eaba49] bg-[#eaba49]/20 text-[#eaba49]"
                      : "hover:border-[#eaba49]/60 hover:text-[#eaba49]"
                  }`}
                >
                  <Palette className="h-3 w-3 text-[#eaba49]" />
                  <span>Pick Head (18)</span>
                  {showGallery ? (
                    <ChevronUp className="h-2.5 w-2.5" />
                  ) : (
                    <ChevronDown className="h-2.5 w-2.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="bitfoots-btn flex items-center gap-1 rounded-md border-[#eaba49]/70 px-2 py-0.5 font-mono text-[10px] text-[#ffddcc] transition-all hover:bg-[#eaba49]/15"
                >
                  <Download className="h-3 w-3 text-[#eaba49]" />
                  <span>Export ID Card</span>
                </button>
              </div>

              {/* Hunter Dossier Telemetry: UUID */}
              <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[10px] text-[#7d8898] sm:justify-start">
                <span className="flex items-center gap-1">
                  <span>UUID:</span>
                  <span className="max-w-[150px] select-all truncate text-[#aab6c9] sm:max-w-[250px]">
                    {profile.userId || "N/A"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyUserId}
                  className="flex items-center gap-0.5 p-0.5 text-[#7d8898] transition-colors hover:text-[#eaba49]"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-2.5 w-2.5 text-[#7fc98f]" />
                      <span className="text-[#7fc98f]">Copied</span>
                    </>
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Gallery of 18 BitFoot Heads */}
          {showGallery && (
            <div className="animate-in fade-in zoom-in-95 space-y-2 rounded-xl border border-[#eaba49]/40 bg-black/75 p-3 duration-200">
              <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-1.5">
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#eaba49]">
                  <Palette className="h-3.5 w-3.5" />
                  <span>BitFoot Operative Heads (18 Authentic Avatars)</span>
                </span>
                <span className="font-mono text-[10px] text-[#7d8898]">Click to select & equip</span>
              </div>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
                {BITFOOT_HEADS.map((head, idx) => {
                  const isSelected = avatarUrlInput === head;
                  const headNum = (idx + 1).toString().padStart(2, "0");
                  return (
                    <button
                      key={head}
                      type="button"
                      onClick={() => handleSelectBitfootHead(head)}
                      title={`BitFoot Head ${headNum}`}
                      className={`group relative flex items-center justify-center rounded-xl p-1 transition-all ${
                        isSelected
                          ? "scale-105 border-2 border-[#eaba49] bg-[#eaba49]/25 shadow-md shadow-[#eaba49]/20"
                          : "border border-[#3a475c] bg-[#0f1216] hover:scale-105 hover:border-[#eaba49]/70"
                      }`}
                    >
                      <img
                        src={head}
                        alt={`Head ${headNum}`}
                        className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                      />
                      {isSelected && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#eaba49] text-black shadow">
                          <Check className="h-2 w-2 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-6 font-mono">
          {/* 1. Field Call-Sign */}
          <div className="space-y-1.5">
            <label className="mb-1 block flex items-center justify-between text-xs font-medium text-[#c9ccd2]">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#eaba49]" />
                USERNAME
              </span>
              <span className="text-[10px] text-[#7d8898]">{usernameInput.length}/24</span>
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                setErrorMsg(null);
                setSaveSuccess(false);
              }}
              maxLength={24}
              placeholder="e.g. Apex_Tracker, Zec_Seeker..."
              className="w-full rounded-xl border border-[#3a475c] bg-[#0f1216] px-3.5 py-2 text-xs text-[#ffddcc] outline-none transition-colors focus:border-[#eaba49] sm:text-sm"
            />
          </div>

          {/* 2. Zcash Shielded Unified Address (u1...) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#c9ccd2]">
                <Coins className="h-3.5 w-3.5 text-[#eaba49]" />
                <span>ZCASH SHIELDED ADDRESS</span>
              </label>
              {zcashInput && (
                <button
                  type="button"
                  onClick={handleCopyZec}
                  className="flex items-center gap-1 text-[10px] text-[#7d8898] transition-colors hover:text-[#eaba49]"
                >
                  {copiedZec ? (
                    <>
                      <Check className="h-3 w-3 text-[#7fc98f]" />
                      <span className="text-[#7fc98f]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={zcashInput}
                onChange={handleZcashChange}
                placeholder="u1... (Unified Shielded Address for grants & airdrops)"
                className={`w-full rounded-xl border bg-[#0f1216] px-3.5 py-2 pr-8 font-mono text-xs text-[#ffddcc] outline-none transition-colors ${
                  showValidNotice
                    ? "border-[#7fc98f]/80 focus:border-[#7fc98f]"
                    : zcashValidation.status === "valid"
                      ? "border-[#7fc98f]/40 focus:border-[#7fc98f]"
                      : zcashValidation.status === "invalid_prefix"
                        ? "border-[#e07a6b]/80 focus:border-[#e07a6b]"
                        : "border-[#3a475c] focus:border-[#eaba49]"
                }`}
              />
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                {zcashValidation.status === "valid" && (
                  <Check
                    className={`h-4 w-4 transition-colors ${
                      showValidNotice ? "text-[#7fc98f]" : "text-[#7fc98f]/60"
                    }`}
                  />
                )}
                {zcashValidation.status === "invalid_prefix" && (
                  <AlertCircle className="h-4 w-4 text-[#e07a6b]" />
                )}
              </div>
            </div>

            {/* Validation Feedback & Privacy Lore Callout */}
            <div className="flex min-h-[18px] flex-col gap-1">
              {showValidNotice ? (
                <p className="animate-in fade-in flex items-center gap-1 font-mono text-[11px] text-[#7fc98f] duration-200">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Valid Zcash Shielded Address</span>
                </p>
              ) : zcashValidation.status === "valid" ? (
                <p className="flex items-center gap-1 font-mono text-[11px] text-[#aab6c9]">
                  <ShieldCheck className="h-3 w-3 text-[#7fc98f]" />
                  <span>Shielded Address configured for research grants & confidential airdrops</span>
                </p>
              ) : zcashValidation.status === "invalid_prefix" ? (
                <p className="animate-in fade-in flex items-center gap-1 font-mono text-[11px] text-[#e07a6b] duration-200">
                  {zcashValidation.message}
                </p>
              ) : zcashValidation.status === "too_short" ? (
                <p className="flex items-center gap-1 font-mono text-[11px] text-[#7d8898]">
                  {zcashValidation.message}
                </p>
              ) : (
                <p className="flex items-center gap-1 font-mono text-[11px] text-[#7d8898]">
                  Optional: Zcash Unified Address (u1...)
                </p>
              )}
            </div>
          </div>

          {/* 3. Linked Identity Accounts (Google & X) */}
          <div className="space-y-2 pt-1">
            <span className="block flex items-center gap-1.5 text-xs font-medium text-[#c9ccd2]">
              <LinkIcon className="h-3.5 w-3.5 text-[#eaba49]" />
              LINKED IDENTITIES & RECOVERY
            </span>

            {(() => {
              const isTwitterLinked =
                Boolean(profile.linkedProviders?.some((p) => p === "twitter" || p === "x")) ||
                profile.authProvider === "twitter";
              const isGoogleLinked =
                Boolean(profile.linkedProviders?.includes("google")) || profile.authProvider === "google";

              return (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {/* X (Twitter) Account Box */}
                  <div className="flex items-center justify-between rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3a475c] bg-black text-white">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                    </div>

                    {isTwitterLinked ? (
                      <span className="flex items-center gap-1 rounded-md border border-[#7fc98f]/40 bg-[#7fc98f]/10 px-1.5 py-0.5 font-mono text-[9px] text-[#7fc98f]">
                        <Check className="h-2.5 w-2.5" />
                        <span>Linked</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectX}
                        disabled={linkingAuth === "twitter"}
                        className="bitfoots-btn rounded-md border border-[#3a475c] px-1.5 py-0.5 font-mono text-[9px] text-[#ffddcc] hover:border-[#eaba49] hover:text-[#eaba49]"
                      >
                        {linkingAuth === "twitter" ? "..." : "Connect"}
                      </button>
                    )}
                  </div>

                  {/* Google Account Box */}
                  <div className="flex items-center justify-between rounded-xl border border-[#3a475c]/70 bg-[#0f1216]/90 p-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#3a475c] bg-white/10 text-white">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                        </svg>
                      </div>
                    </div>

                    {isGoogleLinked ? (
                      <span className="flex items-center gap-1 rounded-md border border-[#7fc98f]/40 bg-[#7fc98f]/10 px-1.5 py-0.5 font-mono text-[9px] text-[#7fc98f]">
                        <Check className="h-2.5 w-2.5" />
                        <span>Linked</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectGoogle}
                        disabled={linkingAuth === "google"}
                        className="bitfoots-btn rounded-md border border-[#3a475c] px-1.5 py-0.5 font-mono text-[9px] text-[#ffddcc] hover:border-[#eaba49] hover:text-[#eaba49]"
                      >
                        {linkingAuth === "google" ? "..." : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <p className="animate-in fade-in flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/20 p-2 font-mono text-xs text-[#e07a6b] duration-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}
          {saveSuccess && (
            <p className="animate-in fade-in flex items-center gap-1 rounded-lg border border-[#7fc98f]/40 bg-[#7fc98f]/15 p-2 font-mono text-xs text-[#7fc98f] duration-200">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>Hunter Dossier and Shielded Credentials saved successfully!</span>
            </p>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bitfoots-btn rounded-xl px-4 py-2 text-xs font-medium hover:text-[#ffddcc]"
            >
              Dismiss
            </button>
            <button
              type="submit"
              className="bitfoots-btn bitfoots-btn--solid flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold shadow-lg shadow-[#eaba49]/20"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Export Hunter Card Modal Preview */}
      <ExportCardModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        username={usernameInput || profile.username || "Hunter"}
        avatarUrl={avatarUrlInput || profile.avatarUrl || "/bitfoot-heads/bitfoot-head-01.png"}
        score={(profile.unlockedSectors?.length || 1) * 350}
        timeElapsedSeconds={"CLEAR"}
        chapter={(profile.unlockedSectors && Math.max(...profile.unlockedSectors)) || 1}
        uuid={profile.userId}
      />
    </div>
  );
};
