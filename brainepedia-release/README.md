# Brainepedia — Self-Hosted Deployment

No `npm install` needed. Everything is bundled into `server.js`.

---

## Option A — IIS (Windows Server) with iisnode

**Requirements**: IIS + [iisnode](https://github.com/tjanczuk/iisnode) + URL Rewrite module

1. Install [iisnode](https://github.com/tjanczuk/iisnode/releases) on your Windows Server
2. Install [URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite) module for IIS
3. Copy the entire `brainepedia/` folder contents into your IIS site root (e.g. `C:\inetpub\wwwroot\`)
4. The included `web.config` configures IIS to route all requests through `server.js`
5. Set the environment variable in IIS: `PORT` = `3000` (or any free port)
6. Restart the IIS site — the app will be live

---

## Option B — Standalone Node.js (Linux/Windows, behind Nginx or Apache)

**Requirements**: Node.js 14 or later

```bash
node server.js
```

Or on a specific port:

```bash
PORT=3000 node server.js
```

Defaults to port **3000** if `PORT` is not set.

### With PM2 (recommended for production):

```bash
npm install -g pm2
pm2 start server.js --name brainepedia
pm2 save
pm2 startup
```

### Nginx reverse proxy config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## How It Works

- `server.js` — self-contained Node.js server (express bundled in)
- `public/` — built React SPA
- The React app calls the API directly at `https://api.brainepedia.com`
- All unknown routes return `index.html` so client-side routing works correctly
