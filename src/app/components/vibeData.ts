import { projectId, publicAnonKey } from "/utils/supabase/info";
import type { VibeResult } from "./ResultDisplay";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8d7c61d9`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeVibe(file: File): Promise<VibeResult> {
  const imageBase64 = await fileToBase64(file);

  const response = await fetch(`${API_BASE}/analyze-vibe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Analyze vibe API error:", errorData);
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.result) {
    console.error("Unexpected API response:", data);
    throw new Error("Unexpected response from server");
  }

  const r = data.result;

  // Debug: Log YouTube ID and debug info
  console.log("Analysis result:", {
    songTitle: r.songTitle,
    artist: r.artist,
    youtubeId: r.youtubeId,
    hasVideo: !!r.youtubeId,
    youtubeDebug: r.youtubeDebug || "no debug info",
  });

  return {
    vibe: r.vibe,
    songTitle: r.songTitle,
    artist: r.artist,
    emoji: r.emoji,
    color: r.color,
    description: r.description,
    youtubeId: r.youtubeId || null,
    youtubeSearchQuery: r.youtubeSearchQuery || `${r.artist} ${r.songTitle}`,
    youtubeDebug: r.youtubeDebug || undefined,
  };
}