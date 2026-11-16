---
paths:
  - "src/features/auth/**"
  - "src/shared/api/**"
  - "src/shared/config/**"
  - "src/app/**"
  - ".env*"
  - "index.html"
---
# Auth, Environment & Security

## Session (source: `../backend/.claude/rules/06-auth-multitenancy.md`)
- The access token is held only in `tokenStore` (memory). On load, the session is restored with `POST /auth/refresh` (httpOnly cookie) before guarded routes render.
- Code MUST NOT read or log the refresh cookie, or persist tokens anywhere.
- The active workspace id (not a secret; the backend checks membership on every request) is the only auth-adjacent value in `localStorage` (`features/organizations/active-org.ts`). Logout and session expiry clear it.
- Logout MUST, in order:
  1. Call `POST /auth/logout`.
  2. `tokenStore.clear()`.
  3. `queryClient.clear()`.
  4. Navigate to `PATHS.login`.
- Role and plan gates (`is_admin`, `plan_tier`) only hide UI. The backend enforces authorization, so gated actions still handle a 403.
- Auth copy MUST NOT reveal whether an account exists. Forgot-password always shows the same success message.

## Environment
- Env access MUST go through `@/shared/config/env` (Zod-validated). Direct `import.meta.env` elsewhere is forbidden.
- Only `VITE_*` variables. Every `VITE_*` value ships to the browser and MUST NOT contain secrets or credentials.
- A new variable is added to the env schema, `.env.example` and `ImportMetaEnv` in the same change. `.env` is never committed.

## Security
- `dangerouslySetInnerHTML` is forbidden, unless the input is DOMPurify-sanitized and the code has a comment explaining why.
- `target="_blank"` requires `rel="noopener noreferrer"`.
- Redirect targets read from the URL (`?next=`) MUST be validated against `PATHS` before navigating.
- `console.*` is forbidden in `src/` (except startup env failures). Tokens, PII, PAN/GSTIN and bank numbers are never logged or rendered unmasked.
- Client-side file type and size checks are UX only. The backend is authoritative.
