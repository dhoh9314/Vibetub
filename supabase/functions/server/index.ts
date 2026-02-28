import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// 문지기 로직(401 에러 범인)을 아예 삭제했습니다!

app.post("/make-server-8d7c61d9/analyze-vibe", async (c) => {
  // ... (나머지 OpenAI 분석 및 YouTube 검색 로직은 그대로 두세요)
  // 동훈님이 아까 보여주신 코드에서 'app.post' 부분만 남기면 됩니다!
});

Deno.serve(app.fetch);