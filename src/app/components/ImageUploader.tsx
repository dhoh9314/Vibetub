import { useState, useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "./i18n";

interface ImageUploaderProps {
  onImageUpload: (file: File, previewUrl: string) => void;
  onClear: () => void;
  previewUrl: string | null;
  isAnalyzing: boolean;
}

export function ImageUploader({
  onImageUpload,
  onClear,
  previewUrl,
  isAnalyzing,
}: ImageUploaderProps) {
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      onImageUpload(file, url);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!previewUrl ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-12
              flex flex-col items-center justify-center gap-4 transition-all duration-200
              min-h-[280px]
              ${
                isDragging
                  ? "border-violet-500 bg-violet-50"
                  : "border-gray-300 bg-gray-50/50 hover:border-violet-400 hover:bg-violet-50/50"
              }
            `}
          >
            <div
              className={`rounded-full p-4 transition-colors ${
                isDragging ? "bg-violet-100" : "bg-gray-100"
              }`}
            >
              <Upload
                className={`w-8 h-8 ${
                  isDragging ? "text-violet-500" : "text-gray-400"
                }`}
              />
            </div>
            <div className="text-center">
              <p className="text-gray-700">
                {t("dropText")}{" "}
                <span className="text-violet-600 underline underline-offset-2">
                  {t("browse")}
                </span>
              </p>
              <p className="text-gray-400 mt-1" style={{ fontSize: "0.875rem" }}>
                {t("fileTypes")}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-2xl overflow-hidden bg-gray-100 min-h-[280px] flex items-center justify-center"
          >
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className="w-full h-full max-h-[400px] object-contain"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full"
                  />
                  <p className="text-white" style={{ fontSize: "0.875rem" }}>
                    {t("analyzingOverlay")}
                  </p>
                </div>
              </div>
            )}
            {!isAnalyzing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
