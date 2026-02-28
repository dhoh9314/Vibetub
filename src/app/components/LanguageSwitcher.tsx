import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useI18n, localeNames, localeFlags, type Locale } from "./i18n";

const locales: Locale[] = ["en", "ko", "ja", "zh", "es", "fr", "de", "pt"];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
        style={{ fontSize: "0.8125rem" }}
      >
        <Globe className="w-4 h-4" />
        <span>{localeFlags[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-50 min-w-[160px]">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-gray-50 transition-colors ${
                l === locale ? "bg-violet-50 text-violet-700" : "text-gray-600"
              }`}
              style={{ fontSize: "0.8125rem" }}
            >
              <span style={{ fontSize: "1rem" }}>{localeFlags[l]}</span>
              <span>{localeNames[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
