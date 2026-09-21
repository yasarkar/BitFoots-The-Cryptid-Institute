import React, { useState, useEffect } from "react";
import {
  Download,
  Share2,
  X,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Shield,
  Clock,
  Trophy,
} from "lucide-react";

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
    badge ||
    (chapter === 3
      ? "Apex Grand Hunter"
      : chapter === 2
      ? "Grid Navigator"
      : "Forest Walker");

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
    setLoadingPreview(true);
    const url = getCardUrl();

    fetch(url)
      .then((res) => res.text())
      .then((svgText) => {
        if (!isMounted) return;
        const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);
        setSvgDataUrl(objectUrl);
        setLoadingPreview(false);
      })
      .catch((err) => {
        console.error("Failed to load SVG card preview:", err);
        if (isMounted) setLoadingPreview(false);
      });

    return () => {
      isMounted = false;
      if (svgDataUrl) URL.revokeObjectURL(svgDataUrl);
    };
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
        await navigator.clipboard.write([
          new window.ClipboardItem({ "image/png": blob }),
        ]);
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
    const cleanTime =
      typeof timeElapsedSeconds === "number"
        ? `${timeElapsedSeconds}s`
        : timeElapsedSeconds;
    const userTag = username
      ? username.startsWith("@")
        ? username
        : `@${username}`
      : "@Guest_Hunter";

    const text = `🌲 Here continues Tommy’s (@shelby_tommy0) latest high-stakes expedition across @BITFOOTS_!\n\n🐾 Operative: ${userTag}\n🧭 Sector: 0${chapter} Cleared\n🏆 Clearance Rank: ${finalBadge}\n⚡ Telemetry: ${score} PTS in ${cleanTime}\n\n"Never caught. You don't buy a Bitfoot, you spot him. The only price is the hunt."\n\n🔍 Inspect the verified on-chain dossier:\n${cardUrl}`;

    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&hashtags=BITFOOTS,Zcash,Web3Gaming,BitcoinOrdinals`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bitfoots-glass-card rounded-2xl p-5 sm:p-7 shadow-2xl overflow-hidden text-[#aab6c9] font-sans border border-[#eaba49]/70 flex flex-col space-y-4 max-h-[94vh] overflow-y-auto animate-in zoom-in-95 duration-200 select-none">
        {/* Pixel Corner Ornaments */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#eaba49]" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#eaba49]" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#eaba49]" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#eaba49]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#3a475c]/70 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[#eaba49]/10 border border-[#eaba49]/40 text-[#eaba49]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#ffddcc] tracking-wide">
                Expedition Dossier &amp; Clearance Card
              </h2>
              <p className="text-[11px] font-mono text-[#7d8898]">
                Official Zcash Shielded Telemetry • Authentic BitFoots Record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hunter Quick Summary Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0f1216]/90 border border-[#3a475c]/60 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <img
              src={avatarUrl || "/bitfoot-heads/bitfoot-head-01.png"}
              alt={username}
              className="w-8 h-8 rounded-lg border border-[#eaba49] bg-black object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/bitfoot-heads/bitfoot-head-01.png";
              }}
            />
            <span className="font-bold text-[#ffddcc]">
              {username.startsWith("@") ? username : `@${username}`}
            </span>
            <span className="text-[10px] text-[#7fc98f] bg-[#7fc98f]/10 px-2 py-0.5 rounded border border-[#7fc98f]/30">
              Sector 0{chapter}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-[#f3c85f]">
              <Trophy className="w-3.5 h-3.5" />
              <span>{score} PTS</span>
            </span>
            <span className="flex items-center gap-1 text-[#aab6c9]">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {typeof timeElapsedSeconds === "number"
                  ? `${timeElapsedSeconds}s`
                  : timeElapsedSeconds}
              </span>
            </span>
          </div>
        </div>

        {/* Interactive Live Card Preview */}
        <div className="relative w-full aspect-[1200/630] rounded-xl overflow-hidden bg-black/70 border-2 border-[#eaba49]/80 shadow-2xl flex items-center justify-center group">
          {loadingPreview ? (
            <div className="flex flex-col items-center justify-center space-y-2 p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#eaba49] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-[#eaba49]">
                Generating cryptographic export card...
              </p>
            </div>
          ) : svgDataUrl ? (
            <img
              src={svgDataUrl}
              alt="BitFoots Hunter Export Card"
              className="w-full h-full object-contain select-none"
            />
          ) : (
            <p className="text-xs text-red-400 font-mono">
              Failed to load preview. Please try downloading directly.
            </p>
          )}

          {/* Watermark Overlay Tag */}
          <div className="absolute top-2 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 border border-[#eaba49]/60 px-2 py-0.5 rounded text-[10px] font-mono text-[#ffddcc]">
            1200 x 630 HD
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Primary Action: Download PNG */}
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="bitfoots-btn bitfoots-btn--solid py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-[#eaba49]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#14171c]" />
            <span className="text-[#14171c]">
              {downloading ? "Rendering PNG..." : "Download PNG"}
            </span>
          </button>

          {/* Action 2: Share on X */}
          <a
            href={getTwitterShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bitfoots-btn py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border-[#eaba49] hover:bg-[#eaba49]/15 text-[#ffddcc] transition-all cursor-pointer text-center"
          >
            <Share2 className="w-4 h-4 text-[#eaba49]" />
            <span>Share on X</span>
          </a>

          {/* Action 3: Copy Image */}
          <button
            onClick={handleCopyImage}
            className="bitfoots-btn py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border-[#3a475c] hover:border-[#eaba49] text-[#c9ccd2] hover:text-white transition-all cursor-pointer"
          >
            {copiedImage ? (
              <>
                <Check className="w-4 h-4 text-[#7fc98f]" />
                <span className="text-[#7fc98f]">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#eaba49]" />
                <span>Copy Image</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-2 border-t border-[#3a475c]/50 flex items-center justify-between text-[10px] font-mono text-[#7d8898]">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-[#7fc98f]" />
            <span>Zero-Knowledge Proof Verified • Anti-Cheat Compliant</span>
          </span>
          <span className="text-[#eaba49]">@BITFOOTS_</span>
        </div>
      </div>
    </div>
  );
};

export default ExportCardModal;
