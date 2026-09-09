# 🚀 ReachInbox Full-Stack Email Job Scheduler & Dashboard

A production-grade, distributed email scheduling service and modern dashboard built for the **ReachInbox Software Development Intern Assignment**.

Designed to handle high-throughput email outreach at scale with **BullMQ delayed jobs**, **Redis-backed persistence**, **atomic hourly rate limiting**, **live Slack notifications**, **Ethereal fake SMTP delivery**, and **Elasticsearch full-text search**.

---

## 📸 Architecture & System Design

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE OVERVIEW                              │
│                                                                                        │
│  [ React Frontend ] (Vite + Tailwind CSS + Google OAuth)                               │
│         │                                                                              │
│         │ 1. POST /api/emails/schedule (CSV leads, start time, delay, hourly limit)   │
│         ▼                                                                              │
│  [ Express.js Backend ] ───► Persists records in MySQL (Status: SCHEDULED)             │
│         │                                                                              │
│         │ 2. Enqueues delayed jobs into BullMQ with deterministic jobId (idempotency) │
│         ▼                                                                              │
│  [ BullMQ Queue ] (Backed by Redis Sorted Sets — Zero Cron)                            │
│         │                                                                              │
│         ▼                                                                              │
│  [ BullMQ Worker Pool ] (Configurable Concurrency = 5)                                 │
│         │                                                                              │
│         ├─► Atomic Rate Limiter (Redis Window: `rate_limit:{sender}:{YYYY-MM-DD-HH}`)  │
│         │     │                                                                        │
│         │     ├─► [LIMIT REACHED]:                                                     │
│         │     │     • Reschedule job to next hour window (+ jitter)                    │
│         │     │     • Update MySQL status to RESCHEDULED                               │
│         │     │     • Dispatch live Slack Alert via OAuth Webhook 🔔                   │
│         │     │                                                                        │
│         │     └─► [ALLOWED]:                                                           │
│         │           • Apply throttling cooldown (min 2000ms delay)                     │
│         │           • Send email via Ethereal Fake SMTP Transporter ✉️                  │
│         │           • Update MySQL status to SENT (store Ethereal Preview URL)         │
│         │           • Index email into Elasticsearch for instant search 🔍             │
│         │                                                                              │
│  [ Live Bull Board Dashboard ] Mounted at /admin/queues for real-time queue telemetry   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features Checklist (Mapped to Assignment Criteria)

### 🖥️ Backend
- [x] **BullMQ + Redis Persistent Scheduling**: Zero cron jobs (`no crontab, no node-cron, no agenda`). Scheduling relies on Redis-backed delayed sorted sets.
- [x] **Server Restart Persistence & Zero Lost Jobs**: Future scheduled emails survive server and worker restarts. Reconciles state from MySQL on startup.
- [x] **Strict Idempotency**: Jobs use unique `jobId = email.id` preventing duplicate execution or re-sending.
- [x] **Configurable Worker Concurrency**: Worker processes emails concurrently via `WORKER_CONCURRENCY` (default: `5`). Concurrency-safe across instances.
- [x] **Provider Throttling Cooldown**: Enforces configurable minimum delay between individual sends (`MIN_DELAY_BETWEEN_EMAILS=2000` ms).
- [x] **Hourly Rate Limiting (Per-Sender / Per-Tenant)**: Redis atomic counter (`INCR` with 2h TTL) tracks hourly sends per sender.
- [x] **Non-Dropping Rescheduling**: When hourly limit is reached, jobs are **never** dropped or permanently failed; they are delayed into the next available hour window preserving order.
- [x] **Live Slack Notification on Rate Limit Hit**:
  - Real Slack OAuth flow + Direct Webhook support.
  - Fires live alert to user's Slack the moment a sender reaches the hourly threshold.
  - Graceful disconnect/reconnect handling without crashes.
- [x] **Ethereal Fake SMTP**: Sends emails via Ethereal SMTP and captures preview URLs (`nodemailer.getTestMessageUrl`).
- [x] **Elasticsearch Search**: Indexes scheduled and sent emails into Elasticsearch with resilient database search fallback.
- [x] **Live BullMQ Queue Monitor**: `@bull-board/express` dashboard mounted at `/admin/queues`.

