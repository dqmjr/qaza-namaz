#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/qaza-namaz"

cd "$APP_DIR"
git pull --ff-only
npm ci
npm run build
sudo systemctl restart qaza-bot
sudo systemctl status qaza-bot --no-pager
