# Deployment Guide

This is an Astro SSR app — it requires a host that runs Node.js (not a static host like Netlify/Vercel Pages).

---

## Option A: Docker (Recommended)

The project ships with a multi-stage `Dockerfile` and a `docker-compose.yml` that also sets up a Cloudflare Tunnel for public access without opening ports.

### 1. Copy and fill in your environment variables

```bash
cp .env.example .env   # or create .env from scratch
nano .env
```

### 2. Set your Cloudflare Tunnel token (optional)

If you want public access via Cloudflare Tunnel, add your token to `.env`:

```env
CLOUDFLARE_TUNNEL_TOKEN=your_token_here
```

Get a token at [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → Zero Trust → Networks → Tunnels.

### 3. Build and run

```bash
docker compose up -d --build
```

The dashboard is available at `http://localhost:4321`.

### Updating

```bash
git pull
docker compose up -d --build
```

---

## Option B: VPS (Direct, no Docker)

Any VPS works: Hetzner, DigitalOcean, etc. Minimum: 1 vCPU, 512 MB RAM.

### 1. Install Node.js 20+ and PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Upload the project

Via SCP:
```bash
scp -r ./dashboard root@your-server-ip:/opt/dashboard
```

Or via Git:
```bash
cd /opt
git clone https://your-repo-url.git dashboard
```

### 3. Set environment variables

```bash
cd /opt/dashboard
nano .env
```

### 4. Build and start

```bash
npm install
npm run build
pm2 start dist/server/entry.mjs --name dashboard
pm2 save
pm2 startup   # auto-start on reboot
```

The app runs on port **4321** by default.

### 5. Nginx reverse proxy (optional)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/dashboard
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. HTTPS (free via Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Updating

```bash
cd /opt/dashboard
git pull
npm install
npm run build
pm2 restart dashboard
```

---

## Option C: Railway

[railway.app](https://railway.app) — auto-deploys from GitHub, no server management.

### 1. Push to GitHub

```bash
git remote add origin https://github.com/you/dashboard.git
git push -u origin main
```

### 2. Create a new project on Railway

1. Sign in at [railway.app](https://railway.app) with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select your repo.

### 3. Configure build and start

In **Settings**:
- **Build Command:** `npm run build`
- **Start Command:** `node dist/server/entry.mjs`

### 4. Add environment variables

**Variables** tab → add each key from your `.env`.

Railway provides a `*.up.railway.app` URL automatically. Add a custom domain under **Settings** → **Networking** → **Custom Domain**.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Port already in use | Set `PORT=4322` in `.env` or in the run command |
| Spotify not working | Refresh token may have expired — re-run `npx tsx scripts/get-spotify-token.ts` |
| Weather shows "Offline" | Open-Meteo may be rate-limiting; wait 15 min for cache to expire and retry |
| Bus shows "Err" | OVapi may be down — check `http://v0.ovapi.nl/tpc/YOUR_CODE` directly |
| Tech news stuck | Feed cache TTL is 5 min; restart the server to force a fresh fetch |
| NTP sync fails | Some hosts block UDP port 123; the clock falls back to system time automatically |
| Uptime shows "Checking..." | The `/api/uptime` endpoint makes outbound HEAD requests — ensure the server has internet access |
