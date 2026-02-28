import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import {
  Play,
  Sparkles,
  X,
  Download,
  Loader2,
  RectangleVertical,
  RectangleHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "./i18n";
import type { VibeResult } from "./ResultDisplay";

type FrameTheme = "minimal" | "polaroid" | "film" | "neon";
type Orientation = "portrait" | "landscape";

interface VibeCardProps {
  result: VibeResult;
  previewUrl: string;
  onClose: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const FRAME_THEMES: { key: FrameTheme; icon: string; label: string }[] = [
  { key: "minimal", icon: "🎵", label: "Minimal" },
  { key: "polaroid", icon: "📸", label: "Polaroid" },
  { key: "film", icon: "🎬", label: "Film" },
  { key: "neon", icon: "✨", label: "Neon" },
];

// SVG icons for social platforms (no lucide equivalents)
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const ThreadsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.26 1.33-3.017.88-.723 2.08-1.128 3.378-1.17 1.08-.033 2.075.122 2.97.453-.09-.58-.272-1.074-.545-1.47-.496-.72-1.302-1.1-2.4-1.132h-.048c-.876 0-1.627.275-2.174.795l-1.418-1.42c.855-.834 1.994-1.293 3.592-1.293h.067c1.71.05 3.03.678 3.925 1.865.828 1.1 1.264 2.596 1.3 4.45l.003.245c.006.468-.015.895-.064 1.283 1.07.635 1.905 1.504 2.418 2.58.8 1.68.874 4.457-1.236 6.545C17.676 23.18 15.438 23.96 12.186 24zm-1.638-8.062c-.921.028-1.61.244-2.043.588-.347.278-.517.617-.493 1.008.04.7.546 1.49 2.162 1.574 1.09.06 2.025-.216 2.63-.777.543-.503.878-1.236.998-2.164-.756-.263-1.607-.397-2.535-.397-.243 0-.488.012-.72.037v.131z" />
  </svg>
);

export function VibeCard({ result, previewUrl, onClose }: VibeCardProps) {
  const { t } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [frame, setFrame] = useState<FrameTheme>("minimal");
  const [orientation, setOrientation] = useState<Orientation>("portrait");

  const getCanvas = useCallback(async () => {
    if (!cardRef.current) return null;

    // html2canvas cannot parse oklch() colors from Tailwind v4.
    // Override any inherited oklch values before capture, then restore.
    const elements = cardRef.current.querySelectorAll("*");
    const saved: { el: HTMLElement; bc: string; oc: string }[] = [];

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const cs = getComputedStyle(htmlEl);
      const bc = cs.borderColor;
      const oc = cs.outlineColor;
      if (bc.includes("oklch") || oc.includes("oklch")) {
        saved.push({
          el: htmlEl,
          bc: htmlEl.style.borderColor,
          oc: htmlEl.style.outlineColor,
        });
        if (bc.includes("oklch")) htmlEl.style.borderColor = "transparent";
        if (oc.includes("oklch")) htmlEl.style.outlineColor = "transparent";
      }
    });

    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    });

    saved.forEach(({ el, bc, oc }) => {
      el.style.borderColor = bc;
      el.style.outlineColor = oc;
    });

    return canvas;
  }, []);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const canvas = await getCanvas();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `vibetube-${result.vibe.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to generate card:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [result.vibe, getCanvas]);

  // Social share handlers
  const shareText = `My vibe is "${result.emoji} ${result.vibe}"!\nTheme song: ${result.songTitle} by ${result.artist} 🎵`;
  const shareUrl = "https://vibetube.vercel.app";

  const handleXShare = useCallback(() => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  }, [shareText]);

  const handleInstagramShare = useCallback(async () => {
    // Instagram doesn't support web share intents.
    // Download the card image so the user can post it on Instagram.
    await handleDownload();
  }, [handleDownload]);

  const handleThreadsShare = useCallback(() => {
    const text = `${shareText}\n${shareUrl}`;
    window.open(
      `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }, [shareText]);

  const isLandscape = orientation === "landscape";
  const aspectRatio = isLandscape ? "4 / 3" : "3 / 4";

  const getFrameStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: "100%",
      overflow: "hidden",
      position: "relative",
      borderColor: "transparent",
      outlineColor: "transparent",
    };
    switch (frame) {
      case "polaroid":
        return {
          ...base,
          backgroundColor: "#fafaf8",
          borderRadius: "4px",
          padding: isLandscape ? "12px 12px 44px 12px" : "12px 12px 48px 12px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        };
      case "film":
        return {
          ...base,
          backgroundColor: "#1a1a1a",
          borderRadius: "4px",
          padding: "20px 12px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        };
      case "neon":
        return {
          ...base,
          backgroundColor: "#0a0a0a",
          borderRadius: "16px",
          padding: "4px",
          boxShadow: `0 0 30px ${hexToRgba(result.color, 0.5)}, 0 0 60px ${hexToRgba(result.color, 0.2)}, inset 0 0 30px ${hexToRgba(result.color, 0.1)}`,
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: hexToRgba(result.color, 0.7),
        };
      default:
        return { ...base, borderRadius: "16px", backgroundColor: "#000" };
    }
  };

  const getImageRadius = () => {
    switch (frame) {
      case "polaroid": return "2px";
      case "film": return "2px";
      case "neon": return "12px";
      default: return "16px";
    }
  };

  const FilmPerforations = ({ side }: { side: "left" | "right" }) => (
    <div
      style={{
        position: "absolute",
        top: "20px",
        bottom: "20px",
        [side]: "2px",
        width: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        alignItems: "center",
        zIndex: 2,
      }}
    >
      {Array.from({ length: isLandscape ? 8 : 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: "5px",
            height: "3px",
            borderRadius: "1px",
            backgroundColor: "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  );

  const modalMaxWidth = isLandscape ? "480px" : "360px";

  const socialBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    borderRadius: "9999px",
    border: "1px solid rgba(255,255,255,0.2)",
    cursor: "pointer",
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 0,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative flex flex-col items-center gap-4 w-full"
          style={{ maxWidth: modalMaxWidth }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "-12px",
              right: "-12px",
              zIndex: 10,
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: "9999px",
              padding: "6px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <X style={{ width: "16px", height: "16px", color: "#555" }} />
          </button>

          {/* Top controls: Frame themes + Orientation toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* Frame selector */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "4px",
              }}
            >
              {FRAME_THEMES.map((th) => (
                <button
                  key={th.key}
                  onClick={() => setFrame(th.key)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.65rem",
                    fontWeight: frame === th.key ? 600 : 400,
                    backgroundColor: frame === th.key ? "rgba(255,255,255,0.95)" : "transparent",
                    color: frame === th.key ? "#333" : "rgba(255,255,255,0.6)",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <span style={{ fontSize: "0.75rem" }}>{th.icon}</span>
                  {th.label}
                </button>
              ))}
            </div>

            {/* Orientation toggle */}
            <div
              style={{
                display: "flex",
                gap: "2px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "3px",
              }}
            >
              <button
                onClick={() => setOrientation("portrait")}
                style={{
                  padding: "5px 8px",
                  borderRadius: "7px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: !isLandscape ? "rgba(255,255,255,0.95)" : "transparent",
                  color: !isLandscape ? "#333" : "rgba(255,255,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
                title="Portrait (3:4)"
              >
                <RectangleVertical style={{ width: "14px", height: "14px" }} />
              </button>
              <button
                onClick={() => setOrientation("landscape")}
                style={{
                  padding: "5px 8px",
                  borderRadius: "7px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: isLandscape ? "rgba(255,255,255,0.95)" : "transparent",
                  color: isLandscape ? "#333" : "rgba(255,255,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
                title="Landscape (4:3)"
              >
                <RectangleHorizontal style={{ width: "14px", height: "14px" }} />
              </button>
            </div>
          </div>

          {/* Blur glow behind card */}
          <div style={{ position: "relative", width: "100%" }}>
            <div
              style={{
                position: "absolute",
                inset: "-20px",
                backgroundImage: `url(${previewUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(40px) saturate(1.5)",
                opacity: 0.4,
                borderRadius: "40px",
                zIndex: 0,
              }}
            />

            {/* === The Card === */}
            <div ref={cardRef} style={{ ...getFrameStyles(), position: "relative", zIndex: 1, color: "#ffffff" }}>
              {frame === "film" && (
                <>
                  <FilmPerforations side="left" />
                  <FilmPerforations side="right" />
                </>
              )}

              {/* Photo container */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio,
                  borderRadius: getImageRadius(),
                  overflow: "hidden",
                }}
              >
                <img
                  src={previewUrl}
                  alt="Vibe"
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />

                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: isLandscape
                      ? "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 35%, transparent 60%)"
                      : "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 28%, transparent 55%)",
                  }}
                />

                {/* Mini player UI */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: isLandscape ? "24px 20px 14px 20px" : "32px 16px 16px 16px",
                  }}
                >
                  {/* Vibe badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontWeight: 600,
                        fontSize: "0.65rem",
                        backgroundColor: result.color,
                        color: "#ffffff",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        boxShadow: `0 2px 10px ${hexToRgba(result.color, 0.5)}`,
                      }}
                    >
                      <Sparkles style={{ width: "10px", height: "10px", color: "#fff" }} />
                      {result.emoji} {result.vibe}
                    </span>
                  </div>

                  {/* Centered song info with play button */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {/* Play button */}
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "9999px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `linear-gradient(135deg, ${result.color}, ${hexToRgba(result.color, 0.7)})`,
                        boxShadow: `0 3px 14px ${hexToRgba(result.color, 0.45)}`,
                      }}
                    >
                      <Play
                        style={{
                          width: "17px",
                          height: "17px",
                          color: "#fff",
                          marginLeft: "2px",
                          fill: "#fff",
                        }}
                      />
                    </div>

                    {/* Song title + artist centered */}
                    <div style={{ textAlign: "center", width: "100%" }}>
                      <p
                        style={{
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: isLandscape ? "1rem" : "0.9rem",
                          lineHeight: 1.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          margin: 0,
                        }}
                      >
                        {result.songTitle}
                      </p>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.55)",
                          fontSize: isLandscape ? "0.78rem" : "0.72rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          margin: "3px 0 0 0",
                        }}
                      >
                        {result.artist}
                      </p>
                    </div>
                  </div>

                  {/* Watermark */}
                  <div style={{ marginTop: "12px", textAlign: "right" }}>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.25)",
                        fontSize: "0.5rem",
                        letterSpacing: "0.08em",
                      }}
                    >
                      vibetube.vercel.app
                    </span>
                  </div>
                </div>
              </div>

              {/* Polaroid caption */}
              {frame === "polaroid" && (
                <div style={{ padding: "10px 4px 0 4px", textAlign: "center" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.7rem",
                      color: "#888",
                      fontStyle: "italic",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {result.emoji} {result.vibe}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons: Download + X + Instagram + Threads */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            {/* Download */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              disabled={isDownloading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                borderRadius: "9999px",
                border: "none",
                cursor: isDownloading ? "wait" : "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                backgroundColor: "#ffffff",
                color: "#333",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                opacity: isDownloading ? 0.6 : 1,
              }}
            >
              {isDownloading ? (
                <Loader2 style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }} />
              ) : (
                <Download style={{ width: "15px", height: "15px" }} />
              )}
              {isDownloading ? t("cardGenerating") : t("cardDownload")}
            </motion.button>

            {/* X (Twitter) */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleXShare}
              style={socialBtnStyle}
              title="Share on X"
            >
              <span style={{ fontSize: "1rem", fontWeight: 700 }}>𝕏</span>
            </motion.button>

            {/* Instagram */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleInstagramShare}
              style={socialBtnStyle}
              title="Save for Instagram"
            >
              <InstagramIcon />
            </motion.button>

            {/* Threads */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleThreadsShare}
              style={socialBtnStyle}
              title="Share on Threads"
            >
              <ThreadsIcon />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
