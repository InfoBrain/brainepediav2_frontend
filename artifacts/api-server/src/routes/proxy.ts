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

  try {
    const upstream = await fetch(url, { method, headers, body });

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
    req.log?.error({ err, url }, "Upstream proxy error");
    res
      .status(502)
      .json({ status: "Error", message: "Upstream API unreachable." });
  }
}

router.all(/.*/, proxy);

export default router;
