# Brainepedia — Self-Hosted Deployment

No `npm install` needed. Everything (Express, cors, etc.) is bundled into `server.js`.

---

## Folder structure

```
brainepedia-release/
  server.js        ← Entry point for iisnode / Node.js
  web.config       ← IIS URL Rewrite + iisnode configuration
  package.json     ← Node version hint (no deps needed)
  public/          ← Built React SPA (Vite output)
    index.html
    assets/
    favicon.png
    ...
```

---

## Option A — IIS (Windows Server) with iisnode

**Requirements**: IIS + [iisnode](https://github.com/tjanczuk/iisnode) + URL Rewrite module

1. Install [iisnode](https://github.com/tjanczuk/iisnode/releases) on your Windows Server
2. Install the [URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite) IIS module
3. Copy the entire `brainepedia-release/` folder contents into your IIS site root  
   (e.g. `C:\inetpub\wwwroot\brainepedia\`)
4. In IIS Manager → Site → Application Settings, add:
   - `PORT` = the named pipe path provided by iisnode (leave blank to use default)
   - Or set `PORT=8080` for a plain TCP listener (not recommended with iisnode)
5. The included `web.config` configures URL Rewrite to route all traffic through `server.js`
6. Restart the IIS Application Pool — the app will be live

---

## Option B — Standalone Node.js (Linux / Windows)

**Requirements**: Node.js 18 or later

```bash
# Start on default port 8080
PORT=8080 node server.js

# Or let it use the PORT env var set by your process manager / platform
node server.js
```

### With PM2 (recommended for production)

```bash
npm install -g pm2
pm2 start server.js --name brainepedia --env production
pm2 save
pm2 startup
```

### Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass         http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`  | `8080` | TCP port (or named pipe string for iisnode) |
| `NODE_ENV` | `production` | Runtime environment |

---

## How it works

- `server.js` — self-contained Express server bundled with esbuild (no `node_modules` needed)
- Proxies all `/api/*` requests to `https://api.brainepedia.com`
- Serves `public/` as static assets (with 1-day cache headers)
- Returns `public/index.html` for all unknown routes (client-side SPA routing)
- Automatically restores the `Authorization` header from `X-Token` fallback  
  (workaround for iisnode on shared Windows hosting that strips the auth header)

---

Built with Node.js v24.13.0 · esbuild · Vite · Express 5
