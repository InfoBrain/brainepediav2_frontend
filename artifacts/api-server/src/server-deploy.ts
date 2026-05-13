import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { Readable } from "node:stream";

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

// ── API proxy ───────────────────────────────────────────────────────────────
// Raw stream passthrough — no body parsing so multipart/form-data is preserved
app.all("/api/*", async (req, res) => {
  const url = `${UPSTREAM}${req.url}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutForUrl(url));

  try {
    const upstream = await fetch(url, {
      method,
      headers,
      // Pipe the raw incoming stream directly — preserves JSON, multipart, etc.
      body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
      signal: controller.signal,
      // @ts-ignore — Node 18+ requires duplex:"half" for streaming request bodies
      duplex: "half",
    });
    clearTimeout(timer);

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (HOP_BY_HOP.has(k) || k === "content-encoding") return;
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

// ── Static frontend ─────────────────────────────────────────────────────────
// All frontend files live alongside server.js (flat — no public/ subfolder)
const staticDir = path.resolve(__dirname);
const indexHtml = path.join(staticDir, "index.html");

if (existsSync(indexHtml)) {
  app.use(
    express.static(staticDir, {
      maxAge: "1d",
      index: false,
      // Don't serve server.js or pino workers as static files
      setHeaders: (_res, filePath) => {
        if (path.extname(filePath) === ".mjs" || path.basename(filePath) === "server.js") {
          _res.status(403).end();
        }
      },
    })
  );
  // SPA fallback — all non-API, non-asset routes serve index.html
  app.get("*", (_req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  app.get("/", (_req, res) =>
    res.json({ status: "OK", note: "index.html not found alongside server.js" })
  );
}

app.listen(PORT, () => {
  console.log(`Brainepedia server running on port ${PORT}`);
  console.log(`API proxy → ${UPSTREAM}`);
  console.log(`Static files → ${staticDir}`);
});
