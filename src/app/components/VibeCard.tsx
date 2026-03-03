import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";
import {
  Sparkles,
  X,
  Download,
  Loader2,
  RectangleVertical,
  RectangleHorizontal,
  SkipBack,
  SkipForward,
  Pause,
  Heart,
  ListMusic,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "./i18n";
import type { VibeResult } from "./ResultDisplay";

type FrameTheme = "minimal" | "polaroid" | "film" | "neon" | "y2k" | "vintage" | "ticket";
type Orientation = "portrait" | "landscape";

// Y2K sparkle positions (fixed so html2canvas can capture them)
const Y2K_SPARKLES = [
  { top: "12%", left: "18%", size: 6, color: "rgba(255,105,180,0.9)", delay: 0 },
  { top: "22%", left: "78%", size: 5, color: "rgba(0,191,255,0.85)", delay: 0.4 },
  { top: "38%", left: "88%", size: 4, color: "rgba(180,0,255,0.8)", delay: 0.8 },
  { top: "52%", left: "8%", size: 5, color: "rgba(0,191,255,0.85)", delay: 1.2 },
  { top: "65%", left: "72%", size: 6, color: "rgba(255,105,180,0.9)", delay: 0.6 },
  { top: "78%", left: "25%", size: 4, color: "rgba(180,0,255,0.8)", delay: 1.0 },
  { top: "45%", left: "50%", size: 5, color: "rgba(255,255,255,0.7)", delay: 0.2 },
  { top: "18%", left: "42%", size: 4, color: "rgba(255,105,180,0.7)", delay: 1.4 },
  { top: "85%", left: "60%", size: 5, color: "rgba(0,191,255,0.8)", delay: 0.3 },
  { top: "70%", left: "15%", size: 4, color: "rgba(255,255,255,0.6)", delay: 0.9 },
];

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
  { key: "minimal", icon: "\u{1F3B5}", label: "Minimal" },
  { key: "polaroid", icon: "\u{1F4F8}", label: "Polaroid" },
  { key: "film", icon: "\u{1F3AC}", label: "Film" },
  { key: "neon", icon: "\u2728", label: "Neon" },
  { key: "y2k", icon: "\u{1F4BF}", label: "Y2K" },
  { key: "vintage", icon: "\u{1F5BC}\uFE0F", label: "Vintage" },
  { key: "ticket", icon: "\u{1F3AB}", label: "Ticket" },
];

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

  const shareText = `My vibe is "${result.emoji} ${result.vibe}"!\nTheme song: ${result.songTitle} by ${result.artist} \u{1F3B5}`;
  const shareUrl = "https://vibetube.vercel.app";

  const handleXShare = useCallback(() => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  }, [shareText]);

  const handleThreadsShare = useCallback(() => {
    const text = `${shareText}\n${shareUrl}`;
    window.open(
      `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }, [shareText]);

  const isLandscape = orientation === "landscape";
  const paddingTop = isLandscape ? "75%" : "133.33%";

  const getFrameStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: "100%",
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
      case "y2k":
        return {
          ...base,
          backgroundColor: "#0d001a",
          borderRadius: "20px",
          padding: "5px",
          boxShadow:
            "0 0 40px rgba(255,105,180,0.35), 0 0 80px rgba(0,191,255,0.2), 0 0 120px rgba(180,0,255,0.1), inset 0 0 30px rgba(255,105,180,0.15)",
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: "rgba(255,105,180,0.6)",
        };
      case "vintage":
        return {
          ...base,
          backgroundColor: "#1a0f1e",
          borderRadius: "6px",
          padding: "18px",
          boxShadow:
            "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,110,0.3), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 60px rgba(212,175,110,0.08)",
          borderWidth: "3px",
          borderStyle: "solid",
          borderColor: "#b8941e",
          backgroundImage: "linear-gradient(135deg, #1a0f1e 0%, #2a1530 40%, #1a0f1e 100%)",
        };
      case "ticket":
        return {
          ...base,
          backgroundColor: "#1a1a2e",
          borderRadius: "12px",
          padding: "0",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
          overflow: "hidden" as const,
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
      case "y2k": return "16px";
      case "vintage": return "0px";
      case "ticket": return "0px";
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

  /* Ticket punch holes — semicircles on top & bottom edges */
  const TicketPunchHoles = ({ position }: { position: "top" | "bottom" }) => {
    const count = isLandscape ? 10 : 7;
    return (
      <div
        style={{
          position: "absolute",
          [position]: "-6px",
          left: "12px",
          right: "12px",
          display: "flex",
          justifyContent: "space-between",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "9999px",
              backgroundColor: "rgba(0,0,0,0.7)",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)",
            }}
          />
        ))}
      </div>
    );
  };

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

  /* Row split for 4+3 grid: first 4 in row 1, last 3 in row 2 */
  const row1 = FRAME_THEMES.slice(0, 4);
  const row2 = FRAME_THEMES.slice(4);

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

          {/* Top controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* Theme selector — 4 / 3 grid */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "4px",
              }}
            >
              {[row1, row2].map((row, ri) => (
                <div key={ri} style={{ display: "flex", gap: "3px", justifyContent: "center" }}>
                  {row.map((th) => (
                    <button
                      key={th.key}
                      onClick={() => setFrame(th.key)}
                      style={{
                        padding: "5px 9px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.6rem",
                        fontWeight: frame === th.key ? 600 : 400,
                        backgroundColor: frame === th.key ? "rgba(255,255,255,0.95)" : "transparent",
                        color: frame === th.key ? "#333" : "rgba(255,255,255,0.6)",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        whiteSpace: "nowrap",
                      }}
                      title={th.label}
                    >
                      <span style={{ fontSize: "0.7rem" }}>{th.icon}</span>
                      {th.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

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

              {/* ===== Y2K decorations ===== */}
              {frame === "y2k" && (
                <>
                  {/* Corner stars */}
                  <div style={{ position: "absolute", top: "8px", left: "12px", fontSize: "0.9rem", zIndex: 5, pointerEvents: "none", filter: "drop-shadow(0 0 4px rgba(255,105,180,0.8))" }}>
                    {"✦"}
                  </div>
                  <div style={{ position: "absolute", top: "8px", right: "12px", fontSize: "0.7rem", zIndex: 5, pointerEvents: "none", filter: "drop-shadow(0 0 4px rgba(0,191,255,0.8))" }}>
                    {"★"}
                  </div>
                  <div style={{ position: "absolute", bottom: "8px", left: "12px", fontSize: "0.7rem", zIndex: 5, pointerEvents: "none", filter: "drop-shadow(0 0 4px rgba(0,191,255,0.8))" }}>
                    {"★"}
                  </div>
                  <div style={{ position: "absolute", bottom: "8px", right: "12px", fontSize: "0.9rem", zIndex: 5, pointerEvents: "none", filter: "drop-shadow(0 0 4px rgba(255,105,180,0.8))" }}>
                    {"✦"}
                  </div>
                  {/* Neon border glow line inner */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "3px",
                      borderRadius: "17px",
                      border: "1px solid rgba(0,191,255,0.3)",
                      zIndex: 5,
                      pointerEvents: "none",
                      boxShadow: "inset 0 0 15px rgba(255,105,180,0.12), inset 0 0 30px rgba(0,191,255,0.08)",
                    }}
                  />
                  {/* Butterfly/heart floaters */}
                  {Y2K_SPARKLES.map((sparkle, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        opacity: [0.2, 0.9, 0.2],
                        scale: [0.6, 1.3, 0.6],
                        filter: [
                          `drop-shadow(0 0 2px ${sparkle.color})`,
                          `drop-shadow(0 0 8px ${sparkle.color})`,
                          `drop-shadow(0 0 2px ${sparkle.color})`,
                        ],
                      }}
                      transition={{
                        duration: 1.6 + (i % 3) * 0.4,
                        delay: sparkle.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{
                        position: "absolute",
                        top: sparkle.top,
                        left: sparkle.left,
                        width: `${sparkle.size}px`,
                        height: `${sparkle.size}px`,
                        borderRadius: "9999px",
                        backgroundColor: sparkle.color,
                        zIndex: 5,
                        pointerEvents: "none",
                      }}
                    />
                  ))}
                </>
              )}

              {/* ===== Vintage ornate frame decoration ===== */}
              {frame === "vintage" && (
                <>
                  {/* Outer gold shimmer border */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "0px",
                      borderRadius: "4px",
                      border: "1px solid rgba(212,175,110,0.15)",
                      zIndex: 5,
                      pointerEvents: "none",
                      boxShadow: "inset 0 0 40px rgba(212,175,110,0.06)",
                    }}
                  />
                  {/* Primary gold inner frame */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "6px",
                      border: "2px solid rgba(212,175,110,0.55)",
                      borderRadius: "3px",
                      zIndex: 5,
                      pointerEvents: "none",
                      boxShadow: "0 0 12px rgba(212,175,110,0.15), inset 0 0 12px rgba(212,175,110,0.08)",
                    }}
                  />
                  {/* Secondary thin inner line */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "10px",
                      border: "1px solid rgba(212,175,110,0.25)",
                      borderRadius: "2px",
                      zIndex: 5,
                      pointerEvents: "none",
                    }}
                  />
                  {/* Decorative third line */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "14px",
                      border: "1px solid rgba(212,175,110,0.12)",
                      borderRadius: "1px",
                      zIndex: 5,
                      pointerEvents: "none",
                    }}
                  />
                  {/* Corner ornaments — larger, more decorative L-brackets with inner flourish */}
                  {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => {
                    const isTop = corner.includes("top");
                    const isLeft = corner.includes("left");
                    return (
                      <div key={corner}>
                        {/* Outer L bracket */}
                        <div
                          style={{
                            position: "absolute",
                            [isTop ? "top" : "bottom"]: "4px",
                            [isLeft ? "left" : "right"]: "4px",
                            width: "28px",
                            height: "28px",
                            zIndex: 6,
                            pointerEvents: "none",
                            borderColor: "rgba(212,175,110,0.7)",
                            borderStyle: "solid",
                            borderWidth: "0",
                            ...(isTop && isLeft ? { borderTopWidth: "2px", borderLeftWidth: "2px" } : {}),
                            ...(isTop && !isLeft ? { borderTopWidth: "2px", borderRightWidth: "2px" } : {}),
                            ...(!isTop && isLeft ? { borderBottomWidth: "2px", borderLeftWidth: "2px" } : {}),
                            ...(!isTop && !isLeft ? { borderBottomWidth: "2px", borderRightWidth: "2px" } : {}),
                          }}
                        />
                        {/* Inner small L bracket */}
                        <div
                          style={{
                            position: "absolute",
                            [isTop ? "top" : "bottom"]: "8px",
                            [isLeft ? "left" : "right"]: "8px",
                            width: "14px",
                            height: "14px",
                            zIndex: 6,
                            pointerEvents: "none",
                            borderColor: "rgba(212,175,110,0.4)",
                            borderStyle: "solid",
                            borderWidth: "0",
                            ...(isTop && isLeft ? { borderTopWidth: "1px", borderLeftWidth: "1px" } : {}),
                            ...(isTop && !isLeft ? { borderTopWidth: "1px", borderRightWidth: "1px" } : {}),
                            ...(!isTop && isLeft ? { borderBottomWidth: "1px", borderLeftWidth: "1px" } : {}),
                            ...(!isTop && !isLeft ? { borderBottomWidth: "1px", borderRightWidth: "1px" } : {}),
                          }}
                        />
                        {/* Diamond accent at corner */}
                        <div
                          style={{
                            position: "absolute",
                            [isTop ? "top" : "bottom"]: "2px",
                            [isLeft ? "left" : "right"]: "2px",
                            width: "6px",
                            height: "6px",
                            backgroundColor: "rgba(212,175,110,0.5)",
                            transform: "rotate(45deg)",
                            zIndex: 7,
                            pointerEvents: "none",
                            boxShadow: "0 0 6px rgba(212,175,110,0.4)",
                          }}
                        />
                      </div>
                    );
                  })}
                  {/* Top center ornament — fleur motif */}
                  <div
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      zIndex: 6,
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ width: "20px", height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,110,0.5))" }} />
                    <div style={{ fontSize: "0.55rem", color: "rgba(212,175,110,0.6)", filter: "drop-shadow(0 0 3px rgba(212,175,110,0.3))" }}>{"✦"}</div>
                    <div style={{ width: "20px", height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,110,0.5))" }} />
                  </div>
                  {/* Bottom center ornament */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "3px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      zIndex: 6,
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ width: "20px", height: "1px", background: "linear-gradient(to right, transparent, rgba(212,175,110,0.5))" }} />
                    <div style={{ fontSize: "0.55rem", color: "rgba(212,175,110,0.6)", filter: "drop-shadow(0 0 3px rgba(212,175,110,0.3))" }}>{"✦"}</div>
                    <div style={{ width: "20px", height: "1px", background: "linear-gradient(to left, transparent, rgba(212,175,110,0.5))" }} />
                  </div>
                  {/* Subtle velvet texture overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 4,
                      pointerEvents: "none",
                      borderRadius: "4px",
                      background: "radial-gradient(ellipse at center, rgba(120,60,90,0.08) 0%, transparent 70%)",
                      mixBlendMode: "overlay",
                    }}
                  />
                  {/* Gold shimmer accent on edges */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 4,
                      pointerEvents: "none",
                      borderRadius: "4px",
                      background: "linear-gradient(135deg, rgba(212,175,110,0.08) 0%, transparent 30%, transparent 70%, rgba(212,175,110,0.05) 100%)",
                    }}
                  />
                </>
              )}

              {/* ===== Ticket — movie ticket style ===== */}
              {frame === "ticket" && (
                <>
                  {/* Left side notch (tear) */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "20px",
                      height: "20px",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(0,0,0,0.7)",
                      zIndex: 6,
                      pointerEvents: "none",
                    }}
                  />
                  {/* Right side notch (tear) */}
                  <div
                    style={{
                      position: "absolute",
                      right: "-10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "20px",
                      height: "20px",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(0,0,0,0.7)",
                      zIndex: 6,
                      pointerEvents: "none",
                    }}
                  />
                  {/* Vertical dashed tear line */}
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      right: "0",
                      top: "50%",
                      borderTop: "2px dashed rgba(255,255,255,0.12)",
                      zIndex: 5,
                      pointerEvents: "none",
                    }}
                  />
                  {/* Header bar — cinema style */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      padding: "10px 16px 8px 16px",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      zIndex: 4,
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span style={{ fontSize: "0.5rem", fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
                      {"🎬"} VibeTube Cinema
                    </span>
                    <span style={{ fontSize: "0.45rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em", fontFamily: "monospace" }}>
                      NO. {String(Math.abs(result.vibe.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 9999)).padStart(4, "0")}
                    </span>
                  </div>
                </>
              )}

              {/* Photo container */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  paddingTop,
                  borderRadius: getImageRadius(),
                }}
              >
                {/* Layer 1: Image + gradient */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    borderRadius: getImageRadius(),
                    backgroundImage: `url(${previewUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* Gradient overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: isLandscape
                        ? "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 40%, transparent 65%)"
                        : "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 32%, transparent 58%)",
                    }}
                  />

                  {/* Y2K chromatic gradient */}
                  {frame === "y2k" && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(135deg, rgba(255,105,180,0.2) 0%, transparent 35%, rgba(0,191,255,0.2) 65%, rgba(180,0,255,0.15) 100%)",
                          mixBlendMode: "screen",
                        }}
                      />
                      {/* Sparkle dots */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
                          backgroundSize: "24px 24px",
                          opacity: 0.3,
                          mixBlendMode: "overlay",
                        }}
                      />
                    </>
                  )}

                  {/* Vintage sepia tint */}
                  {frame === "vintage" && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(to bottom, rgba(184,156,110,0.15) 0%, rgba(80,40,60,0.12) 50%, rgba(100,80,60,0.18) 100%)",
                          mixBlendMode: "overlay",
                        }}
                      />
                      {/* Warm vignette */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "radial-gradient(ellipse at center, transparent 40%, rgba(15,8,18,0.4) 100%)",
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Layer 2: Badge at TOP */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: isLandscape ? "16px 20px" : "16px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      lineHeight: "1.2",
                      color: "#ffffff",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase" as const,
                      textShadow: frame === "y2k"
                        ? "0 0 12px rgba(255,105,180,0.8), 0 2px 8px rgba(0,0,0,0.6)"
                        : "0 2px 8px rgba(0,0,0,0.6)",
                      whiteSpace: "nowrap" as const,
                      textAlign: "center" as const,
                    }}
                  >
                    <Sparkles style={{ width: "13px", height: "13px", flexShrink: 0, color: "#fff", filter: frame === "y2k" ? "drop-shadow(0 0 4px rgba(255,105,180,0.6))" : "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
                    <span>{result.emoji} {result.vibe}</span>
                  </div>
                </div>

                {/* Layer 3: Song info + Player UI at BOTTOM */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: isLandscape ? "20px 24px 16px 24px" : "24px 20px 18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    zIndex: 3,
                  }}
                >
                  {/* Song title + artist */}
                  <div style={{ textAlign: "center", width: "100%", padding: "0 4px" }}>
                    <p
                      style={{
                        color: "#ffffff",
                        fontWeight: 600,
                        fontSize: isLandscape ? "1rem" : "0.9rem",
                        lineHeight: "1.35",
                        margin: 0,
                        wordBreak: "break-word" as const,
                        ...(frame === "y2k" ? { textShadow: "0 0 8px rgba(255,105,180,0.5)" } : {}),
                      }}
                    >
                      {result.songTitle}
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: isLandscape ? "0.78rem" : "0.72rem",
                        lineHeight: "1.35",
                        margin: "4px 0 0 0",
                        wordBreak: "break-word" as const,
                      }}
                    >
                      {result.artist}
                    </p>
                  </div>

                  {/* Player UI */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {/* Progress bar */}
                    <div
                      style={{
                        width: "100%",
                        height: "3px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: "2px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: "65%",
                          height: "100%",
                          backgroundColor: frame === "y2k"
                            ? "rgba(255,105,180,0.9)"
                            : "#ffffff",
                          borderRadius: "2px",
                          ...(frame === "y2k" ? { boxShadow: "0 0 6px rgba(255,105,180,0.5)" } : {}),
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "65%",
                          transform: "translate(-50%, -50%)",
                          width: "9px",
                          height: "9px",
                          borderRadius: "9999px",
                          backgroundColor: frame === "y2k" ? "#ff69b4" : "#ffffff",
                          boxShadow: frame === "y2k"
                            ? "0 0 8px rgba(255,105,180,0.8)"
                            : "0 0 4px rgba(0,0,0,0.3)",
                        }}
                      />
                    </div>

                    {/* Playback controls */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 8px",
                      }}
                    >
                      <ListMusic style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.5)" }} />
                      <SkipBack style={{ width: "15px", height: "15px", color: "#fff", fill: "#fff" }} />
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "9999px",
                          backgroundColor: frame === "y2k" ? "rgba(255,105,180,0.9)" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: frame === "y2k"
                            ? "0 0 16px rgba(255,105,180,0.6), 0 2px 8px rgba(0,0,0,0.2)"
                            : "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                      >
                        <Pause style={{ width: "16px", height: "16px", color: frame === "y2k" ? "#fff" : "#000", fill: frame === "y2k" ? "#fff" : "#000" }} />
                      </div>
                      <SkipForward style={{ width: "15px", height: "15px", color: "#fff", fill: "#fff" }} />
                      <Heart style={{ width: "15px", height: "15px", color: "rgba(255,255,255,0.5)" }} />
                    </div>
                  </div>

                  {/* Watermark */}
                  <div style={{ width: "100%", textAlign: "right" }}>
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

              {/* Ticket bottom stub */}
              {frame === "ticket" && (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    padding: "8px 16px 10px 16px",
                    background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.04) 100%)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    zIndex: 4,
                  }}
                >
                  <span style={{ fontSize: "0.42rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", fontFamily: "monospace" }}>
                    SCREEN 01 · SEAT A12
                  </span>
                  <span style={{ fontSize: "0.42rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em", fontFamily: "monospace" }}>
                    vibetube.vercel.app
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons: Download + X + Threads */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: "center",
            }}
          >
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
              <span style={{ fontSize: "1rem", fontWeight: 700 }}>{"\u{1D54F}"}</span>
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