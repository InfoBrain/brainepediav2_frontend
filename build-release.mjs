/**
 * build-release.mjs
 * -----------------
 * Full release build for the Brainepedia Node.js + IIS deployment package.
 *
 * Outputs a self-contained flat folder at ./brainepedia-release/ containing:
 *
 *   assets/                  — Built React SPA JS/CSS assets
 *   favicon.png              — App favicon (PNG)
 *   favicon.svg              — App favicon (SVG)
 *   index.html               — React SPA entry point
 *   opengraph.jpg            — OG image
 *   package.json             — Node version hint (no deps needed)
 *   pino-file.mjs            — Pino file transport worker
 *   pino-pretty.mjs          — Pino pretty-print worker
 *   pino-worker.mjs          — Pino core worker
 *   server.js                — Bundled Express proxy + static-file server (iisnode entry)
 *   thread-stream-worker.mjs — Thread-stream worker
 *   web.config               — IIS URL Rewrite + iisnode configuration
 *
 * Usage:
 *   node build-release.mjs              # full build
 *   node build-release.mjs --server     # server bundle only (skip Vite)
 *   node build-release.mjs --frontend   # Vite build only (skip server bundle)
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, cp, copyFile, mkdir, writeFile, rename, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

globalThis.require = createRequire(import.meta.url);

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const API_SRC = path.join(ROOT, "artifacts/api-server");
const FRONTEND_SRC = path.join(ROOT, "artifacts/brainepedia");
const RELEASE_DIR = path.join(ROOT, "brainepedia-release");
const FRONTEND_DIST = path.join(FRONTEND_SRC, "dist/public");

const args = process.argv.slice(2);
const onlyServer = args.includes("--server");
const onlyFrontend = args.includes("--frontend");
const buildServer = !onlyFrontend;
const buildFrontend = !onlyServer;

// Pino worker files esbuild generates as .js — rename them to .mjs after build.
// server-deploy.ts does not import pino, so server.js has no references to
// these files and renaming is safe.
const PINO_WORKERS = [
  "pino-worker.js",
  "pino-file.js",
  "pino-pretty.js",
  "thread-stream-worker.js",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function banner(msg) {
  const line = "─".repeat(60);
  console.log(`\n\x1b[36m${line}\x1b[0m`);
  console.log(`\x1b[36m  ${msg}\x1b[0m`);
  console.log(`\x1b[36m${line}\x1b[0m\n`);
}

function run(cmd, cwd = ROOT) {
  console.log(`\x1b[2m$ ${cmd}\x1b[0m`);
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env } });
}

// ── Step 0: Clean the release folder ─────────────────────────────────────────

async function cleanRelease() {
  if (existsSync(RELEASE_DIR)) {
    await rm(RELEASE_DIR, { recursive: true, force: true });
    console.log(`✓ Cleaned ${RELEASE_DIR}`);
  }
  await mkdir(RELEASE_DIR, { recursive: true });
}

// ── Step 1: Build the React frontend with Vite ────────────────────────────────

async function buildFrontendStep() {
  banner("Step 1/3 · Vite — Building React SPA");

  if (existsSync(FRONTEND_DIST)) {
    await rm(FRONTEND_DIST, { recursive: true, force: true });
  }

  run(
    `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/brainepedia run build`,
    ROOT
  );

  if (!existsSync(path.join(FRONTEND_DIST, "index.html"))) {
    throw new Error(`Vite build failed — index.html not found at ${FRONTEND_DIST}`);
  }

  console.log(`\x1b[32m✓ Frontend built → ${FRONTEND_DIST}\x1b[0m`);
}

// ── Step 2: Bundle server.js + pino workers with esbuild ──────────────────────

async function buildServerStep() {
  banner("Step 2/3 · esbuild — Bundling Express server + pino workers");

  // esbuild-plugin-pino calls globalThis.require('pino') at plugin init time.
  // Temporarily point require at api-server's node_modules so pino resolves.
  const rootRequire = globalThis.require;
  globalThis.require = createRequire(path.join(API_SRC, "package.json"));

  await esbuild({
    // Named entry point so the output is server.js (not server-deploy.js)
    entryPoints: { server: path.join(API_SRC, "src/server-deploy.ts") },
    // Resolve imports from api-server (where pino and express live)
    absWorkingDir: API_SRC,
    platform: "node",
    bundle: true,
    // CJS output — safest for iisnode on Windows shared hosting
    format: "cjs",
    outdir: RELEASE_DIR,
    logLevel: "info",
    minify: true,
    treeShaking: true,
    sourcemap: false,
    external: [
      // Runtime packages — resolved from node_modules in the release folder
      "express",
      "cors",
      // Native addons — never bundleable
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
    ],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    plugins: [
      esbuildPluginPino({ transports: ["pino-pretty"] }),
    ],
  });

  globalThis.require = rootRequire;

  // Rename pino workers from .js → .mjs (they are ESM workers by nature)
  for (const file of PINO_WORKERS) {
    const src = path.join(RELEASE_DIR, file);
    const dest = path.join(RELEASE_DIR, file.replace(".js", ".mjs"));
    if (existsSync(src)) {
      await rename(src, dest);
      console.log(`  ${file} → ${path.basename(dest)}`);
    }
  }

  console.log(`\x1b[32m✓ Server bundled → ${RELEASE_DIR}/server.js\x1b[0m`);
  console.log(`\x1b[32m✓ Pino workers   → pino-*.mjs + thread-stream-worker.mjs\x1b[0m`);
}

// ── Step 3: Assemble the release folder ───────────────────────────────────────

async function assembleRelease() {
  banner("Step 3/3 · Assembling release package");

  // ── 3a. Copy Vite output flat into the release root ──────────────────────
  // Flat layout: assets/, index.html, favicon.png, favicon.svg, opengraph.jpg
  // No public/ subdirectory — matches the standard iisnode deployment layout.
  if (buildFrontend) {
    const entries = await readdir(FRONTEND_DIST, { withFileTypes: true });
    for (const entry of entries) {
      const src = path.join(FRONTEND_DIST, entry.name);
      const dest = path.join(RELEASE_DIR, entry.name);
      if (entry.isDirectory()) {
        await cp(src, dest, { recursive: true });
      } else {
        await copyFile(src, dest);
      }
    }
    console.log(`✓ Frontend assets → ${RELEASE_DIR}/ (flat)`);
  }

  // ── 3b. Write web.config ─────────────────────────────────────────────────
  const webConfig = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>

    <!-- Route all requests through iisnode → server.js -->
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>

    <rewrite>
      <rules>
        <!-- Let iisnode handle its own internal requests (logging, etc.) -->
        <rule name="iisnode-internals" stopProcessing="true">
          <match url="^iisnode" />
          <action type="None" />
        </rule>

        <!-- Static assets folder — Express serves these via express.static() -->
        <rule name="static-assets" stopProcessing="true">
          <match url="^assets/.*" />
          <action type="Rewrite" url="server.js" />
        </rule>

        <!-- Everything else (API proxy + SPA fallback) → server.js -->
        <rule name="all" stopProcessing="true">
          <match url=".*" />
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>

    <!-- Pass Node.js error details instead of swallowing them with a 500 page -->
    <httpErrors existingResponse="PassThrough" />

    <iisnode
      node_env="production"
      loggingEnabled="true"
      logDirectory="iisnode"
      debuggingEnabled="false"
      nodeProcessCommandLine="node.exe"
      maxNamedPipeConnectionRetry="100"
      namedPipeConnectionRetryDelay="250"
      maxConcurrentRequestsPerProcess="1024"
      maxPendingRequestsPerProcess="1024"
    />

    <!--
      Disable Windows / Basic / Digest authentication so the Authorization
      header is NOT consumed by IIS before reaching the iisnode handler.
      Anonymous Authentication must stay enabled.
      JWT validation is performed by the upstream .NET API (api.brainepedia.com).
    -->
    <security>
      <authentication>
        <anonymousAuthentication enabled="true" />
        <windowsAuthentication enabled="false" />
        <basicAuthentication enabled="false" />
        <digestAuthentication enabled="false" />
      </authentication>
    </security>

    <!--
      Block direct browser access to server internals and worker files.
    -->
    <security>
      <requestFiltering>
        <hiddenSegments>
          <add segment="iisnode" />
        </hiddenSegments>
        <fileExtensions>
          <add fileExtension=".mjs" allowed="false" />
          <add fileExtension=".ts" allowed="false" />
        </fileExtensions>
        <denyUrlSequences>
          <add sequence="web.config" />
          <add sequence="package.json" />
          <add sequence="server.js" />
        </denyUrlSequences>
      </requestFiltering>
    </security>

  </system.webServer>
</configuration>
`;

  await writeFile(path.join(RELEASE_DIR, "web.config"), webConfig, "utf8");
  console.log(`✓ web.config written`);

  // ── 3c. Write package.json with runtime deps (express + cors) ──────────────
  // express and cors are externalised from the esbuild bundle so iisnode
  // resolves them from node_modules at runtime.  Exact versions are read from
  // the workspace so the release always matches what was bundled against.
  const expressVer = JSON.parse(
    await import("node:fs").then(fs => fs.promises.readFile(
      path.join(API_SRC, "node_modules/express/package.json"), "utf8"
    ))
  ).version;
  const corsVer = JSON.parse(
    await import("node:fs").then(fs => fs.promises.readFile(
      path.join(API_SRC, "node_modules/cors/package.json"), "utf8"
    ))
  ).version;

  const pkgJson = {
    name: "brainepedia-server",
    version: "2.0.0",
    description: "Brainepedia — IIS/Node.js deployment server",
    main: "server.js",
    engines: { node: ">=18.0.0" },
    private: true,
    dependencies: {
      express: `^${expressVer}`,
      cors: `^${corsVer}`,
    },
  };
  await writeFile(
    path.join(RELEASE_DIR, "package.json"),
    JSON.stringify(pkgJson, null, 2) + "\n",
    "utf8"
  );
  console.log(`✓ package.json written (express@${expressVer}, cors@${corsVer})`);

  // Install runtime deps into the release folder so node_modules is present
  // for iisnode to resolve express and cors at startup.
  console.log(`  Installing runtime deps in release folder…`);
  run(`npm install --omit=dev --no-audit --no-fund --prefer-offline`, RELEASE_DIR);
  console.log(`✓ node_modules installed → ${RELEASE_DIR}/node_modules`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  banner("Brainepedia Release Builder");
  console.log(`Root : ${ROOT}`);
  console.log(`Out  : ${RELEASE_DIR}`);
  console.log(`Tasks: ${[buildFrontend && "frontend", buildServer && "server"].filter(Boolean).join(", ")}`);

  await cleanRelease();
  if (buildFrontend) await buildFrontendStep();
  if (buildServer) await buildServerStep();
  await assembleRelease();

  banner("Build complete");
  console.log(`\x1b[32mRelease folder: ${RELEASE_DIR}\x1b[0m`);
  console.log(`
Flat deployment structure:
  assets/                  Vite JS + CSS assets
  favicon.png / .svg       Favicons
  index.html               React SPA entry point
  opengraph.jpg            OG image
  package.json             Node version hint (engines.node >=18)
  pino-file.mjs            Pino file transport worker
  pino-pretty.mjs          Pino pretty-print worker
  pino-worker.mjs          Pino core worker
  server.js                Express proxy + SPA server (iisnode entry point)
  thread-stream-worker.mjs Thread-stream worker
  web.config               IIS URL Rewrite + iisnode config
`);
}

main().catch((err) => {
  console.error("\n\x1b[31mBuild failed:\x1b[0m", err.message || err);
  process.exit(1);
});
