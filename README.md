# LMS (Learning Management System)

A full-featured LMS built with Next.js, TypeScript, Prisma and many modern web technologies. This repository contains a production-ready web application with teacher and student roles, course management, live streaming, analytics, quizzes, assignments, notes, certificates, and payments.



## Key Features

- Authentication
  - Email/password and Google OAuth via NextAuth
  - Role-based access (Teacher, User/Student, Admin)
- Course Management (Teacher)
  - Create, edit and publish courses
  - Chapters, videos and live sessions
  - Assignments, quizzes and final exams
  - Certificates and certificate templates
- Student Experience
  - Enroll in courses, watch videos, progress tracking
  - Notes, favorites, watch-later and course certificates
  - Quiz attempts and assignment submissions
- Live Streaming
  - Agora-powered live streaming for teachers and student viewers
  - Single-screen teacher UI (simplified interface)
  - Chat & polls for interactive sessions
- Analytics
  - Teacher analytics (earnings, enrollments, student performance)
  - Student analytics (personal learning metrics)
- Payments
  - Stripe integration for course purchases (checkout + webhooks)
- File uploads
  - UploadThing integration for file uploads
- PDF generation, plagiarism checks, and more utility features

## Tech Stack

- Next.js (App Router) 14.x
- React 18
- TypeScript
- Prisma (MongoDB)
- NextAuth for authentication
- Agora for live streaming
- Stripe for payments
- UploadThing, Mux
- Tailwind CSS
- Recharts / Chart.js for analytics

## Quickstart (Development)

Requirements:
- Node 18+ (LTS recommended)
- npm
- MongoDB connection (Mongo Atlas or local)

1. Clone the repo

```powershell
git clone https://github.com/dheerajsingh9334/LMS.git
cd LMS
```

2. Install dependencies

```powershell
npm install
```

3. Generate Prisma client (postinstall runs `prisma generate` automatically on `npm install`)

4. Create a `.env` from the example and fill values (do NOT commit `.env`):

```powershell
cp .env.example.txt .env
# Edit .env in an editor and set real credentials
notepad .env
```

Important: The repository's `.env.example.txt` was sanitized to remove secrets. Do NOT commit real secrets. Use environment variables in your hosting provider or GitHub Secrets for CI.

5. Run development server

```powershell
npm run dev
# Open http://localhost:3000
```

6. Build for production

```powershell
npm run build
npm start
```

## Available NPM Scripts

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run seed` - Run DB seed (uses ts-node)

## Important Environment Variables

See `.env.example.txt` for placeholders. Key vars include:

- `DATABASE_URL` - MongoDB connection string
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` - NextAuth settings
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth
- `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE` - Agora credentials for live streaming
- `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID` - UploadThing
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY` - Stripe keys
- `WEBSOCKET_URL` - WebSocket server URL (if used)

## Security & Secrets

- Do NOT commit secrets to Git. Use `.env` locally and GitHub repository secrets / environment variables in production.
- If you accidentally committed secrets, rotate them immediately.
- This repository previously contained secrets in `.env.example.txt`; those were removed and the branch rewritten to remove them. If you pulled before the rewrite, reset your clone to the new `origin/dev`:

```powershell
git fetch origin
git switch dev
git reset --hard origin/dev
```

## Deployment Notes

- Set environment variables in your hosting provider (Vercel, Render, Fly, etc.).
- Ensure you provide the production `NEXTAUTH_SECRET` and `DATABASE_URL` (securely).
- For live streaming (Agora), configure `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` as secrets.
- Configure webhooks for Stripe and set `STRIPE_WEBHOOK_SECRET`.

## Contributors & Contributing

Contributions welcome. Please follow these steps:
1. Fork the repo
2. Create a branch for your feature/fix
3. Open a PR with a clear description

Prefer small focused PRs and include tests for significant logic when possible.

## Troubleshooting

- If you see push rejections mentioning "repository rule violations" or secret scanning, remove the sensitive data from commits, rotate the exposed keys, and force-push if you amended history.
- If you experience hydration or client/server issues, ensure server components do not import client-only modules. Use dynamic imports and client wrappers where needed.

## License

This project includes a `LICENSE.txt` in the repository root. Review it for license details.

---

If you want, I can:
- Expand the README with detailed architecture diagrams and routes.
- Add a `CONTRIBUTING.md` and `SECURITY.md` with rotation and reporting guidance.
- Add a pre-commit hook to prevent committing `.env` or secrets.

Which of those would you like next?
