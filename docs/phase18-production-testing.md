# Phase 18 — Production Testing

## Scope

Production-readiness testing covers authentication, API contracts, CRUD flows, analytics, realtime behavior, and deployment smoke checks.

## Test matrix

### AUTH
- Login success/failure
- Logout/session clearing
- Protected route access
- Role-restricted access

### API
- Success responses
- Validation failures
- Unauthorized requests
- Forbidden requests
- Not-found responses
- Server-error handling

### CRUD
- Workflows
- Tasks
- Preventive rules
- Users
- Settings

### ANALYTICS
- Dashboard
- Forecast
- Prediction
- Anomaly

### REALTIME
- Notification delivery
- Operational event propagation

## Verification commands

```bash
npm --prefix server test
npm --prefix server run lint
npm --prefix client run lint
npm --prefix client run build
```

The server currently defines no lint script, so that check must be reported as unavailable unless a server lint tool already exists. Do not add a new lint stack solely for this phase.

Backend startup: `npm --prefix server start`.
Frontend smoke test: serve the production build and exercise login, protected navigation, representative APIs, and analytics against the configured API URL.

## Evidence policy

A test is passed only when its command executes successfully. Environment-dependent checks such as MongoDB, production API URLs, and Vercel deployment checks must be explicitly reported as not executed when those dependencies are unavailable.

## Blocking-error policy

Fix failures that prevent the application from starting, building, authenticating, authorizing, or serving core APIs. Do not hide failures by weakening assertions or skipping tests.
