import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Music, Disc3, Sparkles, RotateCcw, AlertCircle, ExternalLink, Play } from "lucide-react";
import { useI18n } from "./i18n";

export interface VibeResult {
  vibe: string;
  songTitle: string;
  artist: string;
  emoji: string;
  color: string;
  description: string;
  youtubeId: string | null;
  youtubeSearchQuery: string;
}

interface ResultDisplayProps {
  result: VibeResult | null;
  isAnalyzing: boolean;
  error: string | null;
  onTryAgain: () => void;
}

export function ResultDisplay({ result, isAnalyzing, error, onTryAgain }: ResultDisplayProps) {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  // Reset playing state when result changes
  useEffect(() => {
    // Auto-play when video is available
    if (result?.youtubeId) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
    setThumbnailError(false);
    setEmbedError(false);
  }, [result?.youtubeId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center px-4">
        <div className="rounded-full bg-red-50 p-4 mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-gray-700 mb-1">{t("errorTitle")}</h3>
        <p className="text-gray-400 max-w-xs mb-4" style={{ fontSize: "0.875rem" }}>
          {error}
        </p>
        <button
          onClick={onTryAgain}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
          style={{ fontSize: "0.875rem" }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t("tryAgain")}
        </button>
      </div>
    );
  }

  if (!result && !isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center px-4">
        <div className="rounded-full bg-gray-100 p-5 mb-4">
          <Music className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-gray-700 mb-1">{t("emptyTitle")}</h3>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Disc3 className="w-12 h-12 text-violet-500" />
        </motion.div>
        <h3 className="text-gray-700 mb-1">{t("analyzingTitle")}</h3>
        {t("analyzingDesc") && (
          <p className="text-gray-400" style={{ fontSize: "0.875rem" }}>
            {t("analyzingDesc")}
          </p>
        )}
      </div>
    );
  }

  if (!result) return null;

  const hasVideo = !!result.youtubeId;
  const embedSrc = hasVideo
    ? `https://www.youtube-nocookie.com/embed/${result.youtubeId}?autoplay=1&rel=0&enablejsapi=1`
    : null;
  const youtubeWatchUrl = hasVideo
    ? `https://www.youtube.com/watch?v=${result.youtubeId}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(result.youtubeSearchQuery)}`;
  const thumbnailUrl = hasVideo
    ? `https://img.youtube.com/vi/${result.youtubeId}/hqdefault.jpg`
    : null;

  // Debug: Log video info
  console.log("🎬 Video display info:", {
    hasVideo,
    youtubeId: result.youtubeId,
    thumbnailUrl,
    embedSrc,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center"
    >
      {/* Vibe badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="flex items-center gap-2 mb-4"
      >
        <span style={{ fontSize: "1.75rem" }}>{result.emoji}</span>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: result.color }} />
          <span
            className="px-3 py-1 rounded-full font-medium"
            style={{
              fontSize: "0.75rem",
              backgroundColor: result.color + "18",
              color: result.color,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {result.vibe}
          </span>
          <Sparkles className="w-3.5 h-3.5" style={{ color: result.color }} />
        </div>
      </motion.div>

      {/* Song info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2"
      >
        <h2 className="text-gray-900 mb-0.5">🎵 {result.songTitle}</h2>
        <p className="text-gray-500" style={{ fontSize: "0.875rem" }}>
          {t("by")} {result.artist}
        </p>
      </motion.div>

      {/* YouTube Player - click-to-play with thumbnail */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-full rounded-xl overflow-hidden mb-4"
        style={{ aspectRatio: "16 / 9" }}
      >
        {isPlaying && embedSrc && !embedError ? (
          <iframe
            src={embedSrc}
            title={`${result.songTitle} by ${result.artist}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
            onError={() => setEmbedError(true)}
          />
        ) : hasVideo && thumbnailUrl && !thumbnailError && !embedError ? (
          <div
            onClick={() => setIsPlaying(true)}
            className="group relative w-full h-full bg-gray-900 cursor-pointer"
          >
            <img
              src={thumbnailUrl}
              alt={`${result.songTitle} by ${result.artist}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setThumbnailError(true)}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-red-600 group-hover:bg-red-700 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110">
                <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
              </div>
            </div>
          </div>
        ) : (
          <a
            href={youtubeWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer hover:from-gray-700 hover:to-gray-800 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-red-600 group-hover:bg-red-700 flex items-center justify-center shadow-lg mb-3 transition-all duration-200 group-hover:scale-110">
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            </div>
            <span className="text-white font-medium text-sm mb-1">
              {result.songTitle} — {result.artist}
            </span>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {embedError ? t("videoUnavailable") + " · " : ""}{t("watchOnYoutube")}
            </span>
          </a>
        )}
      </motion.div>

      {/* Watch on YouTube link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-4"
      >
        <a
          href={youtubeWatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors"
          style={{ fontSize: "0.75rem" }}
        >
          <ExternalLink className="w-3 h-3" />
          {t("watchOnYoutube")}
        </a>
      </motion.div>

      {/* Try Again */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onTryAgain}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          style={{ fontSize: "0.875rem", fontWeight: 500 }}
        >
          <RotateCcw className="w-4 h-4" />
          {t("tryAgainAction")}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}