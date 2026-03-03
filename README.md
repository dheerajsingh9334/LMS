# LMS (Learning Management System)

A production-grade, full-featured Learning Management System built with Next.js 14, TypeScript, Prisma and modern web technologies. Designed for **scalability** with an **event-driven notification architecture**, real-time SSE streaming, email notifications, and infrastructure ready to handle thousands of concurrent users.

> **Note:** Sensitive keys were removed from `.env.example.txt`. Rotate any exposed keys immediately and never commit real secrets.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Event-Driven Notification System](#event-driven-notification-system)
- [Tech Stack](#tech-stack)
- [Scalability & Performance](#scalability--performance)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

### Core LMS

- **Authentication** — Email/password & Google OAuth via NextAuth with role-based access (Teacher, Student, Admin)
- **Course Management** — Create, edit, publish courses with chapters, videos, and live sessions
- **Assignments & Quizzes** — Teacher-created assignments with grading, quizzes with MCQ support, final exams
- **Certificates** — Auto-generated completion certificates with customizable templates
- **Live Streaming** — Agora-powered live streaming with real-time chat & polls
- **Analytics** — Teacher (earnings, enrollments, performance) and student (learning metrics) dashboards
- **Payments** — Stripe integration for course purchases with checkout & webhooks
- **File Uploads** — UploadThing integration for secure file management
- **Discussions** — Course-level and chapter-level discussion forums
- **Notes** — Teacher-uploaded notes and student personal notes

### Event-Driven Notifications (NEW)

- **Real-time SSE** — Server-Sent Events for instant notification delivery (replaces polling)
- **Email Notifications** — Transactional emails via Resend for all critical events
- **Event Bus** — Decoupled pub/sub architecture for all system events
- **Notification Preferences** — Per-user, per-category email opt-in/opt-out
- **Bulk Notifications** — Efficiently notifies 10,000+ students for course-wide events
- **Live Session Alerts** — Urgent real-time alerts when teachers go live
- **Rate Limiting** — Per-IP and per-user rate limiting on all API endpoints
- **In-Memory Caching** — LRU cache to reduce database load on hot paths

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│                                                         │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ Enhanced     │  │ Notification│  │ Settings /     │  │
│  │ Notification │  │ Preferences │  │ Course Pages   │  │
│  │ Bell (SSE)   │  │ Panel      │  │                │  │
│  └────┬─────────┘  └─────┬──────┘  └───────┬────────┘  │
│       │ EventSource       │ REST             │ REST     │
└───────┼───────────────────┼──────────────────┼──────────┘
        │                   │                  │
┌───────┴───────────────────┴──────────────────┴──────────┐
│                   Next.js API Routes                     │
│                                                          │
│  /api/notifications/stream  (SSE)                        │
│  /api/notifications/v2      (CRUD + batch ops)           │
│  /api/notifications/preferences                          │
│  /api/courses/*/enroll, announcements, live-sessions     │
│  /api/webhook (Stripe)                                   │
│  /api/health  (monitoring)                               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              EventBus (Singleton)                 │   │
│  │                                                    │   │
│  │  emit() ──► Notification Service                   │   │
│  │             ┌─────────────────────────────────┐   │   │
│  │             │ • Create DB notifications        │   │   │
│  │             │ • Push via SSE Manager           │   │   │
│  │             │ • Queue email via Email Service   │   │   │
│  │             └─────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────┐ ┌──────────┐ ┌───────────┐              │
│  │ SSE Manager│ │ Email    │ │ Rate      │              │
│  │            │ │ Queue    │ │ Limiter   │              │
│  │ • Clients  │ │ (Resend) │ │           │              │
│  │ • Heartbeat│ │ • Batch  │ │ • Per-IP  │              │
│  │ • Cleanup  │ │ • Retry  │ │ • Per-User│              │
│  └────────────┘ └──────────┘ └───────────┘              │
│                                                          │
│  ┌───────────────────────┐ ┌──────────────────────┐     │
│  │ LRU Cache (In-Memory) │ │ Prisma (MongoDB)     │     │
│  │ • Course metadata     │ │ • NotificationV2     │     │
│  │ • User preferences    │ │ • NotifPreference    │     │
│  │ • Student lists       │ │ • All LMS models     │     │
│  └───────────────────────┘ └──────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

---

## Event-Driven Notification System

### Event Flow

1. **Action occurs** — A teacher starts a live session, creates an announcement, grades an assignment, etc.
2. **Event emitted** — The API route calls `eventBus.emit(EventName.LIVE_SESSION_STARTED, payload)`
3. **Handlers fire** — The notification service listens and concurrently:
   - Creates `NotificationV2` records in the database
   - Pushes real-time data to connected clients via SSE
   - Queues email notifications (respecting user preferences)
4. **Client receives** — The enhanced notification bell receives the SSE message and shows instant UI updates

### Supported Events

| Event                     | Trigger                  | In-App       | Email     | SSE            |
| ------------------------- | ------------------------ | ------------ | --------- | -------------- |
| `course.enrolled`         | Student enrolls          | ✅           | ✅        | ✅             |
| `course.completed`        | Student completes course | ✅           | —         | ✅             |
| `course.chapter.added`    | Teacher adds chapter     | ✅ (bulk)    | —         | ✅             |
| `live.session.started`    | Teacher goes live        | ✅ (bulk)    | ✅ (bulk) | ✅ (urgent)    |
| `live.session.ended`      | Teacher ends session     | —            | —         | ✅             |
| `live.session.scheduled`  | Session scheduled        | ✅ (bulk)    | ✅ (bulk) | —              |
| `live.poll.created`       | Teacher creates poll     | —            | —         | ✅ (broadcast) |
| `assignment.created`      | New assignment           | ✅ (bulk)    | —         | ✅             |
| `assignment.submitted`    | Student submits          | ✅ (teacher) | —         | ✅             |
| `assignment.graded`       | Teacher grades           | ✅           | ✅        | ✅             |
| `assignment.due.reminder` | Due date approaching     | ✅           | ✅        | ✅             |
| `quiz.published`          | Quiz goes live           | ✅ (bulk)    | —         | ✅             |
| `announcement.created`    | Course announcement      | ✅ (bulk)    | ✅ (bulk) | ✅             |
| `announcement.global`     | Platform announcement    | —            | —         | ✅ (broadcast) |
| `certificate.issued`      | Certificate generated    | ✅           | ✅        | ✅             |
| `payment.completed`       | Stripe webhook           | ✅           | ✅        | ✅             |
| `payment.failed`          | Stripe webhook           | ✅           | —         | ✅             |
| `user.welcome`            | Registration             | ✅           | ✅        | —              |
| `final.exam.available`    | Exam enabled             | ✅ (bulk)    | —         | ✅             |
| `final.exam.graded`       | Exam graded              | ✅           | —         | ✅             |
| `system.maintenance`      | Admin action             | —            | —         | ✅ (broadcast) |

### Notification Preferences

Users can customize their notification experience:

- **Enable/disable channels** — In-app, email, push (future)
- **Per-category control** — Toggle email for courses, live sessions, assignments, etc.
- **Email frequency** — Instant, daily digest, or weekly digest
- **Quiet hours** — Set hours when no notifications are sent

### Email Templates

Beautiful HTML emails with:

- Responsive design
- Priority badges (LOW / MEDIUM / HIGH / URGENT)
- Action buttons (deep links back to the platform)
- Unsubscribe/preference management links
- Rate limiting (50 emails/user/hour)
- Retry with exponential backoff (up to 3 retries)

---

## Tech Stack

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Framework        | Next.js 14 (App Router)                     |
| Language         | TypeScript                                  |
| Database         | MongoDB (via Prisma ORM)                    |
| Auth             | NextAuth v5 (email/password + Google OAuth) |
| Live Streaming   | Agora RTC SDK                               |
| Payments         | Stripe (Checkout + Webhooks)                |
| Email            | Resend (transactional emails)               |
| File Uploads     | UploadThing                                 |
| State Management | Redux Toolkit + Zustand                     |
| Styling          | Tailwind CSS + Radix UI                     |
| Charts           | Recharts                                    |
| Real-time        | Server-Sent Events (SSE)                    |

---

## Scalability & Performance

This application is designed to handle large user bases (10,000+ concurrent users):

### Infrastructure

| Feature                     | Implementation                            | Scale Target                 |
| --------------------------- | ----------------------------------------- | ---------------------------- |
| **Real-time Notifications** | SSE with connection pooling               | 10K+ concurrent connections  |
| **Email Delivery**          | Queue-based batching (10/batch)           | 100K+ emails/day             |
| **Database Queries**        | Indexed MongoDB queries + LRU caching     | Sub-100ms response           |
| **Rate Limiting**           | Per-IP + per-user sliding window          | Prevents abuse at scale      |
| **Bulk Notifications**      | Batched DB writes (100/batch) with delays | 50K+ recipients              |
| **Event Processing**        | Async handlers with error isolation       | Fire-and-forget, no blocking |
| **Connection Management**   | Auto-cleanup of stale SSE connections     | Memory efficient             |
| **Cache Hit Rate**          | LRU cache for hot queries (2000 entries)  | 80%+ hit rate                |

### Key Optimizations

- **SSE over WebSocket** — Lighter weight, works through proxies, auto-reconnects
- **Event Bus singleton** — Zero-overhead pub/sub with rate-limited event storms (500/min/type)
- **Batched database writes** — Bulk notification creation in chunks of 100
- **Indexed queries** — Compound indexes on `[userId, isRead, createdAt]`, `[userId, category]`
- **Connection limits** — Max 5 SSE connections per user (prevents tab flooding)
- **Heartbeat + cleanup** — 30s heartbeat, 2min stale timeout for connection cleanup
- **Email queue** — Non-blocking email delivery with retry backoff
- **Font optimization** — Preloaded Poppins with system-ui fallback
- **Tree-shaking** — Modular Lucide imports, SWC minification
- **Compression** — gzip enabled via `compress: true`
- **Client-side filtering** — Category filters in notification bell (no extra API calls)

### Scaling Beyond Single Instance

For horizontal scaling (multiple server instances), upgrade these components:

| Current                 | Upgrade To                      | When               |
| ----------------------- | ------------------------------- | ------------------ |
| In-memory EventBus      | Redis Pub/Sub or BullMQ         | >1 server instance |
| In-memory Cache         | Redis                           | >1 server instance |
| In-memory Rate Limiter  | Redis + `rate-limiter-flexible` | >1 server instance |
| SSE Manager (in-memory) | Redis-backed SSE adapter        | >1 server instance |
| Email Queue (in-memory) | BullMQ + Redis                  | >50K emails/day    |

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- MongoDB (Atlas or local)
- Stripe account (for payments)
- Agora account (for live streaming)
- Resend account (for email notifications)

### Installation

```bash
# Clone the repository
git clone https://github.com/dheerajsingh9334/LMS.git
cd LMS

# Install dependencies
npm install

# Prisma client is auto-generated via postinstall

# Create .env from example
cp .env.example.txt .env
# Fill in your credentials (see Environment Variables section)

# Run development server
npm run dev
# Open http://localhost:3000

# Build for production
npm run build
npm start
```

### Available Scripts

| Script            | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start Next.js dev server       |
| `npm run build`   | Build for production           |
| `npm run start`   | Start production server        |
| `npm run lint`    | Run ESLint                     |
| `npm run seed`    | Seed database with sample data |
| `npm run analyze` | Analyze bundle size            |

---

## Environment Variables

See `.env.example.txt` for all placeholders. Key variables:

### Required

| Variable          | Description                                     |
| ----------------- | ----------------------------------------------- |
| `DATABASE_URL`    | MongoDB connection string                       |
| `NEXTAUTH_URL`    | Application URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | NextAuth encryption secret                      |

### Authentication

| Variable               | Description                |
| ---------------------- | -------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Services

| Variable                             | Description                     |
| ------------------------------------ | ------------------------------- |
| `AGORA_APP_ID`                       | Agora app ID for live streaming |
| `AGORA_APP_CERTIFICATE`              | Agora app certificate           |
| `STRIPE_SECRET_KEY`                  | Stripe secret key               |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key          |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook signing secret   |
| `UPLOADTHING_SECRET`                 | UploadThing secret              |
| `UPLOADTHING_APP_ID`                 | UploadThing app ID              |

### Email Notifications (NEW)

| Variable               | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `RESEND_API_KEY`       | Resend API key for transactional emails                      |
| `EMAIL_FROM`           | Sender email (e.g., `LMS Platform <noreply@yourdomain.com>`) |
| `NEXT_PUBLIC_APP_NAME` | App name shown in emails (default: `LMS Platform`)           |

---

## API Reference

### Notifications

| Method | Endpoint                                                            | Description                              |
| ------ | ------------------------------------------------------------------- | ---------------------------------------- |
| `GET`  | `/api/notifications/stream`                                         | SSE endpoint for real-time notifications |
| `GET`  | `/api/notifications/v2?page=1&limit=20&category=COURSE&unread=true` | Fetch notifications with filtering       |
| `POST` | `/api/notifications/v2`                                             | Batch operations (mark read, archive)    |
| `GET`  | `/api/notifications/preferences`                                    | Get notification preferences             |
| `PUT`  | `/api/notifications/preferences`                                    | Update notification preferences          |

### Batch Operations (POST /api/notifications/v2)

```json
// Mark specific notifications as read
{ "action": "mark_read", "notificationIds": ["id1", "id2"] }

// Mark all as read
{ "action": "mark_all_read" }

// Archive specific notifications
{ "action": "archive", "notificationIds": ["id1"] }

// Archive all read notifications
{ "action": "archive_all_read" }
```

### Health Check

| Method | Endpoint      | Description                                                 |
| ------ | ------------- | ----------------------------------------------------------- |
| `GET`  | `/api/health` | System health with SSE, EventBus, cache, email queue status |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on Vercel
3. Set all environment variables in Vercel dashboard
4. Configure Stripe webhook to point to `https://yourdomain.com/api/webhook`
5. Configure Resend domain verification for email delivery

### Self-Hosted

```bash
npm run build
npm start
```

Ensure:

- MongoDB is accessible from your server
- SSL/TLS is configured for SSE connections
- Nginx/reverse proxy has `proxy_buffering off` for `/api/notifications/stream`

### Nginx SSE Configuration

```nginx
location /api/notifications/stream {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding off;
}
```

---

## Security

- **Never commit secrets** — Use `.env` locally and environment variables in production
- **Rate limiting** — All API endpoints are rate-limited per IP and per user
- **Input validation** — Zod schemas for all user inputs
- **CSRF protection** — NextAuth handles CSRF tokens
- **XSS prevention** — Content Security Policy headers on API routes
- **SQL injection** — Prisma parameterized queries

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Keep PRs small and focused
- Include tests for significant logic changes
- Follow existing code conventions (TypeScript strict, Tailwind for styling)
- Update README if adding new features or environment variables

---

## Troubleshooting

| Issue                           | Solution                                                             |
| ------------------------------- | -------------------------------------------------------------------- |
| Push rejected (secret scanning) | Remove sensitive data from commits, rotate keys, force-push          |
| Hydration errors                | Ensure server components don't import client-only modules            |
| SSE not working behind proxy    | Set `proxy_buffering off` in Nginx config                            |
| Emails not sending              | Verify `RESEND_API_KEY` is set and domain is verified in Resend      |
| Notifications not real-time     | Check SSE connection in browser DevTools (Network tab, EventStream)  |
| Rate limit errors (429)         | Reduce request frequency or increase limits in `lib/rate-limiter.ts` |

---

## License

This project includes a `LICENSE.txt` in the repository root. Review it for license details.
