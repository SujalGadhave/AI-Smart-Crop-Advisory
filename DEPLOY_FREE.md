# Free Deployment Guide (Full Stack)

This project can be deployed with **zero runtime cost** by hosting all services on one **Oracle Cloud Always Free** VM.

Stack deployed:
- Frontend (Nginx static) on port 80
- Backend (Spring Boot) on port 8080 (internal + optional direct)
- AI service (FastAPI) on port 8000 (internal + optional direct)
- MySQL 8.0 with persistent volume

## 1. Create Always Free VM

Create an Oracle Cloud Always Free compute instance with Ubuntu.

Recommended:
- Shape: `VM.Standard.A1.Flex` (Always Free)
- OCPU: 1
- Memory: 6 GB (or lower if constrained)
- Public IP: enabled

Open ingress ports in Oracle security list / NSG:
- `80` (required for frontend)
- `22` (SSH)
- Optional: `8080`, `8000` (only if you want direct access)

## 2. Install Docker + Compose plugin

SSH into the VM and run:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
sudo usermod -aG docker $USER
newgrp docker
```

## 3. Clone and start services

```bash
git clone <your-repo-url> KrushiMitra
cd KrushiMitra
docker compose up -d --build
```

Check service status:

```bash
docker compose ps
docker compose logs -f backend
```

## 4. Access the app

Use the VM public IP in browser:

- `http://<VM_PUBLIC_IP>/` -> frontend
- `http://<VM_PUBLIC_IP>/api/weather?city=Pune` -> backend API via frontend proxy

## 5. Optional: Add free HTTPS + custom domain

Use Cloudflare free DNS and proxy:

1. Add your domain to Cloudflare (free plan).
2. Create `A` record pointing to VM public IP.
3. Set proxy to enabled (orange cloud).
4. In Cloudflare SSL/TLS, start with `Flexible` or (better) install cert on VM and use `Full (strict)`.

## 6. Runtime updates

After code changes:

```bash
cd KrushiMitra
git pull
docker compose up -d --build
```

## 7. Troubleshooting quick checks

```bash
docker compose logs -f ai-service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

If frontend loads but API fails:
- Verify backend is healthy in logs.
- Verify MySQL container is running.
- Verify frontend Nginx is proxying `/api/*` (already configured in `frontend/nginx.conf`).

## Notes

- This is the most practical fully-free setup for this repository because all 4 services run on a single always-free host.
- If you split services across different free platforms, you will usually hit free-tier sleeping limits or monthly compute caps.
