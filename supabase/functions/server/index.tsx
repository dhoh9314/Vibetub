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

    // Search YouTube for the exact video ID
    const youtubeKey = Deno.env.get("YOUTUBE_API_KEY");
    if (youtubeKey) {
      try {
        // Helper: search YouTube and return candidate video IDs
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

        // Helper: verify candidates and pick the best embeddable one
        const pickBestVideo = async (candidateIds: string[]): Promise<string | null> => {
          if (candidateIds.length === 0) return null;
          const verifyUrl = `https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${candidateIds.join(",")}&key=${youtubeKey}`;
          const res = await fetch(verifyUrl);
          if (!res.ok) {
            console.log(`Verify API failed (${res.status}), skipping verification`);
            // Don't blindly return first candidate — it might not be embeddable
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
          // None passed embed check — return null instead of a non-embeddable video
          console.log(`All ${candidateIds.length} candidates failed embed verification — returning null`);
          return null;
        };

        const primaryQuery = parsed.youtubeSearchQuery || `${parsed.artist} ${parsed.songTitle}`;
        console.log(`YouTube primary search: "${primaryQuery}"`);

        // Attempt 1: primary query with embeddable filter
        let candidates = await searchYouTube(primaryQuery, true);
        console.log(`Attempt 1 (embeddable): ${candidates.length} candidates`);

        // Attempt 2: primary query without embeddable filter
        if (candidates.length === 0) {
          candidates = await searchYouTube(primaryQuery, false);
          console.log(`Attempt 2 (no filter): ${candidates.length} candidates`);
        }

        // Attempt 3: artist + song title + "official" keyword
        if (candidates.length === 0) {
          const officialQuery = `${parsed.artist} ${parsed.songTitle} official`;
          candidates = await searchYouTube(officialQuery, false);
          console.log(`Attempt 3 (official "${officialQuery}"): ${candidates.length} candidates`);
        }

        // Attempt 4: simpler query (just artist + song title)
        if (candidates.length === 0) {
          const simpleQuery = `${parsed.artist} ${parsed.songTitle}`;
          if (simpleQuery !== primaryQuery) {
            candidates = await searchYouTube(simpleQuery, false);
            console.log(`Attempt 4 (simple "${simpleQuery}"): ${candidates.length} candidates`);
          }
        }

        // Attempt 5: even simpler - just song title
        if (candidates.length === 0) {
          candidates = await searchYouTube(parsed.songTitle, false);
          console.log(`Attempt 5 (title only "${parsed.songTitle}"): ${candidates.length} candidates`);
        }

        const bestId = await pickBestVideo(candidates);
        if (bestId) {
          parsed.youtubeId = bestId;
          parsed.youtubeDebug = { status: "found", attempts: 5 };
          console.log(`Final selected YouTube video: ${bestId}`);
        } else {
          parsed.youtubeId = null;
          parsed.youtubeDebug = { status: "not_found", candidateCount: candidates.length, reason: candidates.length > 0 ? "all_not_embeddable" : "no_candidates" };
          console.log(`No embeddable YouTube video found after all attempts (${candidates.length} candidates checked)`);
        }
      } catch (ytErr) {
        console.log("YouTube search failed (non-fatal):", ytErr);
      }
    } else {
      console.log("YOUTUBE_API_KEY not set, skipping YouTube video search");
      parsed.youtubeDebug = { status: "no_api_key" };
    }

    return c.json({ success: true, result: parsed });
  } catch (err) {
    console.log("Unexpected error in /analyze-vibe:", err);
    return c.json({ error: `Server error: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);