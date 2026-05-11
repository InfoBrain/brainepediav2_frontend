import { Router, type IRouter, type Request, type Response } from "express";

const UPSTREAM = "https://api.brainepedia.com";

const router: IRouter = Router();

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

// AI endpoints can take up to 90 s; all others use a 30 s default
const AI_PATHS = ["/ai-generate", "/seed-districts", "/generate-seed", "/ask-brainiac"];
function timeoutForUrl(url: string): number {
  return AI_PATHS.some(p => url.includes(p)) ? 120_000 : 30_000;
}

async function proxy(req: Request, res: Response) {
  const url = `${UPSTREAM}/api${req.url}`;

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
    req.log?.error({ err, url }, "Upstream proxy error");
    const isTimeout = err?.name === "AbortError";
    res
      .status(isTimeout ? 504 : 502)
      .json({ status: "Error", message: isTimeout ? "Request timed out. The AI is taking too long — please try again." : "Upstream API unreachable." });
  }
}

router.all(/.*/, proxy);

export default router;
