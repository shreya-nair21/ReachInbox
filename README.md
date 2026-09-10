# ReachInbox Email Scheduler

A distributed email scheduling service built with BullMQ, Redis 8, MySQL, and React. Handles high-throughput email campaigns with delayed job queues, atomic hourly rate limiting, live Slack incident alerts, Ethereal SMTP delivery, and Elasticsearch indexing.

## Features

- **Zero-Cron Scheduling**: Redis sorted sets manage millisecond-precise delayed jobs with no database polling.
- **Atomic Rate Limiting**: Enforces hourly per-sender limits; excess jobs are automatically rescheduled to the next window.
- **Crash Recovery & Idempotency**: Jobs persist in Redis across restarts; deterministic job IDs prevent duplicate sends.
- **Delivery & Search**: Dispatches via Ethereal fake SMTP with live web preview links; indexes into Elasticsearch with SQL fallback.
- **Live Observability**: Bull Board queue monitor at `/admin/queues` and real-time dashboard KPIs.

## Tech Stack

- **Backend**: Node.js, TypeScript, Express, BullMQ, Redis 8, Prisma, MySQL
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Integrations**: Nodemailer (Ethereal SMTP), Elasticsearch, Slack Webhooks

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/shreya-nair21/ReachInbox.git
cd ReachInbox
npm run install:all

# 2. Configure environment
cp backend/.env.example backend/.env

# 3. Setup database
cd backend && npx prisma db push && cd ..

# 4. Start Redis & Application
npm run redis   # Starts Redis on port 6380
npm run dev     # Starts Backend (:5000) and Frontend (:5173)
```

- Dashboard: `http://localhost:5173`
- Queue Monitor: `http://localhost:5000/admin/queues`
- API Health: `http://localhost:5000/api/health`

## API Overview

- `POST /api/auth/demo` — 1-click evaluator login
- `POST /api/emails/schedule` — Schedule batch email campaign
- `GET /api/emails/scheduled` — List queued jobs
- `GET /api/emails/sent` — List delivered emails with preview URLs
- `DELETE /api/emails/:id` — Cancel pending job
- `GET /api/emails/stats` — Dashboard metrics
- `GET /api/emails/search?q=` — Full-text search
- `POST /api/slack/test` — Test rate-limit alert

