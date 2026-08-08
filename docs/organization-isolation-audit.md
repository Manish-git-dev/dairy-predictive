# Organization Isolation Audit — Phase 0.9

## Scope

The protected API boundary is established in `server/src/routes/index.js`:

1. JWT authentication
2. organization context
3. database-backed resource/action permission check
4. resource router

`health` and `auth` endpoints are intentionally outside the organization boundary. Authenticated `/me` establishes organization context explicitly.

## API coverage

The mounted protected resources were audited against the organization boundary:

- users
- farmers
- collection-centres
- milk-lots
- quality-tests
- tankers
- batches
- products
- inventory
- payments
- tasks
- sla-rules
- alerts
- workflows
- dashboard
- forecasts
- predictions
- anomalies
- preventive-rules
- ai
- approvals
- notifications
- reports
- audit
- settings
- roles
- kpi
- risk

The current route registry no longer imports the previously missing `predictionRoutes` or `preventiveRuleRoutes`; those endpoints are intentionally absent until their implementations are added.

## Findings

### Pass — direct tenant queries

The audited data services consistently accept `organizationId` from server-side request context and use it in their primary reads, updates, deletes, counts and aggregations. Client-supplied organization IDs are not used as the tenant selector.

Examples include dashboard, forecast, anomaly, task, workflow, notification, report, audit, configuration, role and user administration.

### Fixed — organization reference injection

A tenant-scoped document could previously contain a reference to another organization's document when the referenced ID was accepted directly from request data. This is especially important because Mongoose `populate()` can expose the referenced document after the parent document itself has passed an organization filter.

Added `server/src/utils/organizationReferences.js` and applied it to:

- MilkLot → Farmer, Tanker, Batch
- QualityTest → MilkLot, Tester/User
- Batch → MilkLot, Product
- Inventory → Product, Batch

References are now required to belong to the active organization before they are persisted or changed.

### Fixed — active organization enforcement

`organizationMiddleware` now verifies that the authenticated organization still exists and is active before setting `req.organizationId`.

### Existing protections confirmed

- Users are queried with organization scope.
- Task assignees must belong to the same organization.
- Farmer performance reads milk lots with the same organization.
- Notifications are scoped by both recipient and organization.
- Reports use organization-scoped queries and aggregations.
- Forecasts and anomaly detection use organization-scoped source data and stored runs/events.
- Roles are queried by both role name and organization.
- Configuration keys are scoped by organization.
- Audit logs are scoped by organization.
- Approvals are scoped by organization.

## Remaining hardening candidates

These are not currently identified as direct cross-tenant reads, but should remain on the security backlog:

1. Validate all dynamic `Approval.relatedEntity` references against their concrete model and organization before allowing population.
2. Validate farmer ownership explicitly in payment calculation before creating a payment. The underlying milk-lot query is organization-scoped, but the farmer reference should also be validated at the service boundary.
3. Add compound indexes such as `{ organization: 1, <frequent filter>: 1 }` where query volume warrants them.
4. Add automated cross-organization tests for each major resource, not only user administration.

## Security invariant

For every protected tenant resource:

`tenant = req.organizationId`

and not:

`tenant = request.body.organization`

or

`tenant = request.query.organization`.

Any resource reference supplied by a client must also resolve inside `req.organizationId` before it is persisted.
