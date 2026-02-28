import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Disc3 } from "lucide-react";
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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Disc3 className="w-7 h-7 text-violet-600" />
          </motion.div>
          <h1 className="text-foreground tracking-tight" style={{ fontFamily: "'SlowGothic', sans-serif" }}>
            {t("headerTitle")}<span className="text-violet-600">{t("headerHighlight")}</span>
          </h1>
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
          <h2 className="text-foreground mb-2" style={{ fontFamily: "'SlowGothic', sans-serif" }}>
            {t("heroTitle")}
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
            />
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/60 bg-white/60">
        <div className="max-w-5xl mx-auto px-6 py-5 text-center">
          <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
            {t("footer")}
          </p>
        </div>
      </footer>
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