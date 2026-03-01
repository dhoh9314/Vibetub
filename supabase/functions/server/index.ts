import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-8d7c61d9/health", (c) => {
  return c.json({ status: "ok" });
});

// YouTube cache helpers
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function ytCacheKey(artist: string, songTitle: string): string {
  return `yt_cache:${artist.toLowerCase().trim()}:${songTitle.toLowerCase().trim()}`;
}

async function getYtCache(artist: string, songTitle: string): Promise<string | null | undefined> {
  try {
    const key = ytCacheKey(artist, songTitle);
    const cached = await kv.get(key);
    if (!cached) return undefined; // no cache entry
    // Check TTL
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
      console.log(`YouTube cache expired for "${artist} - ${songTitle}"`);
      return undefined; // expired
    }
    console.log(`YouTube cache HIT for "${artist} - ${songTitle}" -> ${cached.youtubeId}`);
    return cached.youtubeId; // can be null (meaning "we searched but found nothing")
  } catch (err) {
    console.log(`YouTube cache read error: ${err}`);
    return undefined;
  }
}

async function setYtCache(artist: string, songTitle: string, youtubeId: string | null): Promise<void> {
  try {
    const key = ytCacheKey(artist, songTitle);
    await kv.set(key, { youtubeId, cachedAt: Date.now() });
    console.log(`YouTube cache SET for "${artist} - ${songTitle}" -> ${youtubeId}`);
  } catch (err) {
    console.log(`YouTube cache write error (non-fatal): ${err}`);
  }
}

