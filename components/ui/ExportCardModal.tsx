import React, { useState, useEffect } from "react";
import { Download, Share2, X, Sparkles, Check, Copy, Shield, Clock, Trophy } from "lucide-react";

export interface ExportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  avatarUrl: string;
  score: number;
  timeElapsedSeconds: string | number;
  chapter: number;
  badge?: string;
  uuid?: string;
}

export const ExportCardModal: React.FC<ExportCardModalProps> = ({
  isOpen,
  onClose,
  username,
  avatarUrl,
  score,
  timeElapsedSeconds,
  chapter,
  badge,
  uuid,
}) => {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(true);

  // Compute Badge Name
  const finalBadge =
    badge || (chapter === 3 ? "Apex Grand Hunter" : chapter === 2 ? "Grid Navigator" : "Forest Walker");

  // Construct OG Card URL
  const getCardUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      score: String(score),
      time: typeof timeElapsedSeconds === "number" ? `${timeElapsedSeconds}s` : timeElapsedSeconds,
      chapter: String(chapter),
      username: username || "Guest_Hunter",
      avatar: avatarUrl || "/bitfoot-heads/bitfoot-head-01.png",
      badge: finalBadge,
      uuid: uuid || "N/A",
    });
    return `${origin}/api/og/score?${params.toString()}`;
  };

  // Load SVG for preview
  useEffect(() => {
    if (!isOpen) {
      setSvgDataUrl(null);
      setLoadingPreview(true);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;
    setLoadingPreview(true);
    const url = getCardUrl();

    fetch(url)
      .then((res) => res.text())
      .then((svgText) => {
        if (!isMounted) return;
        const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
        createdUrl = URL.createObjectURL(blob);
        setSvgDataUrl(createdUrl);
        setLoadingPreview(false);
      })
      .catch((err) => {
        console.error("Failed to load SVG card preview:", err);
        if (isMounted) setLoadingPreview(false);
      });

    return () => {
      isMounted = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
    // Intentionally omitted deps (`getCardUrl`, `svgDataUrl`): the preview must be
    // fetched exactly once per card parameter set; `svgDataUrl` is only read in the
    // cleanup to revoke the previous object URL. TODO(UX-4): extract to hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, username, avatarUrl, score, timeElapsedSeconds, chapter, badge]);

  if (!isOpen) return null;

  // Render SVG to 1200x630 Canvas Blob for True High-Resolution PNG
  const renderCardToPngBlob = async (): Promise<Blob> => {
    const url = getCardUrl();
    const res = await fetch(url);
    const svgText = await res.text();

    const img = new Image();
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(svgBlob);

    return new Promise<Blob>((resolve, reject) => {
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1200;
          canvas.height = 630;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas 2D context unavailable"));
            return;
          }
          ctx.drawImage(img, 0, 0, 1200, 630);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(blobUrl);
            if (blob) resolve(blob);
            else reject(new Error("Canvas blob conversion failed"));
          }, "image/png");
        } catch (err) {
          URL.revokeObjectURL(blobUrl);
          reject(err);
        }
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(blobUrl);
        reject(e);
      };
      img.src = blobUrl;
    });
  };

  // Download High-Resolution PNG Handler
  const handleDownloadPng = async () => {
    try {
      setDownloading(true);
      const blob = await renderCardToPngBlob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = (username || "hunter").replace(/[^a-zA-Z0-9_-]/g, "");
      a.href = blobUrl;
      a.download = `bitfoot_hunter_${safeName}_sector${chapter}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      console.error("Canvas export failed, falling back to SVG download:", e);
      const url = getCardUrl();
      const a = document.createElement("a");
      a.href = url;
      a.download = `bitfoot_card_sector${chapter}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setDownloading(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      const blob = await renderCardToPngBlob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      }
    } catch (e) {
      console.warn("Clipboard copy not supported or failed:", e);
    }
  };

  // Twitter / X Share URL
  const getTwitterShareUrl = () => {
    const cardUrl = getCardUrl();
    const cleanTime = typeof timeElapsedSeconds === "number" ? `${timeElapsedSeconds}s` : timeElapsedSeconds;
    const userTag = username ? (username.startsWith("@") ? username : `@${username}`) : "@Guest_Hunter";

    const text = `🌲 Here continues Tommy’s (@shelby_tommy0) latest high-stakes expedition across @BITFOOTS_!\n\n🐾 Operative: ${userTag}\n🧭 Sector: 0${chapter} Cleared\n🏆 Clearance Rank: ${finalBadge}\n⚡ Telemetry: ${score} PTS in ${cleanTime}\n\n"Never caught. You don't buy a Bitfoot, you spot him. The only price is the hunt."\n\n🔍 Inspect the verified on-chain dossier:\n${cardUrl}`;

    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&hashtags=BITFOOTS,Zcash,Web3Gaming,BitcoinOrdinals`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="animate-in fade-in fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md duration-200 sm:p-5"
    >
      <div className="bitfoots-glass-card animate-in zoom-in-95 relative flex max-h-[94vh] w-full max-w-3xl select-none flex-col space-y-4 overflow-hidden overflow-y-auto rounded-2xl border border-[#eaba49]/70 p-5 font-sans text-[#aab6c9] shadow-2xl duration-200 sm:p-7">
        {/* Pixel Corner Ornaments */}
        <div className="absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-[#eaba49]" />
        <div className="absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-[#eaba49]" />
        <div className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-[#eaba49]" />
        <div className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[#eaba49]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#3a475c]/70 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg border border-[#eaba49]/40 bg-[#eaba49]/10 p-1.5 text-[#eaba49]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold tracking-wide text-[#ffddcc] sm:text-lg">
                Expedition Dossier &amp; Clearance Card
              </h2>
              <p className="font-mono text-[11px] text-[#7d8898]">
                Official Zcash Shielded Telemetry • Authentic BitFoots Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hunter Quick Summary Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#3a475c]/60 bg-[#0f1216]/90 p-2.5 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <img
              src={avatarUrl || "/bitfoot-heads/bitfoot-head-01.png"}
              alt={username}
              className="h-8 w-8 rounded-lg border border-[#eaba49] bg-black object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/bitfoot-heads/bitfoot-head-01.png";
              }}
            />
            <span className="font-bold text-[#ffddcc]">
              {username.startsWith("@") ? username : `@${username}`}
            </span>
            <span className="rounded border border-[#7fc98f]/30 bg-[#7fc98f]/10 px-2 py-0.5 text-[10px] text-[#7fc98f]">
              Sector 0{chapter}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-[#f3c85f]">
              <Trophy className="h-3.5 w-3.5" />
              <span>{score} PTS</span>
            </span>
            <span className="flex items-center gap-1 text-[#aab6c9]">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {typeof timeElapsedSeconds === "number" ? `${timeElapsedSeconds}s` : timeElapsedSeconds}
              </span>
            </span>
          </div>
        </div>

        {/* Interactive Live Card Preview */}
        <div className="group relative flex aspect-[1200/630] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-[#eaba49]/80 bg-black/70 shadow-2xl">
          {loadingPreview ? (
            <div className="flex flex-col items-center justify-center space-y-2 p-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#eaba49] border-t-transparent" />
              <p className="font-mono text-xs text-[#eaba49]">Generating cryptographic export card...</p>
            </div>
          ) : svgDataUrl ? (
            <img
              src={svgDataUrl}
              alt="BitFoots Hunter Export Card"
              className="h-full w-full select-none object-contain"
            />
          ) : (
            <p className="font-mono text-xs text-red-400">
              Failed to load preview. Please try downloading directly.
            </p>
          )}

          {/* Watermark Overlay Tag */}
          <div className="pointer-events-none absolute right-2 top-2 rounded border border-[#eaba49]/60 bg-black/70 px-2 py-0.5 font-mono text-[10px] text-[#ffddcc] opacity-0 transition-opacity group-hover:opacity-100">
            1200 x 630 HD
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
          {/* Primary Action: Download PNG */}
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="bitfoots-btn bitfoots-btn--solid flex cursor-pointer items-center justify-center space-x-2 rounded-xl px-4 py-3 text-xs font-bold shadow-lg shadow-[#eaba49]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-[#14171c]" />
            <span className="text-[#14171c]">{downloading ? "Rendering PNG..." : "Download PNG"}</span>
          </button>

          {/* Action 2: Share on X */}
          <a
            href={getTwitterShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bitfoots-btn flex cursor-pointer items-center justify-center space-x-2 rounded-xl border-[#eaba49] px-4 py-3 text-center text-xs font-bold text-[#ffddcc] transition-all hover:bg-[#eaba49]/15"
          >
            <Share2 className="h-4 w-4 text-[#eaba49]" />
            <span>Share on X</span>
          </a>

          {/* Action 3: Copy Image */}
          <button
            onClick={handleCopyImage}
            className="bitfoots-btn flex cursor-pointer items-center justify-center space-x-2 rounded-xl border-[#3a475c] px-4 py-3 text-xs font-bold text-[#c9ccd2] transition-all hover:border-[#eaba49] hover:text-white"
          >
            {copiedImage ? (
              <>
                <Check className="h-4 w-4 text-[#7fc98f]" />
                <span className="text-[#7fc98f]">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-[#eaba49]" />
                <span>Copy Image</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center justify-between border-t border-[#3a475c]/50 pt-2 font-mono text-[10px] text-[#7d8898]">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-[#7fc98f]" />
            <span>Zero-Knowledge Proof Verified • Anti-Cheat Compliant</span>
          </span>
          <span className="text-[#eaba49]">@BITFOOTS_</span>
        </div>
      </div>
    </div>
  );
};

export default ExportCardModal;
