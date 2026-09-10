# ReachInbox Distributed Email Scheduler

A distributed, fault-tolerant email dispatch system with BullMQ delayed job queues, atomic sliding-window rate limiting, real-time Slack incident alerting, Ethereal SMTP delivery, and Elasticsearch full-text indexing.

---

## Architecture Overview

```
[ React 18 Client ]
        |
        v  (POST /api/emails/schedule)
[ Express.js API ] ---> Persists state in MySQL (Prisma ORM)
        |
        v  (Deterministic jobId for idempotency)
[ BullMQ Queue ] (Backed by Redis 8 Sorted Sets - Zero Cron)
        |
        v  (Configurable concurrency = 5)
[ BullMQ Worker ]
        |---> Sliding-Window Rate Limiter (Redis key: rate_limit:{sender}:{YYYY-MM-DD-HH})
        |       |-- [Limit Exceeded] -> Reschedule to next window (+ jitter) -> Slack Alert
        |       \-- [Within Limit]   -> Apply provider cooldown (2000ms) -> Ethereal SMTP
        |                                                                 -> Elasticsearch Index
        \---> Bull Board Telemetry UI (/admin/queues)
```

---

## Core Capabilities

- **Zero-Cron Delayed Scheduling**: Scheduling uses Redis sorted sets with millisecond-accurate delay offsets rather than recurring cron polling loops.
- **Atomic Rate Limiting**: Per-sender hourly limits tracked using atomic Redis counters. When exceeded, jobs are rescheduled into the next hourly window with zero dropped tasks.
- **Crash Recovery & Idempotency**: Pending jobs survive application restarts via Redis persistence and startup database reconciliation. Deterministic job IDs prevent duplicate deliveries.
- **Delivery Sandbox**: Dispatches RFC MIME messages via Ethereal fake SMTP with live browser preview links.
- **Search & Telemetry**: Full-text indexing in Elasticsearch with automatic SQL fallback, plus real-time Bull Board queue visualization at `/admin/queues`.
- **Slack Alerting**: Webhook and OAuth incident notifications fired on rate-limit events.

---

## Tech Stack

- **Backend**: Node.js, TypeScript, Express.js, Prisma ORM, MySQL
- **Queue & Storage**: BullMQ, Redis 8 (ioredis), Bull Board
- **Email & Search**: Nodemailer, Ethereal SMTP, Elasticsearch 8.x
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons

---

## Quick Start

### Prerequisites

- Node.js >= 18
- MySQL running on port 3306
- Redis 8 running on port 6380 (or 6379)

### 1. Installation

```bash
git clone https://github.com/shreya-nair21/ReachInbox.git
cd ReachInbox
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configuration

Create `backend/.env` using `backend/.env.example`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL="mysql://root:root@localhost:3306/reachinbox_db"

REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=

WORKER_CONCURRENCY=5
MIN_DELAY_BETWEEN_EMAILS=2000
MAX_EMAILS_PER_HOUR_PER_SENDER=100

JWT_SECRET=reachinbox_secret_key_2026
```

### 3. Database Migration

```bash
cd backend
npx prisma db push
cd ..
```

### 4. Running the Application

```bash
# Start Redis (Windows standalone)
npm run redis

# Start Backend and Frontend concurrently
npm run dev
```

- Web Console: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- BullMQ Board: `http://localhost:5000/admin/queues`

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/demo` | Evaluator 1-click authentication |
| POST | `/api/auth/login` | Email/password sign in |
| POST | `/api/auth/signup` | Register new account |
| POST | `/api/emails/schedule` | Enqueue batch of emails with delay and rate limits |
| GET | `/api/emails/scheduled` | List pending and rescheduled queue jobs |
| GET | `/api/emails/sent` | List delivered emails with Ethereal preview URLs |
| DELETE | `/api/emails/:id` | Cancel a scheduled job before execution |
| GET | `/api/emails/stats` | Aggregated dashboard KPI telemetry |
| GET | `/api/emails/search?q=` | Full-text search across subject, recipient, and body |
| GET | `/api/slack/status` | Current Slack integration state |
| POST | `/api/slack/test` | Dispatch rate-limit test notification |

---

## Demonstration Video

A complete end-to-end recording demonstrating campaign scheduling, worker queueing, rate limiting, and live Ethereal delivery is available in the repository at `ReachInbox_Demo_Walkthrough.mp4`.
