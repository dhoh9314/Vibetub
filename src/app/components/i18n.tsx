import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "en" | "ko" | "ja" | "zh" | "es" | "fr" | "de" | "pt";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    headerTitle: "Vibe",
    headerHighlight: "Tube",
    heroTitle: "Discover Your Theme Song",
    heroDesc: "Upload any photo and AI will read its vibe to find the perfect matching song. Every image has a soundtrack — what's yours?",
    uploadLabel: "Upload",
    resultLabel: "Your Theme Song",
    dropText: "Drop your image here, or",
    browse: "browse",
    fileTypes: "PNG, JPG, GIF, WEBP up to 10MB",
    analyzingOverlay: "Finding your song...",
    analyzingTitle: "Finding your theme song...",
    analyzingDesc: "",
    emptyTitle: "What's Your Theme Song?",
    emptyDesc: "Upload an image and AI will analyze its vibe to find the perfect matching theme song for you.",
    errorTitle: "Something went wrong",
    tryAgain: "Try Again",
    by: "by",
    footer: "Code with ❤️ · Made by Dawn",
    videoUnavailable: "Couldn't embed video directly",
    watchOnYoutube: "Watch on YouTube",
    tryAgainAction: "Try Another Photo",
    makeCard: "Make Card",
    cardDownload: "Save Card",
    cardGenerating: "Generating...",
    cardCopy: "Copy",
    cardCopied: "Copied!",
    cardShare: "Share",
  },
  ko: {
    headerTitle: "Vibe",
    headerHighlight: "Tube",
    heroTitle: "당신의 테마송을 찾아보세요",
    heroDesc: "사진을 업로드하면 AI가 분위기를 분석해 어울리는 노래를 추천해드려요. 모든 이미지에는 사운드트랙이 있어요 — 당신의 것은?",
    uploadLabel: "업로드",
    resultLabel: "당신의 테마송",
    dropText: "이미지를 여기에 드롭하거나,",
    browse: "찾아보기",
    fileTypes: "PNG, JPG, GIF, WEBP 최대 10MB",
    analyzingOverlay: "테마송을 찾는 중...",
    analyzingTitle: "당신의 테마송을 찾는 중...",
    analyzingDesc: "",
    emptyTitle: "당신의 테마송은?",
    emptyDesc: "이미지를 업로드하면 AI가 분위기를 분석해 완벽한 테마송을 찾아드려요.",
    errorTitle: "문제가 발생했어요",
    tryAgain: "다시 시도",
    by: "by",
    footer: "❤️를 담아 코딩 · Made by Dawn",
    videoUnavailable: "영상을 직접 임베드할 수 없습니다",
    watchOnYoutube: "YouTube에서 보기",
    tryAgainAction: "다른 사진으로 도전",
    makeCard: "카드 만들기",
    cardDownload: "카드 저장",
    cardGenerating: "생성 중...",
    cardCopy: "복사",
    cardCopied: "복사됨!",
    cardShare: "공유",
  },
  ja: {
    headerTitle: "Vibe",
    headerHighlight: "Tube",
    heroTitle: "あなたのテーマソングを見つけよう",
    heroDesc: "写真をアップロードすると、AIが雰囲気を分析してぴったりの曲をおすすめします。すべての画像にサウンドトラックがあります — あなたのは？",
    uploadLabel: "アップロード",
    resultLabel: "あなたのテーマソング",
    dropText: "画像をここにドロップ、または",
    browse: "参照",
    fileTypes: "PNG, JPG, GIF, WEBP 最大10MB",
    analyzingOverlay: "テーマソングを探しています...",
    analyzingTitle: "あなたのテーマソングを探しています...",
    analyzingDesc: "",
    emptyTitle: "あなたのテーマソングは？",
    emptyDesc: "画像をアップロ드すると、AIが雰囲気を分析して完璧なテーマソングを見つけます。",
    errorTitle: "エラーが発生しました",
    tryAgain: "もう一度",
    by: "by",
    footer: "❤️を込めてコーディング · Made by Dawn",
    videoUnavailable: "動画を直接埋め込めませんでした",
    watchOnYoutube: "YouTubeで見る",
    tryAgainAction: "別の写真で試す",
    makeCard: "カードを作る",
    cardDownload: "カードを保存",
    cardGenerating: "生成中...",
    cardCopy: "コピー",
    cardCopied: "コピー済み!",
    cardShare: "共有",
  },
  zh: {
    headerTitle: "Vibe",
    headerHighlight: "Tube",
    heroTitle: "发现你的主题曲",
    heroDesc: "上传任意照片，AI将分析其氛围，为你找到完美匹配的歌曲。每张图片都有专属配乐 — 你的是什么？",
    uploadLabel: "上传",
    resultLabel: "你的主题曲",
    dropText: "将图片拖放到此处，或",
    browse: "浏览",
    fileTypes: "PNG, JPG, GIF, WEBP 最大10MB",
    analyzingOverlay: "正在寻找你的主题曲...",
    analyzingTitle: "正在寻找你的主题曲...",
    analyzingDesc: "",
    emptyTitle: "你的主题曲是什么？",
    emptyDesc: "上传图片，AI将分析其氛围，为你找到完美的主题曲。",
    errorTitle: "出了点问题",
    tryAgain: "重试",
    by: "by",
    footer: "用 ❤️ 编码 · Made by Dawn",
    videoUnavailable: "无法直接嵌入视频",
    watchOnYoutube: "在YouTube上观看",
    tryAgainAction: "换张照片试试",
    makeCard: "制作卡片",
    cardDownload: "保存卡片",
    cardGenerating: "生成中...",
    cardCopy: "复制",
    cardCopied: "已复制!",
    cardShare: "分享",
  },
  es: {
    headerTitle: "Vibe",
    headerHighlight: "Tube",
    heroTitle: "Descubre tu canción temática",
    heroDesc: "Sube cualquier foto y la IA leerá su vibra para encontrar la canción perfecta. Cada imagen tiene una banda sonora — ¿cuál es la tuya?",
    uploadLabel: "Subir",
    resultLabel: "Tu canción temática",
    dropText: "Arrastra tu imagen aquí, o",
    browse: "explora",
    fileTypes: "PNG, JPG, GIF, WEBP hasta 10MB",
    analyzingOverlay: "Buscando tu canción...",
    analyzingTitle: "Buscando tu canción temática...",
    analyzingDesc: "",
    emptyTitle: "¿Cuál es tu canción temática?",
    emptyDesc: "Sube una imagen y la IA analizará su vibra para encontrar la canción temática perfecta.",
    errorTitle: "Algo salió mal",
    tryAgain: "Intentar de nuevo",
    by: "por",
    footer: "Hecho con ❤️ · Made by Dawn",
    videoUnavailable: "No se pudo incrustar el video directamente",
    watchOnYoutube: "Ver en YouTube",
    tryAgainAction: "Probar otra foto",
    makeCard: "Crear tarjeta",
    cardDownload: "Guardar tarjeta",
    cardGenerating: "Generando...",
    cardCopy: "Copiar",
    cardCopied: "Copiado!",
    cardShare: "Compartir",
  },
  fr: {
    headerTitle: "Vibe",
    headerHighlight: "Tube",
    heroTitle: "Découvrez votre chanson thème",
    heroDesc: "Téléchargez une photo et l'IA analysera son ambiance pour trouver la chanson parfaite. Chaque image a une bande sonore — quelle est la vôtre ?",
    uploadLabel: "Télécharger",
    resultLabel: "Votre chanson thème",
    dropText: "Déposez votre image ici, ou",
    browse: "parcourir",
    fileTypes: "PNG, JPG, GIF, WEBP jusqu'à 10 Mo",
    analyzingOverlay: "Recherche de votre chanson...",
    analyzingTitle: "Recherche de votre chanson thème...",
    analyzingDesc: "",
    emptyTitle: "Quelle est votre chanson thème ?",
    emptyDesc: "Téléchargez une image et l'IA analysera son ambiance pour trouver la chanson thème parfaite.",
    errorTitle: "Quelque chose s'est mal passé",
    tryAgain: "Réessayer",
    by: "par",
    footer: "Codé avec ❤️ · Made by Dawn",
    videoUnavailable: "Impossible d'intégrer la vidéo directement",
    watchOnYoutube: "Regarder sur YouTube",
    tryAgainAction: "Essayer une autre photo",
    makeCard: "Créer une carte",
    cardDownload: "Enregistrer",
    cardGenerating: "Génération...",
    cardCopy: "Copier",
    cardCopied: "Copié!",
    cardShare: "Partager",
  },
  de: {
    headerTitle: "Vibe",
    headerHighlight: "Tube",
    heroTitle: "Entdecke deinen Titelsong",
    heroDesc: "Lade ein Foto hoch und die KI wird seine Stimmung lesen, um den perfekten Song zu finden. Jedes Bild hat einen Soundtrack — was ist deiner?",
    uploadLabel: "Hochladen",
    resultLabel: "Dein Titelsong",
    dropText: "Bild hier ablegen, oder",
    browse: "durchsuchen",
    fileTypes: "PNG, JPG, GIF, WEBP bis zu 10 MB",
    analyzingOverlay: "Dein Song wird gesucht...",
    analyzingTitle: "Dein Titelsong wird gesucht...",
    analyzingDesc: "",
    emptyTitle: "Was ist dein Titelsong?",
    emptyDesc: "Lade ein Bild hoch und die KI analysiert seine Stimmung, um den perfekten Titelsong zu finden.",
    errorTitle: "Etwas ist schiefgelaufen",
    tryAgain: "Nochmal versuchen",
    by: "von",
    footer: "Mit ❤️ programmiert · Made by Dawn",
    videoUnavailable: "Video konnte nicht direkt eingebettet werden",
    watchOnYoutube: "Auf YouTube ansehen",
    tryAgainAction: "Anderes Foto probieren",
    makeCard: "Karte erstellen",
    cardDownload: "Karte speichern",
    cardGenerating: "Wird erstellt...",
    cardCopy: "Kopieren",
    cardCopied: "Kopiert!",
    cardShare: "Teilen",
  },
  pt: {
    headerTitle: "Vibe",
    headerHighlight: "Tube",
    heroTitle: "Descubra sua música tema",
    heroDesc: "Envie qualquer foto e a IA vai ler sua vibe para encontrar a música perfeita. Toda imagem tem uma trilha sonora — qual é a sua?",
    uploadLabel: "Enviar",
    resultLabel: "Sua música tema",
    dropText: "Solte sua imagem aqui, ou",
    browse: "procure",
    fileTypes: "PNG, JPG, GIF, WEBP até 10MB",
    analyzingOverlay: "Procurando sua música...",
    analyzingTitle: "Procurando sua música tema...",
    analyzingDesc: "",
    emptyTitle: "Qual é sua música tema?",
    emptyDesc: "Envie uma imagem e a IA vai analisar sua vibe para encontrar a música tema perfeita.",
    errorTitle: "Algo deu errado",
    tryAgain: "Tentar novamente",
    by: "por",
    footer: "Feito com ❤️ · Made by Dawn",
    videoUnavailable: "Não foi possível incorporar o vídeo diretamente",
    watchOnYoutube: "Assistir no YouTube",
    tryAgainAction: "Tentar outra foto",
    makeCard: "Criar cartão",
    cardDownload: "Salvar cartão",
    cardGenerating: "Gerando...",
    cardCopy: "Copiar",
    cardCopied: "Copiado!",
    cardShare: "Compartilhar",
  },
};

export const localeNames: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  ko: "🇰🇷",
  ja: "🇯🇵",
  zh: "🇨🇳",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  pt: "🇧🇷",
};

function detectLocale(): Locale {
  const lang = navigator.language?.toLowerCase() || "en";
  if (lang.startsWith("ko")) return "ko";
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("pt")) return "pt";
  return "en";
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string) => translations[locale]?.[key] || translations.en[key] || key,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}