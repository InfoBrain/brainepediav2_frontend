import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UPSTREAM = "https://api.brainepedia.com";
const PORT = Number(process.env.PORT || 8080);

const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "accept-encoding",
]);

const AI_PATHS = ["/ai-generate", "/seed-districts", "/generate-seed", "/ask-brainiac", "/process/"];
function timeoutForUrl(url: string): number {
  return AI_PATHS.some(p => url.includes(p)) ? 120_000 : 30_000;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── API proxy ──────────────────────────────────────────────────────────────
app.all("/api/*", async (req, res) => {
  const url = `${UPSTREAM}${req.url}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  let body: string | undefined;
  if (hasBody && req.body !== undefined && req.body !== null) {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (!headers["content-type"]) headers["content-type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutForUrl(url));

  try {
    const upstream = await fetch(url, { method, headers, body, signal: controller.signal });
    clearTimeout(timer);

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (HOP_BY_HOP.has(k)) return;
      if (k === "content-encoding") return;
      res.setHeader(key, value);
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (err: any) {
    clearTimeout(timer);
    const isTimeout = err?.name === "AbortError";
    res
      .status(isTimeout ? 504 : 502)
      .json({ status: "Error", message: isTimeout ? "Request timed out." : "Upstream API unreachable." });
  }
});

// ── Static frontend ────────────────────────────────────────────────────────
const staticDir = path.resolve(__dirname);
const indexHtml = path.join(staticDir, "index.html");
if (existsSync(indexHtml)) {
  app.use(express.static(staticDir, { maxAge: "1d", index: false }));
  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  app.get("/", (_req, res) => res.json({ status: "OK", note: "index.html not found alongside server.js" }));
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API proxy → ${UPSTREAM}`);
  console.log(`Static files → ${staticDir}`);
});