// Analyze image vibe using OpenAI Vision
app.post("/make-server-8d7c61d9/analyze-vibe", async (c) => {
  try {
    const { imageBase64 } = await c.req.json();

    if (!imageBase64) {
      return c.json({ error: "No image data provided" }, 400);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.log("Error: OPENAI_API_KEY not set in environment");
      return c.json({ error: "OpenAI API key not configured on server" }, 500);
    }

    const systemPrompt = `You are a music expert and visual mood analyst. Given an image, analyze its overall vibe — including colors, mood, subject matter, lighting, energy, and atmosphere — then suggest one perfect "theme song" that matches the image's feeling.

You MUST respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "vibe": "short vibe label, 2-4 words",
  "songTitle": "exact official song title",
  "artist": "exact artist name",
  "emoji": "one emoji that represents the vibe",
  "color": "a hex color that matches the vibe (e.g. #f59e0b)",
  "description": "2-3 sentences explaining why this song matches the image's vibe. Be poetic and specific about visual elements you see.",
  "youtubeSearchQuery": "artist name + song title for YouTube search"
}

Guidelines:
- Pick real, well-known songs that genuinely match the mood
- Be creative and specific — don't always pick obvious choices
- IMPORTANT: Recommend songs from diverse countries and languages worldwide — Korean (K-pop, K-indie, K-R&B), Japanese (J-pop, city pop, anime OST), Chinese (C-pop, Mandopop), Latin (reggaeton, bossa nova), French (chanson, French pop), African, Indian, Middle Eastern, European, and more. Do NOT default to American/English songs. Match the cultural context of the image when possible.
- Mix across eras: classic, retro, modern, current hits — surprise the user
- The description should reference what you actually see in the image
- The color should reflect the dominant mood/palette of the image`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:")
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                  detail: "low",
                },
              },
              {
                type: "text",
                text: "Analyze this image's vibe and suggest the perfect theme song.",
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`OpenAI API error (${response.status}): ${errorText}`);
      return c.json(
        { error: `OpenAI API error: ${response.status}`, details: errorText },
        500
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log("OpenAI returned empty content:", JSON.stringify(data));
      return c.json({ error: "OpenAI returned empty response" }, 500);
    }

    // Parse JSON from response (handle possible markdown fences)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.log("Failed to parse OpenAI response as JSON:", content);
      return c.json(
        { error: "Failed to parse AI response", raw: content },
        500
      );
    }

    // ===== YouTube Search with KV Cache =====
    const youtubeKey = Deno.env.get("YOUTUBE_API_KEY");
    if (youtubeKey) {
      try {
        // 1) Check cache first
        const cachedId = await getYtCache(parsed.artist, parsed.songTitle);
        if (cachedId !== undefined) {
          // Cache hit (cachedId can be null = "previously searched, not found")
          parsed.youtubeId = cachedId;
          console.log(`Using cached YouTube ID: ${cachedId}`);
        } else {
          // 2) Cache miss — search YouTube API
          const searchYouTube = async (query: string, embeddableOnly: boolean): Promise<string[]> => {
            const params = new URLSearchParams({
              part: "snippet",
              q: query,
              type: "video",
              maxResults: "10",
              key: youtubeKey,
            });
            if (embeddableOnly) params.set("videoEmbeddable", "true");

            const url = `https://www.googleapis.com/youtube/v3/search?${params}`;
            const res = await fetch(url);
            if (!res.ok) {
              const errText = await res.text();
              console.log(`YouTube search error (${res.status}) for "${query}": ${errText}`);
              return [];
            }
            const data = await res.json();
            return (
              data.items
                ?.filter(
                  (item: any) =>
                    item.id?.videoId &&
                    item.snippet?.title !== "Deleted video" &&
                    item.snippet?.title !== "Private video"
                )
                ?.map((item: any) => item.id.videoId) || []
            );
          };

          const pickBestVideo = async (candidateIds: string[]): Promise<string | null> => {
            if (candidateIds.length === 0) return null;
            const verifyUrl = `https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${candidateIds.join(",")}&key=${youtubeKey}`;
            const res = await fetch(verifyUrl);
            if (!res.ok) {
              console.log(`Verify API failed (${res.status}), skipping verification`);
              return candidateIds[0];
            }
            const data = await res.json();
            const playable = data.items?.find(
              (v: any) => v.status?.embeddable === true && v.status?.privacyStatus === "public"
            );
            if (playable) {
              console.log(`Verified embeddable video: ${playable.id}`);
              return playable.id;
            }
            console.log(`All ${candidateIds.length} candidates failed embed verification — returning null`);
            return null;
          };

          const primaryQuery = parsed.youtubeSearchQuery || `${parsed.artist} ${parsed.songTitle}`;
          console.log(`YouTube primary search: "${primaryQuery}"`);

          // 5-step fallback search
          let candidates = await searchYouTube(primaryQuery, true);
          console.log(`Attempt 1 (embeddable): ${candidates.length} candidates`);

          if (candidates.length === 0) {
            candidates = await searchYouTube(primaryQuery, false);
            console.log(`Attempt 2 (no filter): ${candidates.length} candidates`);
          }

          if (candidates.length === 0) {
            const officialQuery = `${parsed.artist} ${parsed.songTitle} official`;
            candidates = await searchYouTube(officialQuery, false);
            console.log(`Attempt 3 (official "${officialQuery}"): ${candidates.length} candidates`);
          }

          if (candidates.length === 0) {
            const simpleQuery = `${parsed.artist} ${parsed.songTitle}`;
            if (simpleQuery !== primaryQuery) {
              candidates = await searchYouTube(simpleQuery, false);
              console.log(`Attempt 4 (simple "${simpleQuery}"): ${candidates.length} candidates`);
            }
          }

          if (candidates.length === 0) {
            candidates = await searchYouTube(parsed.songTitle, false);
            console.log(`Attempt 5 (title only "${parsed.songTitle}"): ${candidates.length} candidates`);
          }

          const bestId = await pickBestVideo(candidates);
          parsed.youtubeId = bestId || null;
          console.log(`Final selected YouTube video: ${parsed.youtubeId}`);

          // 3) Save to cache (even if null, to avoid re-searching)
          await setYtCache(parsed.artist, parsed.songTitle, parsed.youtubeId);
        }
      } catch (ytErr) {
        console.log("YouTube search failed (non-fatal):", ytErr);
        parsed.youtubeId = null;
      }
    } else {
      console.log("YOUTUBE_API_KEY not set, skipping YouTube video search");
      parsed.youtubeId = null;
    }

    return c.json({ success: true, result: parsed });
  } catch (err) {
    console.log("Unexpected error in /analyze-vibe:", err);
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
