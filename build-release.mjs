/**
 * build-release.mjs
 * -----------------
 * Full release build for the Brainepedia Node.js + IIS deployment package.
 *
 * Outputs a self-contained folder at ./brainepedia-release/ containing:
 *   server.js   — Bundled Express proxy + static-file server (iisnode entry point)
 *   public/     — Built React SPA (Vite output)
 *   web.config  — IIS URL Rewrite + iisnode configuration
 *   README.md   — Deployment instructions
 *
 * Usage:
 *   node build-release.mjs              # full build
 *   node build-release.mjs --server     # server bundle only (skip Vite)
 *   node build-release.mjs --frontend   # Vite build only (skip server bundle)
 *
 * Requires:
 *   - pnpm workspaces set up (`pnpm install` at repo root)
 *   - Node.js 18+
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, cp, copyFile, mkdir, writeFile, readFile } from "node:fs/promises";
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

// ── Step 1: Build the React frontend with Vite ────────────────────────────────

async function buildFrontendStep() {
  banner("Step 1/3 · Vite — Building React SPA");

  if (existsSync(FRONTEND_DIST)) {
    await rm(FRONTEND_DIST, { recursive: true, force: true });
  }

  // Vite requires PORT (dev server) and BASE_PATH even for production builds
  // because vite.config.ts reads them at config-load time.
  run(
    `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/brainepedia run build`,
    ROOT
  );

  if (!existsSync(path.join(FRONTEND_DIST, "index.html"))) {
    throw new Error(`Vite build failed — index.html not found at ${FRONTEND_DIST}`);
  }

  console.log(`\x1b[32m✓ Frontend built → ${FRONTEND_DIST}\x1b[0m`);
}

// ── Step 2: Bundle server.js with esbuild ─────────────────────────────────────

async function buildServerStep() {
  banner("Step 2/3 · esbuild — Bundling Express server");

  const outFile = path.join(RELEASE_DIR, "server.js");

  // Remove old bundle first so there are no stale artefacts
  if (existsSync(outFile)) {
    await rm(outFile, { force: true });
  }

  await esbuild({
    entryPoints: [path.join(API_SRC, "src/server-deploy.ts")],
    platform: "node",
    bundle: true,
    // CJS output is the safest for iisnode — avoids ESM loader quirks on
    // Windows shared hosting where the Node version may be older.
    format: "cjs",
    outfile: outFile,
    logLevel: "info",
    minify: false, // Keep readable for debugging on the server
    sourcemap: false,
    // Externals: native addons and packages that can't be bundled
    external: [
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
  });

  console.log(`\x1b[32m✓ Server bundled → ${outFile}\x1b[0m`);
}

// ── Step 3: Assemble the release folder ───────────────────────────────────────

async function assembleRelease() {
  banner("Step 3/3 · Assembling release package");

  // Ensure release dir exists
  await mkdir(RELEASE_DIR, { recursive: true });

  // ── 3a. Copy Vite build output into public/ ──────────────────────────────
  if (buildFrontend) {
    const publicDir = path.join(RELEASE_DIR, "public");
    if (existsSync(publicDir)) {
      await rm(publicDir, { recursive: true, force: true });
    }
    await cp(FRONTEND_DIST, publicDir, { recursive: true });
    console.log(`✓ Frontend assets → ${publicDir}`);
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

        <!-- Static assets: served by Node but bypass the rewrite so Express
             express.static() can handle them with proper cache headers -->
        <rule name="static-assets" stopProcessing="true">
          <match url="^public/.*" />
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
      Disable Windows / Basic / Digest authentication at the IIS level so that
      the Authorization header is NOT consumed by IIS before the request
      reaches the iisnode handler. Anonymous Authentication must stay enabled.
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
      Prevent direct browser access to server internals.
      Add extra paths here if you place sensitive files in the site root.
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
        </denyUrlSequences>
      </requestFiltering>
    </security>

  </system.webServer>
</configuration>
`;

  await writeFile(path.join(RELEASE_DIR, "web.config"), webConfig, "utf8");
  console.log(`✓ web.config written`);

  // ── 3c. Write minimal package.json (Node version hint for iisnode) ─────────
  const pkgJson = {
    name: "brainepedia-server",
    version: "2.0.0",
    description: "Brainepedia — IIS/Node.js deployment server",
    main: "server.js",
    engines: { node: ">=18.0.0" },
    private: true,
  };
  await writeFile(
    path.join(RELEASE_DIR, "package.json"),
    JSON.stringify(pkgJson, null, 2) + "\n",
    "utf8"
  );
  console.log(`✓ package.json written`);

  // ── 3d. Write README ──────────────────────────────────────────────────────
  const readme = `# Brainepedia — Self-Hosted Deployment

No \`npm install\` needed. Everything (Express, cors, etc.) is bundled into \`server.js\`.

---

## Folder structure

\`\`\`
brainepedia-release/
  server.js        ← Entry point for iisnode / Node.js
  web.config       ← IIS URL Rewrite + iisnode configuration
  package.json     ← Node version hint (no deps needed)
  public/          ← Built React SPA (Vite output)
    index.html
    assets/
    favicon.png
    ...
\`\`\`

---

## Option A — IIS (Windows Server) with iisnode

**Requirements**: IIS + [iisnode](https://github.com/tjanczuk/iisnode) + URL Rewrite module

1. Install [iisnode](https://github.com/tjanczuk/iisnode/releases) on your Windows Server
2. Install the [URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite) IIS module
3. Copy the entire \`brainepedia-release/\` folder contents into your IIS site root  
   (e.g. \`C:\\inetpub\\wwwroot\\brainepedia\\\`)
4. In IIS Manager → Site → Application Settings, add:
   - \`PORT\` = the named pipe path provided by iisnode (leave blank to use default)
   - Or set \`PORT=3000\` for a plain TCP listener (not recommended with iisnode)
5. The included \`web.config\` configures URL Rewrite to route all traffic through \`server.js\`
6. Restart the IIS Application Pool — the app will be live

---

## Option B — Standalone Node.js (Linux / Windows)

**Requirements**: Node.js 18 or later

\`\`\`bash
# Start on default port 3000
PORT=3000 node server.js

# Or let it use the PORT env var set by your process manager / platform
node server.js
\`\`\`

### With PM2 (recommended for production)

\`\`\`bash
npm install -g pm2
pm2 start server.js --name brainepedia --env production
pm2 save
pm2 startup
\`\`\`

### Nginx reverse proxy

\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| \`PORT\`  | \`3000\` | TCP port (or named pipe string for iisnode) |
| \`NODE_ENV\` | \`production\` | Runtime environment |

---

## How it works

- \`server.js\` — self-contained Express server bundled with esbuild (no \`node_modules\` needed)
- Proxies all \`/api/*\` requests to \`https://api.brainepedia.com\`
- Serves \`public/\` as static assets (with 1-day cache headers)
- Returns \`public/index.html\` for all unknown routes (client-side SPA routing)
- Automatically restores the \`Authorization\` header from \`X-Token\` fallback  
  (workaround for iisnode on shared Windows hosting that strips the auth header)

---

Built with Node.js ${process.version} · esbuild · Vite · Express 5
`;

  await writeFile(path.join(RELEASE_DIR, "README.md"), readme, "utf8");
  console.log(`✓ README.md written`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  banner("Brainepedia Release Builder");
  console.log(`Root : ${ROOT}`);
  console.log(`Out  : ${RELEASE_DIR}`);
  console.log(`Tasks: ${[buildFrontend && "frontend", buildServer && "server"].filter(Boolean).join(", ")}`);

  if (buildFrontend) await buildFrontendStep();
  if (buildServer) await buildServerStep();
  await assembleRelease();

  banner("Build complete");
  console.log(`\x1b[32mRelease folder: ${RELEASE_DIR}\x1b[0m`);
  console.log(`\nDeploy instructions: ${path.join(RELEASE_DIR, "README.md")}\n`);
}

main().catch((err) => {
  console.error("\n\x1b[31mBuild failed:\x1b[0m", err.message || err);
  process.exit(1);
});
