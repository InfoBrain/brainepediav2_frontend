import express from "express";
import cors from "cors";
import path from "node:path";
import { existsSync } from "node:fs";

// process.argv[1] is the path of the executed script/bundle — works in both
// ESM and CJS contexts (avoids import.meta.url which esbuild nullifies in CJS).
const serverDir = path.dirname(path.resolve(process.argv[1]));

const UPSTREAM = "https://api.brainepedia.com";

// iisnode (SmarterASP.NET / Windows shared hosting) passes a named pipe path
// as PORT (e.g. \\.\pipe\abc123), NOT a TCP port number.
// Node's http.listen() accepts both numbers and pipe strings — do NOT cast to Number().
const PORT: string | number = process.env.PORT || 8080;

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
  "if-none-match",
  "if-modified-since",
  "if-match",
  "if-unmodified-since",
  "if-range",
]);

const AI_PATHS = ["/ai-generate", "/seed-districts", "/generate-seed", "/ask-brainiac", "/process/"];
function timeoutForUrl(url: string): number {
  return AI_PATHS.some(p => url.includes(p)) ? 120_000 : 30_000;
}

const app = express();
app.use(cors());

// ── API proxy ────────────────────────────────────────────────────────────────
// Use a regex so this works in both Express 4 and Express 5 (path-to-regexp v8
// removed support for bare "/*" wildcards).
// req.url retains the full "/api/..." path which is forwarded to UPSTREAM as-is.
app.all(/^\/api(\/.*)?$/, async (req, res) => {
  const url = `${UPSTREAM}${req.url}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
  }

  // IIS on Windows shared hosting (iisnode) strips the standard Authorization
  // header before passing the request to Node.js when Windows/Basic
  // authentication is active at the IIS level. As a fallback the frontend also
  // sends the token in the custom X-Token header. If Authorization was stripped
  // by IIS but X-Token survived, restore Authorization so the upstream .NET API
  // receives the Bearer token it expects.
  if (!headers["authorization"] && headers["x-token"]) {
    headers["authorization"] = headers["x-token"];
  }
  // Always remove the custom header so it does not reach the upstream API.
  delete headers["x-token"];

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  // Buffer the request body in a Node-version-agnostic way (avoids Readable.toWeb
  // compatibility issues on older Node.js runtimes used by some shared hosts).
  let bodyBuffer: Buffer | undefined;
  if (hasBody) {
    bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });
    // Re-add content-length from the actual buffered size so the upstream
    // server (ASP.NET) can correctly parse multipart/form-data bodies with
    // file uploads (the hop-by-hop strip removed the original value).
    if (bodyBuffer && bodyBuffer.length > 0) {
      headers["content-length"] = String(bodyBuffer.length);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutForUrl(url));

  try {
    const upstream = await fetch(url, {
      method,
      headers,
      body: hasBody && bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (HOP_BY_HOP.has(k) || k === "content-encoding") return;
      res.setHeader(key, value);
    });
    // Always return fresh responses — no 304 caching on proxied API calls
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.removeHeader("ETag");
    res.removeHeader("Last-Modified");

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (err: any) {
    clearTimeout(timer);
    const isTimeout = err?.name === "AbortError";
    res
      .status(isTimeout ? 504 : 502)
      .json({
        status: "Error",
        message: isTimeout
          ? "Request timed out. Please try again."
          : "Upstream API unreachable.",
      });
  }
});

// ── Static frontend ──────────────────────────────────────────────────────────
// Frontend assets live in the public/ subdirectory next to server.js.
const staticDir = path.join(serverDir, "public");
const indexHtml = path.join(staticDir, "index.html");

if (existsSync(indexHtml)) {
  app.use(
    express.static(staticDir, {
      maxAge: "1d",
      index: false,
      setHeaders: (_res, filePath) => {
        const ext = path.extname(filePath);
        const base = path.basename(filePath);
        // Block direct access to server files
        if (ext === ".mjs" || base === "server.js" || base === "web.config" || base === "package.json") {
          _res.statusCode = 403;
          _res.end();
        }
      },
    })
  );

  // SPA fallback — every non-API, non-asset path serves index.html
  app.use((_req, res) => {
    res.sendFile(indexHtml);
  });
} else {
  app.get("/", (_req, res) =>
    res.json({ status: "OK", note: "index.html not found alongside server.js" })
  );
}

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Brainepedia server running`);
  console.log(`PORT  → ${PORT}`);
  console.log(`API   → ${UPSTREAM}`);
  console.log(`Files → ${staticDir}`);
});
