# Production Deployment Guide

This guide covers deploying GymPulse SaaS to modern cloud platforms, production servers, or instant worldwide tunnels.

---

## 1. Production Deployment Checklist

Before going live:
- [ ] Set `ENVIRONMENT="production"` in your environment variables.
- [ ] Set `DEBUG=false`.
- [ ] Generate a secure, high-entropy `SECRET_KEY` (e.g. `openssl rand -hex 32`).
- [ ] Connect a managed PostgreSQL database instance via `DATABASE_URL`.
- [ ] Configure `ALLOWED_ORIGINS` to your production domain(s).
- [ ] Ensure HTTPS/SSL is terminated (via Cloudflare, Caddy, or Nginx).

---

## 2. Option A: Instant Worldwide HTTPS Sharing (Zero Config)

GymPulse includes an automated Cloudflare Edge Tunnel configuration for immediate worldwide sharing without port-forwarding or public IP setups:

1. Double-click `Share_Online_Worldwide.bat` (or execute `cloudflared.exe tunnel --url http://localhost:8000`).
2. The tunnel outputs a secure public domain (e.g. `https://your-tunnel.trycloudflare.com`).
3. Anyone on Mobile (iPhone/Android) or PC can open the link anywhere in the world over cellular data or any Wi-Fi network.

---

## 3. Option B: Standalone Portable Windows Package (Zero Python Pre-Installed)

For distribution to gym owners who do not have Python or technical dependencies installed:
1. Double-click `Run_GymPulse.bat` to test locally.
2. Distribute `GymPulse_Windows_Portable.zip` (available via direct web download at `/api/download/windows`).
3. The recipient extracts the ZIP file and double-clicks `GymPulse.bat`.
4. It initializes silently with an embedded runtime, pre-seeds demo facilities if first run, pins the branded icon to the Windows taskbar, and launches the application.

---

## 4. Option C: Docker Deployment (Recommended for Cloud)

### Using Docker Compose
A production multi-stage Dockerfile and Docker Compose configuration are included in the repository.

1. Create your production `.env` file:
   ```env
   ENVIRONMENT=production
   DEBUG=false
   SECRET_KEY=your-64-character-cryptographic-random-secret
   DATABASE_URL=postgresql://user:password@db-host:5432/gympulse
   AI_PROVIDER=local
   ```

2. Build and start container:
   ```bash
   docker compose up -d --build
   ```

3. View logs:
   ```bash
   docker compose logs -f
   ```

---

## 5. Option D: Cloud PaaS (Render / Railway / Fly.io)

### Render.com
1. Connect your Git repository to Render.
2. Select **Web Service**.
3. Set **Environment**: `Docker` (Render will detect the multi-stage `Dockerfile`).
4. Set Environment Variables:
   - `ENVIRONMENT` = `production`
   - `SECRET_KEY` = `<secure-random-key>`
   - `DATABASE_URL` = `<Render PostgreSQL Internal URL>`
   - `AI_PROVIDER` = `local`
5. Click **Create Web Service**.

### Railway.app
1. Create a new project from your GitHub repository.
2. Add a **PostgreSQL** database service.
3. In the web service settings, attach the `DATABASE_URL` environment variable from the PostgreSQL plugin.
4. Deploy!

---

## 6. Option E: Traditional Linux VPS (Nginx + Systemd)

### 1. System Dependencies
```bash
sudo apt update && sudo apt install -y python3-venv python3-pip nginx certbot python3-certbot-nginx
```

### 2. Setup Application Directory
```bash
sudo mkdir -p /var/www/gympulse
sudo chown -R $USER:$USER /var/www/gympulse
cd /var/www/gympulse
# Copy or git clone application here
python3 -m venv venv
./venv/bin/pip install -r backend/requirements.txt
```

### 3. Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Create Systemd Service (`/etc/systemd/system/gympulse.service`)
```ini
[Unit]
Description=GymPulse SaaS Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/gympulse
EnvironmentFile=/var/www/gympulse/.env
ExecStart=/var/www/gympulse/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gympulse
```

### 5. Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/gympulse`)
```nginx
server {
    server_name gympulse.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/gympulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d gympulse.yourdomain.com
```

---

## 7. Mobile App / PWA Installation

GymPulse is configured as a native-feel Progressive Web App (PWA) with `manifest.json` and `sw.js`:

### iPhone / iPad (iOS)
1. Open the gym's public URL or dashboard in Safari.
2. Tap the Safari Share button (`[↑]`) at the bottom.
3. Tap **"Add to Home Screen"** (`+`).
4. GymPulse installs as an app on your home screen with a custom icon, opening full-screen with no browser navigation bar.

### Android
1. Open the URL in Google Chrome.
2. Tap the in-app **"Install GymPulse on This Phone"** button or Chrome menu &rarr; **"Install app"**.
3. GymPulse installs directly to the Android app drawer.
