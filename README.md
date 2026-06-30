
# Bulk Email Verifier

Full-stack bulk email verification system with an Express/TypeScript backend and a Parcel-powered React frontend.

- TypeScript configuration
- Express server
- Security middleware
- Request logging
- Centralized error handling
- API routing foundation
- Health check endpoint
- Secure in-memory CSV/TXT upload with Multer
- CSV/TXT parsing services designed for unit tests
- Reusable email syntax validation service with structured validation results
- Reusable DNS/MX verification service using Node.js `dns/promises`
- Reusable SMTP verification service with EHLO, MAIL FROM, RCPT TO, QUIT, retries, timeouts, and catch-all detection
- Controlled-concurrency verification pipeline with progress snapshots
- React, React Router, TypeScript, Parcel, and Tailwind CSS frontend

## Scripts

```bash
npm install
npm run dev
npm run dev:frontend
npm run build
npm run build:frontend
npm run build:all
npm start
```

Local development usually runs two processes:

```bash
npm run dev
API_BASE_URL=http://127.0.0.1:8000 npm run dev:frontend
```

Production runs one process. `npm run build:all` compiles the backend into `dist/`
and the frontend into `dist-frontend/`; `npm start` serves both the API and the
React app from Express.

## Endpoints

```text
GET /api/health
GET /api/verification
POST /api/verification/uploads
POST /api/verification/jobs
GET /api/verification/jobs/:jobId
GET /api/verification/jobs/:jobId/results.csv
```

`POST /api/verification/uploads` accepts one multipart field named `file`.

The upload response includes parsed emails plus `syntaxValidation`, which reports total,
valid, invalid, and per-email validation results.

DNS/MX verification is part of the full background verification job flow.

SMTP verification is implemented as a reusable backend service. It never sends `DATA`;
it terminates each probe with `QUIT` after the `RCPT TO` response.

## Environment

Copy `.env.example` to `.env` for local configuration.

Important variables:

- `PORT`: backend port, managed by most hosts in production.
- `HOST`: bind host, usually `0.0.0.0` in production.
- `CORS_ORIGIN`: `*` or comma-separated allowed origins.
- `UPLOAD_MAX_BYTES`: maximum upload size for CSV/TXT files.
- `VERIFICATION_CONCURRENCY`: controlled concurrency limit for bulk jobs.
- `DNS_LOOKUP_TIMEOUT_MS`: DNS/MX lookup timeout.
- `SMTP_TIMEOUT_MS`, `SMTP_RETRIES`, `SMTP_PORT`, `SMTP_HELO_HOST`, `SMTP_MAIL_FROM`: SMTP probe settings.
- `API_BASE_URL`: frontend build-time API base URL only when frontend and backend are hosted separately.

## Deployment

Render is configured in `render.yaml` as a single Node web service:

```bash
npm ci && npm run build:all
npm start
```

The Express server serves `/api/*` backend routes and the compiled React frontend
from `dist-frontend/`.

Many cloud providers block outbound SMTP port `25`. If port `25` is unavailable,
SMTP checks may return `Unknown/Error` even when syntax and MX checks pass.

