# Brainepedia — Self-Hosted Deployment

## Requirements

- Node.js 18 or later
- npm (or pnpm / yarn)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the server**

   ```bash
   PORT=3000 node server.mjs
   ```

   The server will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | Port the server listens on |

## How It Works

- The server serves the React SPA from the `public/` folder.
- All requests to `/api/*` are proxied upstream to `https://api.brainepedia.com`.
- All other routes fall back to `index.html` so client-side routing works correctly.

## Running with PM2 (recommended for production)

```bash
npm install -g pm2
PORT=3000 pm2 start server.mjs --name brainepedia
pm2 save
pm2 startup
```

## Running behind Nginx

Example Nginx config:

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
