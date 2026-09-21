"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  X,
  Copy,
  Check,
  Save,
  Fingerprint,
  Dices,
  ShieldCheck,
  AlertCircle,
  Link as LinkIcon,
  Coins,
  Sparkles,
  Download,
} from "lucide-react";
import { HunterProfile } from "@/hooks/useHunterSession";
import { ExportCardModal } from "./ExportCardModal";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HunterProfile;
  isSupabaseConfigured: boolean;
  onUpdateProfile: (updates: {
    username?: string;
    avatarUrl?: string;
    zcashAddress?: string;
  }) => void;
  onLoginWithGoogle: () => Promise<any>;
  onLoginWithX: () => Promise<any>;
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
  isSupabaseConfigured,
  onUpdateProfile,
  onLoginWithGoogle,
  onLoginWithX,
}) => {
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [avatarUrlInput, setAvatarUrlInput] = useState<string>("");
  const [zcashInput, setZcashInput] = useState<string>("");
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedZec, setCopiedZec] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [linkingAuth, setLinkingAuth] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setUsernameInput(profile.username || "");
      setAvatarUrlInput(profile.avatarUrl || "");
      setZcashInput(profile.zcashAddress || "");
      setSaveSuccess(false);
      setErrorMsg(null);
      setCopiedId(false);
      setCopiedZec(false);
      setLinkingAuth(null);
    }
  }, [isOpen, profile.username, profile.avatarUrl, profile.zcashAddress]);

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

  // Randomize Avatar using authentic BitFoot heads (01-18)
  const handleRandomizeAvatar = () => {
    const available = BITFOOT_HEADS.filter((img) => img !== avatarUrlInput);
    const chosen =
      available[Math.floor(Math.random() * available.length)] || BITFOOT_HEADS[0];
    setAvatarUrlInput(chosen);
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
      await onLoginWithX();
    } catch (e) {
      console.error("X linking failed:", e);
    } finally {
      setLinkingAuth(null);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setLinkingAuth("google");
      await onLoginWithGoogle();
    } catch (e) {
      console.error("Google linking failed:", e);
    } finally {
      setLinkingAuth(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = usernameInput.trim();
    if (!cleanName) {
      setErrorMsg("Call-sign cannot be blank.");
      return;
    }
    if (cleanName.length < 3) {
      setErrorMsg("Call-sign must be at least 3 characters.");
      return;
    }
    if (cleanName.length > 24) {
      setErrorMsg("Call-sign must not exceed 24 characters.");
      return;
    }

    const cleanZcash = zcashInput.trim();
    if (cleanZcash && !cleanZcash.startsWith("u1")) {
      setErrorMsg("Zcash address must start with 'u1'.");
      return;
    }

    onUpdateProfile({
      username: cleanName,
      avatarUrl: avatarUrlInput || profile.avatarUrl,
      zcashAddress: cleanZcash,
    });

    setSaveSuccess(true);
    setErrorMsg(null);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bitfoots-glass-card rounded-2xl p-5 sm:p-7 shadow-2xl overflow-hidden text-[#aab6c9] font-sans border border-[#eaba49]/60 flex flex-col space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#3a475c]/60 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#eaba49]/15 border border-[#eaba49]/50 flex items-center justify-center text-[#eaba49] shadow-md shadow-[#eaba49]/10">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#eaba49] tracking-wider uppercase block">
                THE CRYPTID INSTITUTE // HUNTER CREDENTIALS
              </span>
              <h2 className="text-base sm:text-lg font-serif font-medium text-[#ffddcc] tracking-wide">
                Agent Profile Dossier
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

        {/* Profile Card Summary & Avatar Customizer */}
        <div className="p-4 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/70 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar with Randomizer action */}
            <div className="relative group">
              <img
                src={avatarUrlInput || profile.avatarUrl}
                alt={profile.username}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#eaba49] bg-black/70 p-1 object-cover shadow-lg shadow-[#eaba49]/10 transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/bitfoot-heads/bitfoot-head-01.png`;
                }}
              />
            </div>

            {/* Hunter Info & Avatar Seed Buttons */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-mono font-bold text-[#ffddcc]">
                  {usernameInput || profile.username || "Anonymous Hunter"}
                </h3>
              </div>

              {/* Avatar Generator Button & Export Hunter Card Button */}
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleRandomizeAvatar}
                  className="bitfoots-btn py-0.5 px-2 rounded-md text-[10px] font-mono flex items-center gap-1 hover:text-[#eaba49] hover:border-[#eaba49]/60 transition-all"
                >
                  <Dices className="w-3 h-3 text-[#eaba49]" />
                  <span>Roll Random Avatar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="bitfoots-btn py-0.5 px-2 rounded-md text-[10px] font-mono flex items-center gap-1 border-[#eaba49]/70 text-[#ffddcc] hover:bg-[#eaba49]/15 transition-all"
                >
                  <Download className="w-3 h-3 text-[#eaba49]" />
                  <span>Export Hunter ID Card</span>
                </button>
              </div>

              {/* Hunter UUID Telemetry */}
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-[10px] font-mono text-[#7d8898]">
                <span className="flex items-center gap-1">
                  <span>UUID:</span>
                  <span className="text-[#aab6c9] max-w-[150px] sm:max-w-[250px] truncate select-all">
                    {profile.userId || "N/A"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyUserId}
                  className="text-[#7d8898] hover:text-[#eaba49] flex items-center gap-0.5 transition-colors p-0.5"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-[#7fc98f]" />
                      <span className="text-[#7fc98f]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-6 font-mono">
          {/* 1. Field Call-Sign */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#c9ccd2] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#eaba49]" />
                USERNAME
              </span>
              <span className="text-[10px] text-[#7d8898]">
                {usernameInput.length}/24
              </span>
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
              className="w-full bg-[#0f1216] border border-[#3a475c] focus:border-[#eaba49] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#ffddcc] outline-none transition-colors"
            />
          </div>

          {/* 2. Zcash Shielded Unified Address (u1...) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#c9ccd2] flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#eaba49]" />
                <span>ZCASH SHIELDED ADDRESS</span>
              </label>
              {zcashInput && (
                <button
                  type="button"
                  onClick={handleCopyZec}
                  className="text-[10px] text-[#7d8898] hover:text-[#eaba49] flex items-center gap-1 transition-colors"
                >
                  {copiedZec ? (
                    <>
                      <Check className="w-3 h-3 text-[#7fc98f]" />
                      <span className="text-[#7fc98f]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={zcashInput}
                onChange={(e) => {
                  setZcashInput(e.target.value);
                  setErrorMsg(null);
                  setSaveSuccess(false);
                }}
                placeholder="u1... (Unified Shielded Address for grants & airdrops)"
                className={`w-full bg-[#0f1216] border rounded-xl px-3.5 py-2 text-xs text-[#ffddcc] outline-none transition-colors pr-8 font-mono ${zcashValidation.status === "valid"
                    ? "border-[#7fc98f]/80 focus:border-[#7fc98f]"
                    : zcashValidation.status === "invalid_prefix"
                      ? "border-[#e07a6b]/80 focus:border-[#e07a6b]"
                      : "border-[#3a475c] focus:border-[#eaba49]"
                  }`}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                {zcashValidation.status === "valid" && (
                  <Check className="w-4 h-4 text-[#7fc98f]" />
                )}
                {zcashValidation.status === "invalid_prefix" && (
                  <AlertCircle className="w-4 h-4 text-[#e07a6b]" />
                )}
              </div>
            </div>

            {/* Validation Feedback & Privacy Lore Callout */}
            <div className="flex flex-col gap-1">
              <p
                className={`text-[11px] font-mono flex items-center gap-1 ${zcashValidation.status === "valid"
                    ? "text-[#7fc98f]"
                    : zcashValidation.status === "invalid_prefix"
                      ? "text-[#e07a6b]"
                      : "text-[#7d8898]"
                  }`}
              >
                {zcashValidation.status === "valid" && <ShieldCheck className="w-3 h-3" />}
                {zcashValidation.message}
              </p>
            </div>
          </div>

          {/* 3. Linked Identity Accounts (Google & X) */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-medium text-[#c9ccd2] block flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[#eaba49]" />
              LINKED IDENTITIES & RECOVERY
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* X (Twitter) Account Box */}
              <div className="p-3 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/70 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white border border-[#3a475c]">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7d8898]">
                      {profile.authProvider === "twitter" ? "Linked & Verified" : "Not Linked"}
                    </span>
                  </div>
                </div>

                {profile.authProvider === "twitter" ? (
                  <span className="text-[9px] font-mono text-[#7fc98f] bg-[#7fc98f]/10 border border-[#7fc98f]/40 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Linked</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectX}
                    disabled={linkingAuth === "twitter"}
                    className="bitfoots-btn py-0.5 px-1.5 rounded-md text-[9px] font-mono text-[#ffddcc] hover:text-[#eaba49] border border-[#3a475c] hover:border-[#eaba49]"
                  >
                    {linkingAuth === "twitter" ? "..." : "Connect"}
                  </button>
                )}
              </div>

              {/* Google Account Box */}
              <div className="p-3 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/70 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white border border-[#3a475c]">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7d8898]">
                      {profile.authProvider === "google" ? "Linked & Verified" : "Not Linked"}
                    </span>
                  </div>
                </div>

                {profile.authProvider === "google" ? (
                  <span className="text-[9px] font-mono text-[#7fc98f] bg-[#7fc98f]/10 border border-[#7fc98f]/40 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Linked</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={linkingAuth === "google"}
                    className="bitfoots-btn py-0.5 px-1.5 rounded-md text-[9px] font-mono text-[#ffddcc] hover:text-[#eaba49] border border-[#3a475c] hover:border-[#eaba49]"
                  >
                    {linkingAuth === "google" ? "..." : "Connect"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <p className="text-xs text-[#e07a6b] font-mono flex items-center gap-1 bg-red-950/20 p-2 rounded-lg border border-red-500/30">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}
          {saveSuccess && (
            <p className="text-xs text-[#7fc98f] font-mono flex items-center gap-1 bg-[#7fc98f]/15 p-2 rounded-lg border border-[#7fc98f]/40">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Hunter Dossier and Shielded Credentials saved successfully!</span>
            </p>
          )}

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bitfoots-btn px-4 py-2 rounded-xl text-xs font-medium hover:text-[#ffddcc]"
            >
              Dismiss
            </button>
            <button
              type="submit"
              className="bitfoots-btn bitfoots-btn--solid px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#eaba49]/20"
            >
              <Save className="w-3.5 h-3.5" />
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
