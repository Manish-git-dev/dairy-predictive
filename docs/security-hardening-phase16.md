# Phase 16 — Production Security Hardening

## Security audit result

### Authentication / JWT

- JWT verification requires `JWT_SECRET`; there is no fallback secret.
- JWTs have an expiration controlled by `JWT_EXPIRES_IN` with the existing one-day fallback retained for compatibility.
- Authentication reloads the current User from MongoDB, checks account activity, role validity, and organization membership instead of trusting role/tenant claims alone.
- Login now rejects inactive users and inactive organizations with the same generic credential error.
- Passwords are hashed by the existing bcrypt pre-save hook.
- Public registration no longer accepts a client-supplied role or organization. Public registration is disabled unless explicitly enabled and configured with `REGISTRATION_ORGANIZATION_ID`; enabled public accounts are always `field_staff`.

### Authorization / RBAC

All non-health/non-auth API routes are behind authentication, organization context, and the database-backed permission middleware. This means frontend hiding is not the authorization boundary.

### CORS

Production now requires `CLIENT_URL`. The previous localhost fallback is not used in production. Origins other than the configured client origin are rejected by the CORS policy.

### Rate limiting

Global IP rate limiting remains enabled, with a stricter limiter on login/register routes. The current limiter is process-local; a distributed Redis-backed limiter should be introduced if the API is deployed across multiple independent instances.

### Request validation

Auth requests use strict Zod schemas. Registration cannot inject `role` or `organization` fields. Body-size limits were reduced from the previous 10 MB JSON default to 1 MB (configurable by environment) and URL-encoded bodies are limited to 100 KB by default.

### MongoDB injection

Mongoose `sanitizeFilter` and `strictQuery` are enabled globally. Application services should continue to construct allow-listed query objects rather than passing arbitrary request query objects into MongoDB.

### XSS / browser hardening

The API does not use server-side HTML rendering. React's normal escaping remains the frontend protection boundary. The API now sends `nosniff`, frame-deny, Referrer-Policy and Permissions-Policy headers, plus HSTS in production.

### Error handling / secrets

Stack traces are no longer returned in API responses. Server logs use request IDs and error names/messages without logging request bodies or authorization headers. MongoDB connection logs no longer print raw database error objects, reducing accidental exposure of connection details.

### API exposure

The route index exposes health and authentication without authentication; all operational/admin routes are behind `authenticate`, `setOrganization`, and `authorizeByPermission`.

## Remaining deployment considerations

1. Set `JWT_SECRET` to a long random secret in Vercel/server environment variables; never commit it.
2. Set `CLIENT_URL` to the exact production frontend origin.
3. Set `JWT_EXPIRES_IN` explicitly for the desired session lifetime.
4. Keep `ALLOW_PUBLIC_REGISTRATION=false` unless a controlled onboarding flow is intentionally required.
5. If public registration is enabled, set `REGISTRATION_ORGANIZATION_ID` to the intended tenant.
6. For multi-instance production deployment, replace the process-local rate limiter with a shared store.
7. Ensure `NODE_ENV=production` in the deployment environment so HSTS is enabled.
