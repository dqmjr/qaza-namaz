# Qaza Namaz Telegram Bot

Tracking + motivation bot for missed (qaza) prayers. Not a religious ruling tool.

## Requirements

- Node.js **22+**
- Docker (recommended) for Postgres

## Setup

1) Create `.env`:

```env
BOT_TOKEN=...your_telegram_bot_token...
DATABASE_URL=postgres://postgres:postgres@localhost:5432/qaza_namaz
DEFAULT_LANGUAGE=ru
TZ=Asia/Almaty
```

2) Start database:

```bash
docker compose up -d
```

3) Install & run:

```bash
npm install
npm run dev
```

## Commands

- `/start` — welcome + language selection

## Deploy 24/7 on Oracle Free VPS

Use this when you want the bot always online without running local `npm run dev`.

### 1) Create Ubuntu VM in Oracle Cloud

- Shape: `VM.Standard.E2.1.Micro` (Always Free)
- OS: Ubuntu 22.04
- Add inbound SSH rule (`22`) in Security List

### 2) Connect to server

```bash
ssh ubuntu@YOUR_VM_PUBLIC_IP
```

### 3) Install system packages + Node.js 22

```bash
sudo apt update && sudo apt install -y git curl ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 4) Install Docker for Postgres

```bash
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
newgrp docker
```

### 5) Clone project and configure env

```bash
sudo mkdir -p /opt
sudo chown -R ubuntu:ubuntu /opt
cd /opt
git clone https://github.com/dqmjr/qaza-namaz.git qaza-namaz
cd qaza-namaz
cp .env.example .env
```

Edit `.env`:

```env
BOT_TOKEN=YOUR_TOKEN
DATABASE_URL=postgres://postgres:postgres@localhost:5432/qaza_namaz
DEFAULT_LANGUAGE=ru
ENABLE_CUSTOM_STRATEGY=0
TZ=Asia/Almaty
```

### 6) Start Postgres and build app

```bash
docker compose up -d
npm ci
npm run build
```

### 7) Create dedicated app user and service

```bash
sudo useradd -r -m -d /opt/qaza-namaz -s /bin/bash qaza || true
sudo chown -R qaza:qaza /opt/qaza-namaz
sudo cp /opt/qaza-namaz/ops/oracle/qaza-bot.service /etc/systemd/system/qaza-bot.service
sudo systemctl daemon-reload
sudo systemctl enable --now qaza-bot
```

### 8) Check logs/status

```bash
sudo systemctl status qaza-bot --no-pager
sudo journalctl -u qaza-bot -f
```

### 9) Update after new push

```bash
cd /opt/qaza-namaz
chmod +x ops/oracle/update.sh
./ops/oracle/update.sh
```

## Deploy on Render (Free Worker)

Render free works best for this bot as a **Background Worker** (not Web Service).

### 1) Prepare database (free)

Use one of:
- Neon Postgres (recommended)
- Supabase Postgres

Copy your external `DATABASE_URL`.

### 2) Push project to GitHub

This repo already includes `render.yaml`, so Render can auto-detect settings.

### 3) Create worker in Render

1. Open [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** -> **Blueprint**
3. Select this GitHub repo
4. Render reads `render.yaml` and creates `qaza-namaz-bot` worker

### 4) Set environment variables

In Render service settings, set:

- `BOT_TOKEN` = your Telegram bot token
- `DATABASE_URL` = external postgres URL (Neon/Supabase)
- `DEFAULT_LANGUAGE` = `ru` or `kk`
- `ENABLE_CUSTOM_STRATEGY` = `0`
- `TZ` = `Asia/Almaty`

### 5) Deploy and check logs

After deploy starts, open logs and ensure you see:
- `Nest application successfully started`
- `Telegraf getMe...`

If you see `409 Conflict`, another bot process is running elsewhere.
Stop local/other server instance and redeploy.

### Notes for free plan

- Free worker can sleep/restart depending on Render limits.
- For best 24/7 reliability, upgrade plan or use Oracle VPS.


