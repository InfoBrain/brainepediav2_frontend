import express from "express";
import { createRequire } from "module";
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.all(/^\/api\/(.*)/, async (req, res) => {
  const url = `${UPSTREAM}/api/${req.params[0]}${req.url.includes("?") ? "?" + req.url.split("?")[1] : ""}`;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  let body;
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

const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR));

app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Brainepedia server listening on port ${PORT}`);
});