### 🎨 Frontend
- [x] **Google OAuth Login**: Real Google OAuth authentication flow with user profile (name, email, avatar) in the top header and logout.
- [x] **Fast Evaluator Demo Login**: One-click sign in as Mitrajit or Yadav036 for rapid local evaluation.
- [x] **Main Dashboard**: Top header, telemetry cards, tabs for Scheduled and Sent emails, and live search bar.
- [x] **Compose New Email Modal**:
  - Multiple sender email support (`outreach@reachinbox.ai`, `growth@outboxlabs.com`, etc.).
  - Drag-and-drop CSV / TXT lead uploader.
  - Client-side regex parser that extracts and displays the **number of valid email addresses detected**.
  - Configurable start time (immediate or scheduled datetime), delay between sends (seconds), and hourly limits.
- [x] **Scheduled Emails Table**: Recipient, Subject & preview, Scheduled delivery (with relative countdown), Sender, Status pills, and Cancel action.
- [x] **Sent Emails Table**: Recipient, Subject, Sent timestamp, Status (`sent` / `failed`), and **one-click Ethereal Email Preview button** that opens the live rendered email in your browser!
- [x] **Slack Integration Modal**: OAuth connect, manual webhook configuration, live test alert dispatch, and disconnect.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js (v24), TypeScript, Express.js |
| **Queue & Worker** | BullMQ, Redis (ioredis), Bull Board |
| **Database** | MySQL, Prisma ORM |
| **Email SMTP** | Nodemailer, Ethereal Email (Fake SMTP) |
| **Search Engine** | Elasticsearch 8.x (with resilient MySQL fallback) |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide React, PapaParse |
| **Authentication** | Google OAuth (@react-oauth/google), JWT |
| **Integrations** | Slack Webhooks & OAuth v2 |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** >= v18 (tested on Node v24)
- **Redis** running on port `6379`
- **MySQL** running on port `3306`
- *(Optional)* Docker Desktop if running via containers

---

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/shreyanair/reachinbox-scheduler.git
cd reachinbox-scheduler

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

---

### Step 2: Configure Environment Variables

#### Backend `.env` (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MySQL Connection String
DATABASE_URL="mysql://root:root@localhost:3306/reachinbox_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# BullMQ Worker Concurrency & Throttling
WORKER_CONCURRENCY=5
MIN_DELAY_BETWEEN_EMAILS=2000
MAX_EMAILS_PER_HOUR_PER_SENDER=100

# Elasticsearch (optional - resilient fallback enabled)
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=emails

# Authentication
JWT_SECRET=reachinbox_super_secret_jwt_key_2026
GOOGLE_CLIENT_ID=

# Slack OAuth (Optional: manual webhook input also available in UI)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/callback

# Ethereal Email (Auto-generated automatically if left blank)
ETHEREAL_USER=
ETHEREAL_PASS=
```

---

### Step 3: Initialize Database

Run Prisma migrations to create tables in MySQL:

```bash
cd backend
npx prisma db push
cd ..
```

---

### Step 4: Run the Application

You can start both backend and frontend concurrently from the root directory:

```bash
npm run dev
```

Or start them in separate terminal windows:

#### Terminal 1: Backend & Worker
```bash
cd backend
npm run dev
```
*Backend runs on `http://localhost:5000`*  
*BullMQ live dashboard runs on `http://localhost:5000/admin/queues`*

#### Terminal 2: Frontend Dashboard
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🐳 Running with Docker (Alternative)

If you prefer running MySQL, Redis, and Elasticsearch via Docker:

```bash
docker-compose up -d
```

---

## 🏛️ Deep-Dive Architecture Explanations

### 1. How Scheduling Works (No Cron)
- Traditional cron-based systems poll the database every minute (`SELECT * WHERE scheduled_at <= NOW()`), which results in heavy database locks, inaccurate second-level execution, and race conditions across multi-instance clusters.
- **ReachInbox Full-Stack Scheduler** uses **BullMQ delayed jobs**:
  - When a schedule request arrives at `POST /api/emails/schedule`, the backend calculates `delayMs = Math.max(0, scheduledAt.getTime() - Date.now())`.
  - The job is placed directly into a **Redis Sorted Set**, where the score is the target execution timestamp.
  - Redis natively manages the timer. When the timestamp expires, Redis moves the job to the active stream without any active database polling.

