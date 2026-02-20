# Dashboard Deployment Guide

This project is an Astro SSR app with a Node.js server. It needs a host that runs Node.js (not a static host like Netlify/Vercel Pages).

---

## Option A: VPS (Cheapest, Full Control)

Any VPS works: Hetzner, DigitalOcean, etc. Minimum: 1 vCPU, 512MB RAM.

### 1. Prepare the server

```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (keeps the app running)
sudo npm install -g pm2
```

### 2. Upload the project

```bash
# From your local machine
scp -r ./dashboard root@your-server-ip:/opt/dashboard
```

Or use Git:
```bash
# On the server
cd /opt
git clone https://your-repo-url.git dashboard
```

### 3. Set environment variables

```bash
cd /opt/dashboard
nano .env
```

Paste your variables:
```
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
SPOTIFY_REFRESH_TOKEN=your_token
OVAPI_STOP_CODE=43221470
```

### 4. Build and start

```bash
cd /opt/dashboard
npm install
npm run build
pm2 start dist/server/entry.mjs --name dashboard
pm2 save
pm2 startup  # auto-start on reboot
```

The app runs on port **4321** by default.

### 5. Set up a domain (optional but recommended)

Install Nginx as a reverse proxy:

```bash
sudo apt install -y nginx
```

Create config:
```bash
sudo nano /etc/nginx/sites-available/dashboard
```

Paste:
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

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Add HTTPS (free)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Done. Auto-renews.

---

## Option B: Railway (Easiest, No Server Management)

[railway.app](https://railway.app) - free tier available, auto-deploys from Git.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/you/dashboard.git
git push -u origin main
```

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project** > **Deploy from GitHub repo**
3. Select your dashboard repo
4. Railway auto-detects Node.js

### 3. Add environment variables

In Railway dashboard:
- Click your service > **Variables** tab
- Add each variable from your `.env` file

### 4. Set the start command

In Railway > **Settings** tab:
- **Build Command:** `npm run build`
- **Start Command:** `node dist/server/entry.mjs`

### 5. Get your URL

Railway gives you a `*.up.railway.app` domain automatically. Add a custom domain under **Settings** > **Networking** > **Custom Domain**.

---

## Updating the Live Site

### VPS
```bash
cd /opt/dashboard
git pull
npm install
npm run build
pm2 restart dashboard
```

### Railway
Just push to GitHub. Railway auto-deploys.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Port already in use | `HOST=0.0.0.0 PORT=4321 node dist/server/entry.mjs` |
| Spotify not working | Check `SPOTIFY_REFRESH_TOKEN` hasn't expired. Re-run `scripts/get-spotify-token.ts` |
| Weather shows "Offline" | Open-Meteo might be rate-limiting. Wait 10 min (cache TTL) |
| Bus shows "Err" | OVapi might be down. Check `http://v0.ovapi.nl/tpc/43221470` manually |
| NTP fails | Server might block UDP port 123. Clock falls back to system time |
