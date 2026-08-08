# Phase 15 — Database Hardening Audit

## Scope

This phase audits the MongoDB/Mongoose layer without deleting or rewriting production documents.

## Findings

### Validation

- Organization is required on the primary operational models and is indexed.
- Most operational models use Mongoose timestamps.
- Several schemas still permit nullable numeric/date fields by design; these should remain nullable where the business process can legitimately create an incomplete record.
- KPI snapshots and prediction records are now stricter: required dates/periods and finite bounded numeric values are validated at write time.
- Audit integrity was reviewed; the existing model already contains organization, actor, action, resource, change and request metadata fields.

### References

Reference integrity is enforced in service-layer writes for the main cross-tenant references introduced in Phase 0.9. The Phase 15 audit migration also detects orphaned references without deleting them.

### Indexes

Existing organization-scoped indexes are already present on the high-volume operational collections. Additional indexes were identified from actual query patterns for:

- Product listing by organization + active status + creation time
- Product filtering by organization + category + active status
- Permission lookup by resource + action
- Organization active-state + creation-time administration queries
- KPI snapshot organization + period + date queries

These indexes are created by the explicit migration command rather than relying on production auto-index creation.

### Query/aggregation performance

- Farmer listing now searches fields that actually exist in the schema and uses deterministic newest-first ordering.
- Farmer performance now uses a MongoDB aggregation instead of loading every milk lot into Node.js memory.
- Existing paginated services retain server-side skip/limit pagination.
- Report generation already uses server-side aggregation/streaming patterns where appropriate.

### Duplicate records

Potential duplicate groups were identified for organization-scoped identifiers and KPI snapshots. The migration reports duplicates before any unique constraint is attempted. It never deletes records automatically.

### Invalid/null/NaN data

The migration is read-only by default and reports string-typed date anomalies for audited date fields. Mongoose write-time validation was strengthened for KPI numeric metrics and prediction probabilities/periods. Existing invalid records are not silently modified.

## Safe migration commands

From `server/`:

```bash
npm run db:audit
```

This performs a **read-only audit**.

After reviewing the audit output:

```bash
npm run db:harden
```

This applies only the explicitly listed non-destructive indexes. It does not delete or rewrite documents.

## Production safety

- No production documents are deleted.
- No existing data is rewritten by the migration.
- Unique constraints are not introduced automatically where duplicate groups may already exist.
- Duplicate checks run before any future unique-index migration is considered.
- Orphaned references are reported, not deleted.

## Remaining items for a future data-quality migration

1. Review any duplicate groups reported by the audit command.
2. Review orphaned references and decide business-specific repair rules.
3. Consider organization-scoped uniqueness for identifiers currently globally unique only after duplicate analysis.
4. Run MongoDB `explain('executionStats')` against production-like data to validate index selectivity and aggregation cost.
