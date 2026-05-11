# Brainepedia — Self-Hosted Deployment

## Requirements

- Node.js 18 or later (no `npm install` needed — everything is bundled)

## Start the Server

```bash
PORT=3000 node server.mjs
```

The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | Port the server listens on |

## How It Works

- `server.mjs` is a fully self-contained Node.js server (express is bundled in — no dependencies to install).
- It serves the React SPA from the `public/` folder.
- All requests to `/api/*` are proxied to `https://api.brainepedia.com`.
- All other routes fall back to `index.html` so client-side routing works correctly.

## Running with PM2 (recommended for production)

```bash
npm install -g pm2
PORT=3000 pm2 start server.mjs --name brainepedia
pm2 save
pm2 startup
```

## Running Behind Nginx

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
        proxy_read_timeout 130s;
    }
}
```
