---
paths:
  - "src/shared/api/**"
  - "src/features/**/api/**"
  - "src/features/**/hooks/**"
  - "src/app/providers/**"
---
# API Client, Backend Contract & Server State

## Backend contract (source: `../backend/.claude/rules/08-errors-logging.md`)
- Base URL is `env.VITE_API_URL` (includes `/v1`). Request paths MUST be relative (`"/orgs/current"`).
- A success body is the endpoint's `response_model` JSON. An error body is always `{ data: null, meta: {}, error: { message, details } }`; on 422, `details.errors[]` holds `{ field, message, type }`.
- `parseErrorResponse` MUST read `error.message` and `error.details`.
- Every failure, network errors included (status `0`), MUST become `ApiError { status, message, details }`.
- UI MUST branch on `status`, never on message text:
  - 401: re-authenticate.
  - 403: forbidden, or no org (send the user to create or join an org).
  - 404: not found.
  - 409: conflict.
  - 422: map `details.errors[].field` onto form fields.
- API types keep the backend's snake_case. Conversion to form shapes happens only in mappers in `features/<x>/api/`.
- `X-Org-Id` is attached by the client via `setActiveOrgId()`. Components MUST NOT set headers. Session expiry is reported through `configureClient({ onSessionExpired })`, which the app wires up.

## Client invariants (`shared/api/client.ts`)
- On 401: run one shared in-flight refresh, then retry the original request exactly once. A second 401 throws.
- A 204 response resolves to `undefined` for every HTTP method.
- The client navigates only on refresh failure (to `PATHS.login`). All other UX belongs to callers.

## Validation at the boundary
- Responses that drive auth, routing or money MUST be parsed with Zod in the feature `api/` function before use. This covers login, refresh, `/users/me`, `/orgs/current` and invoice totals.
- Form schema limits MUST equal the backend Pydantic `Field` constraints (lengths, patterns such as GSTIN/PAN).

## Server state (TanStack Query)
- Each feature `api.ts` contains, in order: request functions, key factory, thin `useQuery` / `useMutation` hooks. Request bodies are typed `Schema<"XRequest">` from `@/shared/api/types`.
- Query keys MUST come from factories. Tenant data keys MUST include `orgId`.
- Data fetching in `useEffect` is forbidden.
- Mutations MUST invalidate or update exactly the keys they affect. Org switch and logout MUST call `queryClient.clear()`.
- Independent queries MUST run in parallel. Route data is prefetched in loaders (`queryClient.ensureQueryData`), not fetched by nested components in sequence.
- QueryClient defaults: `staleTime` ≥ 30s, no retry on 4xx. Per-query overrides need a comment.

## State placement
| Kind | Where it lives |
|---|---|
| Server data | Query cache |
| Shareable view state (filters, page, tab, selected id) | URL search params |
| Ephemeral UI state | Local `useState` |
| Session, active org | One context each |

Nothing else is global.