### 2. How Persistence on Restart is Handled & Idempotency
- **Redis Durability**: BullMQ's queue state is durably kept in Redis memory and persisted via RDB/AOF. When the Node.js server or worker process is terminated (`Ctrl+C`) and restarted, BullMQ delayed timers continue running without losing state.
- **Startup Reconciliation**: On server startup (`backend/src/index.ts`), the backend queries MySQL for any pending emails with status `SCHEDULED` or `RESCHEDULED`. If any job is missing from Redis (e.g. if Redis was flushed), it re-enqueues them with the remaining delay:
  ```ts
  const delayMs = Math.max(0, email.scheduledAt.getTime() - Date.now());
  await queueService.scheduleJob(data, delayMs);
  ```
- **Strict Idempotency**: Each job is assigned a deterministic `jobId: email.id`. BullMQ rejects duplicate job insertions with the same ID, guaranteeing that an email is never sent twice.

### 3. How Rate Limiting & Concurrency are Implemented
- **Concurrency**: Configured on the worker via `WORKER_CONCURRENCY` (e.g., `5`). Multiple jobs execute in parallel safely.
- **Provider Throttling Delay**: A deliberate cooldown (`MIN_DELAY_BETWEEN_EMAILS = 2000ms`) is awaited before each SMTP send to mimic provider rate rules and prevent spam blocks.
- **Atomic Hourly Rate Limiter**:
  - Keyed by hour window: `rate_limit:{senderEmail}:{YYYY-MM-DD-HH}` in UTC.
  - Worker runs an atomic Lua script incrementing the counter.
  - If counter exceeds `MAX_EMAILS_PER_HOUR_PER_SENDER`:
    1. The job is **not failed or dropped**.
    2. Remaining delay until next hour window is calculated:
       `delayMs = nextHour.getTime() - now.getTime() + jitter`.
    3. Job is rescheduled into BullMQ for the next hour window.
    4. Database status updates to `RESCHEDULED`.
    5. A live notification is posted to the user's connected **Slack channel**.

---

## 🧪 Verification & Testing Scenarios

### Scenario 1: Creating Scheduled Emails
1. Open dashboard at `http://localhost:5173`.
2. Sign in via Google OAuth or click **Continue as Evaluator: Mitrajit**.
3. Click **"Compose New Email"**.
4. Drag and drop the included `sample_leads.csv` file. Notice the badge showing:
   `8 valid email addresses detected (sample_leads.csv)`.
5. Enter a subject and body, set delay to `2s`, and click **"Schedule Campaign"**.
6. Switch between **Scheduled Emails** and **Sent Emails** tabs to watch the live progress.
7. In the Sent tab, click **"Preview Email"** to view the live Ethereal rendered email!

### Scenario 2: Server Restart Persistence
1. Schedule 5 emails to be sent 2 minutes in the future.
2. In the terminal, terminate the backend server (`Ctrl+C`).
3. Wait 15 seconds, then restart the server (`npm run dev`).
4. Notice log: `🔄 Reconciled & restored scheduled emails on startup`.
5. When the 2-minute mark arrives, the worker dispatches the emails on time!

### Scenario 3: Hourly Rate Limiting & Slack Alert
1. In `backend/.env`, set `MAX_EMAILS_PER_HOUR_PER_SENDER=2`.
2. Connect Slack via the **"Connect Slack"** button (or paste a webhook).
3. Schedule 5 emails.
4. First 2 emails send immediately.
5. The 3rd email triggers rate limit:
   - Worker logs: `🛑 [Rate Limit Exceeded] Sender hit limit of 2/hr`.
   - BullMQ reschedules the remaining 3 emails to the next hour.
   - Live message arrives in Slack!

---

## ⚖️ Assumptions and Trade-offs

1. **Ethereal Test Accounts**: If no explicit Ethereal SMTP username/password is passed in `.env`, the backend automatically calls `nodemailer.createTestAccount()` on first send and caches the credentials.
2. **Elasticsearch Resilience**: Elasticsearch 8.x is fully supported. If an Elasticsearch node is not running on `localhost:9200`, the application automatically activates **Resilient SQL Fulltext Fallback** so search functionality never fails.
3. **Slack OAuth / Webhook**: Both standard Slack OAuth 2.0 and manual Webhook URLs are supported in the UI so evaluators can test Slack alerting even without creating a private Slack App in the Slack Developer Console.

---

## 👥 Repository Access

In accordance with submission guidelines, access has been granted to GitHub users:
- **Mitrajit**
- **Yadav036**

---

*Built with passion for ReachInbox by Outbox Labs.*
