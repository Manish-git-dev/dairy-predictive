# Phase 0.10 — Performance / Index / Aggregation Audit

## Scope

Audited the organization-scoped service queries, dashboard/report aggregation paths, and MongoDB schemas used by the production API.

## Completed index hardening

Added tenant-aware compound indexes to the highest-frequency operational collections:

- MilkLot: organization + createdAt, collectionDate, farmer + createdAt, status + createdAt
- QualityTest: organization + createdAt, testDate, grade/result + createdAt, milkLot
- Batch: organization + createdAt, status + createdAt, product + createdAt
- Tanker: organization + createdAt, status + createdAt, route.estimatedArrival
- Payment: organization + createdAt, farmer + createdAt, status + createdAt, payment period
- CollectionCentre: organization + isActive, organization + createdAt
- Farmer: organization + isActive, organization + createdAt, phone
- Alert: organization + acknowledged/severity + createdAt, type + createdAt
- Inventory: organization + status + createdAt, expiryDate, product, batch
- AiRun: organization + createdAt, type + createdAt, status + createdAt
- Approval: organization + status + createdAt, reviewer/requester + createdAt
- KpiSnapshot: organization + date, period + date
- AuditLog: organization + timestamp, resource/resourceId + timestamp, user + timestamp
- OperationalEvent: organization + createdAt, eventType + createdAt, entity + createdAt
- SlaRule: organization + stage/isActive, organization + createdAt

Existing strong indexes were retained on Notification, AnomalyEvent, Prediction, ReportRun, Configuration and Task.

## Aggregation audit findings

### P0 — no correctness blocker found

Primary list/detail queries consistently include organization scope and pagination.

### P1 — dashboard can become expensive at scale

`dashboardService.getOverview()` currently loads all MilkLot, QualityTest, Batch, Tanker and Payment documents for the selected date range and calculates totals in Node.js. It uses `.lean()` and projections, which is better than hydrated documents, but large tenants can still transfer and materialize many rows.

Recommended next optimization: replace these five range reads with MongoDB `$match` + `$group` aggregation pipelines so the database returns only scalar metrics. Preserve the current response contract and test against the existing dashboard integration suite before merging.

### P1 — forecast history is row-oriented

`forecastService.getHistory()` and baseline forecast generation read historical operational records into application memory. The current history is bounded to 365 days, but a high-volume tenant can still produce a large result set.

Recommended next optimization: aggregate daily milk/batch volumes in MongoDB before calculating the moving average.

### P1 — anomaly scan is bounded but still document-oriented

Anomaly detection reads up to 1,000 records per source collection. This protects the API from unbounded reads, but the statistical calculations still happen in Node.js.

Recommended next optimization: aggregate statistics server-side where practical and introduce an explicit sampling/analysis policy for high-volume tenants.

### P2 — report generation is already mostly database-friendly

Daily operations reports use MongoDB aggregation pipelines. Other report types use indexed date/organization filters and streaming cursors for CSV export, which avoids loading the complete CSV dataset into application memory.

### P2 — regex search

Some list/report searches use case-insensitive regex. These are not generally index-friendly when the pattern is not a prefix. Keep them bounded with pagination and consider Atlas Search or normalized prefix/search fields if search volume becomes significant.

## Operational note

Mongoose will create declared indexes when index creation is enabled for the deployment. Production environments should explicitly manage index creation/migrations rather than relying on ad-hoc startup behavior.

## Validation status

The audit and index changes were committed to the repository. Runtime query-plan verification (`explain('executionStats')`) and full integration-test execution require a running application/database environment and were not claimed as completed by this audit.
