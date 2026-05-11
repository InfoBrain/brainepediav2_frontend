import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = Number(process.env.PORT ?? 3000);
const UPSTREAM = "https://api.brainepedia.com";

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

const AI_PATHS = ["/ai-generate", "/seed-districts", "/generate-seed", "/ask-brainiac"];
function timeoutForUrl(url) {
  return AI_PATHS.some((p) => url.includes(p)) ? 120_000 : 30_000;
}

// Proxy all /api/* requests to the upstream — raw body passthrough (no body parsing)
app.use("/api", async (req, res) => {
  // Collect the raw request body without any parsing so multipart/FormData is preserved
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks);

  // Build the upstream URL: req.url here is relative to the /api mount point
  const url = `${UPSTREAM}/api${req.url}`;

  // Forward all headers except hop-by-hop ones
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD" && rawBody.length > 0;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutForUrl(url));

  try {
    const upstream = await fetch(url, {
      method,
      headers,
      body: hasBody ? rawBody : undefined,
      signal: controller.signal,
    });
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
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err?.name === "AbortError";
    console.error(`[proxy] ${isTimeout ? "timeout" : "error"}: ${url}`, err?.message ?? err);
    res
      .status(isTimeout ? 504 : 502)
      .json({
        status: "Error",
        message: isTimeout
          ? "Request timed out. The AI is taking too long — please try again."
          : "Upstream API unreachable.",
      });
  }
});

// Serve the built React SPA
const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR));

// SPA fallback — return index.html for all non-file routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Brainepedia server listening on port ${PORT}`);
});
