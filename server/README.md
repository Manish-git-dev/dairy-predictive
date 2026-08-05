# Dairy Predictive Operations Command Center — Backend

Node.js + Express + MongoDB (Mongoose) backend providing a multi-tenant,
role-based API for dairy supply-chain predictive operations.

## Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB via Mongoose
- **Auth:** JWT + bcrypt
- **Validation:** Zod
- **Security:** CORS, per-IP rate limiting
- **AI:** Google Gemini (server-side only)

## Architecture

```
routes → middleware (auth / rbac / validation) → controllers → services → models
```

- `models/` — Mongoose schemas (single source of truth)
- `services/` — business logic, organisation-scoped queries
- `controllers/` — thin HTTP handlers, delegate to services
- `routes/` — Express routers mounted under `/api/v1`
- `middleware/` — auth, RBAC, org isolation, validation, rate limiting, audit logging, errors
- `validators/` — Zod schemas per resource
- `jobs/` — scheduled background tasks (SLA breach checks, forecast generation)
- `utils/` — pagination, CSV export, API error, constants

## Roles (RBAC)

| Role        | Key | Access |
|-------------|-----|--------|
| Operations Admin | `ops_admin` | Full system access |
| Manager | `manager` | Operations, tasks, approvals, reports |
| Analyst | `analyst` | Analytics, forecasts, anomalies, reports |
| Field Staff | `field_staff` | Collection, testing, assigned tasks |

## Organisation / tenant isolation

Every data query is scoped by `organization` derived from the authenticated
user via `organizationMiddleware`. Users can only read or mutate data that
belongs to their own organisation.

## Security

- Secrets loaded from environment variables — never hardcoded.
- `GEMINI_API_KEY` is used server-side only and never sent to the client.
- Passwords hashed with bcrypt (cost 12); hashes are never returned in responses
  (the `User.toJSON` method strips `password` and `refreshToken`).
- Per-IP rate limiting on auth routes and globally.
- AI recommendations are **decision support only** — material actions
  (payments, route changes, suspensions) require human approval via the
  approvals workflow.

## Getting started

```bash
# from the server/ directory
npm install
cp .env.example .env      # then edit values
npm run seed              # load development data
npm run dev               # start the API (nodemon)
```

The server listens on `PORT` (default 4000).

## API base path

All endpoints are mounted under `/api/v1`.

### Health

```
GET /api/v1/health
```

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login, returns JWT |
| GET  | `/auth/me` | Current user (auth required) |
| POST | `/auth/logout` | Logout |

### Resources

Users, roles, farmers, collection centres, milk lots, quality tests, tankers,
batches, products, inventory, payments, tasks, SLA rules, alerts, workflows,
dashboard, forecasts, anomalies, AI (explain/recommend/runs), approvals,
notifications, reports, audit logs, settings, KPIs, risk scores — each under
`/api/v1/<resource>`.

All list endpoints support `page`, `limit`, `search`, and resource-specific
filters via query string.

## Seed data

`npm run seed` creates a demo organisation (`Amul Dairy Cooperative`), four
users (one per role), farmers, collection centres, 30 days of milk lots,
quality tests, batches, products, inventory, payments, tasks, SLA rules,
alerts, anomaly events, approvals, AI runs, notifications, KPI snapshots,
configurations and audit logs.

### Test credentials

| Role | Email | Password |
|------|-------|----------|
| Ops Admin | admin@dairyops.com | Admin@123 |
| Manager | manager@dairyops.com | Manager@123 |
| Analyst | analyst@dairyops.com | Analyst@123 |
| Field Staff | field@dairyops.com | Field@123 |

## Background jobs

- `notificationJob` — scans for overdue tasks, marks SLA breaches, raises
  alerts and notifies assignees.
- `forecastJob` — regenerates demand and workload forecasts per organisation.
