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

