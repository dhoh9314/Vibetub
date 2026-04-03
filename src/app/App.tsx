import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Disc3, Music, Coffee, X } from "lucide-react";
import { ImageUploader } from "./components/ImageUploader";
import { ResultDisplay, type VibeResult } from "./components/ResultDisplay";
import { analyzeVibe } from "./components/vibeData";
import { I18nProvider, useI18n } from "./components/i18n";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

function VibeTubeApp() {
  const { t } = useI18n();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VibeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const handleImageUpload = useCallback(async (file: File, url: string) => {
    setPreviewUrl(url);
    setResult(null);
    setError(null);
    setIsAnalyzing(true);

    try {
      const vibeResult = await analyzeVibe(file);
      setResult(vibeResult);
    } catch (err) {
      console.error("Failed to analyze vibe:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, [previewUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full border-b border-border/60 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center gap-2.5 relative">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.reload();
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Disc3 className="w-7 h-7 text-violet-600" />
            </motion.div>
            <h1 className="text-foreground tracking-tight" style={{ fontFamily: "'SlowGothic', sans-serif" }}>
              {t("headerTitle")}<span className="text-violet-600">{t("headerHighlight")}</span>
            </h1>
          </a>
          <div className="absolute right-6">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6"
        >
          <h2 className="text-foreground mb-2 flex items-center justify-center gap-2" style={{ fontFamily: "'SlowGothic', sans-serif" }}>
            <Music className="w-5 h-5 text-violet-500" />
            {t("heroTitle")}
            <Music className="w-5 h-5 text-violet-500" />
          </h2>
          {/* description removed */}
        </motion.div>

        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-2xl border border-border/60 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span
                className="text-gray-500"
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("uploadLabel")}
              </span>
            </div>
            <ImageUploader
              onImageUpload={handleImageUpload}
              onClear={handleClear}
              previewUrl={previewUrl}
              isAnalyzing={isAnalyzing}
            />
          </motion.div>

          {/* Result Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl border border-border/60 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-pink-500" />
              <span
                className="text-gray-500"
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("resultLabel")}
              </span>
            </div>
            <ResultDisplay
              result={result}
              isAnalyzing={isAnalyzing}
              error={error}
              onTryAgain={handleClear}
              previewUrl={previewUrl}
            />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/30 bg-white/40">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-center gap-3">
          <p className="text-gray-300" style={{ fontSize: "0.75rem" }}>
            {t("footer")}
          </p>
          <button
            onClick={() => setShowQr(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-violet-200 hover:border-violet-400 bg-violet-50 hover:bg-violet-100 text-violet-600 transition-all duration-200 cursor-pointer"
            style={{ fontSize: "0.7rem", fontWeight: 500 }}
          >
            <Coffee className="w-3.5 h-3.5" />
            커피 한 잔만 사주실래요?
          </button>
        </div>
      </footer>

      {/* QR Code Popup */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowQr(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-4 max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQr(false)}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <Coffee className="w-8 h-8 text-violet-500" />
              <p className="text-gray-700 font-semibold text-sm text-center">
                커피 한 잔의 후원이 큰 힘이 됩니다!
              </p>
              <img
                src={bmacQrImage}
                alt="Buy Me a Coffee QR Code"
                className="w-48 h-48 rounded-lg"
              />
              <a
                href="https://buymeacoffee.com/dawn53"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold transition-colors"
              >
                <Coffee className="w-3.5 h-3.5" />
                Buy Me a Coffee
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <VibeTubeApp />
    </I18nProvider>
  );
}