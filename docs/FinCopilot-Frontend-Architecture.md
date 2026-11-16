# FinCopilot Frontend: Architecture, Conventions & Rules

> The single source of truth for how this frontend is structured and written. If code and this document disagree, fix one of them in the same pull request. Decisions that change this document are recorded in `docs/adr/`.

---

## 1. Principles

1. **One home for every concern.** HTTP client, token handling, env access, formatting, and error normalization each live in exactly one place. A second implementation is a bug.
2. **Feature-first structure.** Code is grouped by business capability (auth, organizations, invoicing), mirroring the backend modules. Technical grouping (all hooks together, all components together) is only for code shared across features.
3. **One-way dependencies.** `app` → `features` → `shared`. Never the reverse, and never sideways between features.
4. **The backend is the source of truth.** API types are generated from the backend OpenAPI schema, never hand-written. Totals, tax, and permissions are computed or enforced by the server. The client displays and requests, it does not decide.
5. **No speculative code.** No abstractions, props, hooks, or utilities until a second real use exists (rule of three for abstractions, rule of two for moving code into `shared`).
6. **Type safety is non-negotiable.** `any` is an error. Anything crossing the network boundary is typed from the schema or validated with Zod.

---

## 2. Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Build / dev server | Vite | Dev server on port **3000** (matches backend CORS and invite links) |
| UI | React + TypeScript (strict) | SPA, no SSR |
| Routing | React Router | Route-level code splitting |
| Server state | TanStack Query | The only place server data is cached |
| Forms | React Hook Form + Zod | One Zod schema per form, also used for input types |
| Styling | Tailwind CSS | Utility classes + CSS-variable design tokens |
| Components | shadcn/ui (Radix) | Source lives in `src/shared/ui`, owned by us |
| API types | openapi-typescript | Generated from the FastAPI schema |
| Lint / format | ESLint (flat config) + Prettier | Enforced in CI |
| Unit / integration tests | Vitest + React Testing Library + MSW | Network mocked at the boundary |
| Dead-code detection | knip | Unused files, exports, and dependencies fail CI |

Anything not in this table needs an ADR before it is added. In particular: **no global state library** (Redux, Zustand) until a concrete need is documented. Server state belongs to TanStack Query, auth and active-org state to React context, everything else to local component state.

---

## 3. Folder Structure

```
frontend/
├─ public/
├─ docs/
│  └─ adr/                      # architecture decision records (0001-title.md)
├─ src/
│  ├─ app/                      # composition root: wires everything, owns no business logic
│  │  ├─ providers/             # QueryClient, Auth, ActiveOrg providers
│  │  ├─ router/                # route tree, route guards, lazy route definitions
│  │  ├─ layouts/               # AppLayout, AuthLayout
│  │  └─ App.tsx
│  ├─ features/                 # one folder per business capability
│  │  ├─ auth/
│  │  ├─ organizations/         # org, members, invites (incl. accept-invite page)
│  │  ├─ files/                 # added with the File Storage backend module
│  │  ├─ documents/             # added with Document Ingestion
│  │  ├─ invoicing/             # clients, invoices, ledger
│  │  └─ <feature>/
│  │     ├─ api/                # request functions + TanStack Query hooks + query keys
│  │     ├─ components/         # feature-private components
│  │     ├─ hooks/              # feature-private non-query hooks
│  │     ├─ pages/              # route components, thin compositions
│  │     ├─ schemas.ts          # Zod schemas (forms, validated payloads)
│  │     ├─ types.ts            # feature types not derivable from the API schema
│  │     └─ index.ts            # the feature's public API (only thing others may import)
│  ├─ shared/                   # feature-agnostic code; imports nothing from app/ or features/
│  │  ├─ api/
│  │  │  ├─ client.ts           # the one HTTP client
│  │  │  ├─ token-store.ts      # in-memory access token
│  │  │  ├─ errors.ts           # ApiError + normalization
│  │  │  └─ schema.d.ts         # GENERATED, never edited, committed
│  │  ├─ ui/                    # shadcn primitives (button, dialog, input...)
│  │  ├─ components/            # app-wide composed components (PageHeader, EmptyState, ErrorBoundary)
│  │  ├─ hooks/                 # generic hooks (use-debounce, use-media-query)
│  │  ├─ lib/                   # pure utilities (cn, format-money, format-date)
│  │  └─ config/                # env.ts (validated), constants.ts
│  ├─ styles/
│  │  └─ index.css              # Tailwind layers + design tokens
│  ├─ test/                     # setup, MSW handlers, render helpers
│  └─ main.tsx
├─ .env.example                 # committed; real .env files are not
├─ components.json              # shadcn config (aliases point at src/shared/ui)
└─ vite.config.ts
```

### Placement decision

| Question | Answer |
|---|---|
| Used by one feature only? | Inside that feature. |
| Needed by a second feature? | Move it to `shared/`, in the same PR that adds the second use. |
| Knows about a business concept (invoice, org)? | It belongs in a feature, never in `shared/`. |
| Wires multiple features together (layout, router, providers)? | `app/`. |

---

## 4. Dependency Rules (enforced by ESLint)

```
app  ──►  features  ──►  shared
```

- `shared/` must not import from `features/` or `app/`.
- A feature must not import from another feature's internals. Cross-feature use goes through the other feature's `index.ts` only, and should be rare. If two features need the same thing, it probably belongs in `shared/` or is composed at the `app/` or page level.
- Files inside a feature import siblings with relative paths. Anything outside the feature uses the `@/` alias.
- No circular imports.
- Enforce with `no-restricted-imports` or `eslint-plugin-boundaries`. A violation fails CI.

---

## 5. Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Folders | `kebab-case` | `organizations/`, `use-cases/` |
| React component files | `PascalCase.tsx`, one component per file, file name equals component name | `InviteMemberForm.tsx` |
| Non-component files | `kebab-case.ts` | `token-store.ts`, `format-money.ts` |
| Hook files | `use-<name>.ts`, exporting `use<Name>` | `use-active-org.ts` → `useActiveOrg` |
| Test files | colocated, `<file>.test.ts(x)` | `client.test.ts` |
| Components, types, interfaces, enums | `PascalCase`, no `I` prefix | `OrgMember`, `InviteStatus` |
| Variables, functions | `camelCase` | `getActiveOrgId` |
| Constants | `SCREAMING_SNAKE_CASE` | `ACCESS_TOKEN_REFRESH_BUFFER_MS` |
| Booleans | `is` / `has` / `can` / `should` prefix | `isLoading`, `canInviteMembers` |
| Event handler props | `on<Event>`; internal handlers `handle<Event>` | `onSubmit`, `handleSubmit` |
| Query key factories | `<feature>Keys` | `orgKeys.members(orgId)` |
| Query hooks | `use<Resource>Query` / `use<Action>Mutation` | `useOrgMembersQuery`, `useCreateInviteMutation` |
| Zod schemas | `<name>Schema`; inferred types `<Name>Input` | `inviteFormSchema`, `InviteFormInput` |
| Env variables | `VITE_` prefix, `SCREAMING_SNAKE_CASE` | `VITE_API_URL` |
| Route paths | `kebab-case`, plural nouns | `/invoices`, `/invites/accept` |

**Exports:** named exports only. Default exports are allowed only for tool config files (`vite.config.ts`, `eslint.config.js`). Use `import type` for type-only imports.

**Feature `index.ts`:** exports only what other parts of the app are allowed to use (pages for the router, providers, a few hooks). Everything else stays private. There are no barrel files anywhere else.

---

## 6. API Layer

### 6.1 Types
- `src/shared/api/schema.d.ts` is generated from the backend OpenAPI schema and committed. Regenerate with `npm run api:generate` whenever the backend contract changes.
- Request and response types come from that file (`components["schemas"]["OrgInviteResponse"]`). **Never redeclare a backend shape by hand.** If a feature needs a narrower view, derive it with `Pick`/`Omit` from the generated type.
- Zod is for form input and client-side validation, not for duplicating response types.

### 6.2 The one client (`shared/api/client.ts`)
Responsibilities, and nothing else:
1. Prefix requests with `VITE_API_URL`.
2. Send `credentials: "include"` (refresh cookie).
3. Attach `Authorization: Bearer <token>` from `token-store`.
4. Attach `X-Org-Id` when an active org is set.
5. On `401`, call `/auth/refresh` **once** (single in-flight promise shared by all concurrent requests), then retry the original request once. If refresh fails, clear the session and redirect to login.
6. Normalize every failure into `ApiError { status, message, code? }` (`errors.ts`). Components never parse raw responses.

Features never call `fetch` directly.

### 6.3 Feature API files
Each feature's `api/` contains, per resource: plain request functions, a query key factory, and thin TanStack Query hooks.

```ts
// features/organizations/api/org-members.ts
export const orgKeys = {
  all: ["orgs"] as const,
  members: (orgId: string) => [...orgKeys.all, orgId, "members"] as const,
};

export function useOrgMembersQuery(orgId: string) {
  return useQuery({
    queryKey: orgKeys.members(orgId),
    queryFn: () => api.get("/orgs/current/members"),
  });
}
```

Rules:
- Query keys always include the **active org id** where data is org-scoped, so switching orgs never shows stale data from another tenant.
- Mutations invalidate by key factory, never by hand-typed arrays.
- Components consume hooks, never `useQuery` directly with inline keys or functions.

### 6.4 Domain data rules (finance)
- **Money is never a JavaScript float.** Amounts arrive as decimal strings and are displayed with `Intl.NumberFormat` through `shared/lib/format-money.ts`. Do not compute totals, tax, or balances on the client; the server returns them. If arithmetic is ever unavoidable, use a decimal library and record the reason in an ADR.
- Dates and timestamps are ISO strings in UTC. Parse and format only through `shared/lib/format-date.ts`.
- Currency always travels with the amount.

---

## 7. Authentication & Session

- The **access token lives in memory only** (`token-store.ts`, module scope). Never in `localStorage`, `sessionStorage`, cookies set by JS, or React state that could be serialized.
- The refresh token is an httpOnly cookie managed entirely by the backend. The frontend never reads it.
- **Boot sequence:** on app load, call refresh before rendering protected routes. Show a full-page loading state until it settles (success: authenticated, failure: unauthenticated).
- `AuthProvider` exposes `user`, `status` (`loading | authenticated | unauthenticated`), `login`, `logout`. It does not hold the token.
- Route guards live in `app/router/` and are the only place redirect-on-auth logic is written.
- **Active org:** `ActiveOrgProvider` holds the selected org id and feeds the client's `X-Org-Id` header. The id (not sensitive) may be persisted in `localStorage` under `fincopilot.activeOrgId`. This is the only permitted use of `localStorage` for session-related data.
- A user with **no organization** is routed to the create-org screen, not an error page.
- UI permission checks (hiding an "Invite" button for members) are cosmetic. The backend is the authority; always handle `403` gracefully.

---

## 8. State Management

| Kind of state | Where it lives |
|---|---|
| Server data (lists, details) | TanStack Query |
| Auth session, active org | React context (`app/providers`) |
| Form state | React Hook Form |
| URL state (filters, pagination, selected tab) | Router search params |
| Ephemeral UI state (modal open) | Local `useState` |

Do not copy server data into `useState` or context. Do not lift state higher than its lowest common parent.

---

## 9. Routing

- Route tree defined once in `app/router/`. Pages are lazy-loaded per route.
- Three route groups: **public** (login, signup, invite accept), **authenticated**, **authenticated + org required**.
- Pages are **thin**: they compose feature components and hooks. No request logic, no business rules.
- Invite links (`/invites/accept?token=...`) must survive the login/signup redirect: preserve the intended destination in the redirect, never in global state.

---

## 10. Components & UI

- **shadcn primitives** in `shared/ui/` are generated and then owned. Changes are allowed but deliberate (document why in the PR). Do not wrap them in a second layer unless adding real behavior.
- Compose primitives into app-wide components in `shared/components/` only after a second use.
- Components receive data via props and hooks; they do not know URLs or response shapes beyond what their hooks return.
- Guideline: a component file over ~250 lines should be split. A component with more than ~6 props probably wants composition (children, compound components) instead.
- **Styling:** Tailwind utilities only. Merge conditional classes with `cn()` from `shared/lib/utils`. No inline `style` unless a value is truly dynamic. No arbitrary values (`w-[137px]`) when a token or scale step exists. Colors, radii, and spacing come from the CSS-variable tokens in `styles/index.css`.
- **Responsive:** mobile-first. Base classes are the mobile layout, `sm:`/`md:`/`lg:` add to it.
- **Accessibility:** every input has a label; interactive elements are real `button`/`a` elements; dialogs trap and restore focus (Radix handles this, do not bypass it); color is never the only signal. `eslint-plugin-jsx-a11y` is on.
- Every data-driven view handles **loading, empty, error, and success** explicitly. Use the shared `EmptyState` and `ErrorBoundary`; do not invent per-page variants.

---

## 11. Forms

- One Zod schema per form in the feature's `schemas.ts`. The form's TypeScript type is inferred from it.
- Server-side validation errors (`4xx` from `ApiError`) are mapped onto fields where possible, otherwise shown as a form-level message.
- Submit buttons are disabled while submitting. Mutations are the only thing that performs side effects on submit.
- No client-side validation that the backend does not also enforce (the server is authoritative; the client is UX).

---

## 12. Error Handling

- `ApiError` is the only error type thrown by the client.
- Query/mutation errors are handled at the lowest sensible level (the form or the section), with one `ErrorBoundary` per route as the backstop.
- Never swallow errors silently and never `console.log` them. User-facing messages come from the backend `message` where safe, otherwise a generic fallback.
- Do not display raw stack traces or response bodies.

---

## 13. Environment & Configuration

- All env access goes through `shared/config/env.ts`, which validates `import.meta.env` with Zod at startup and exports a typed object. No `import.meta.env` anywhere else.
- Required: `VITE_API_URL`. Add new variables to `.env.example` and the Zod schema together.
- **Nothing in a `VITE_` variable is secret.** It ships to the browser. API keys and credentials never go in the frontend.

---

## 14. Code Quality Rules

**TypeScript:** `strict`, plus `noUncheckedIndexedAccess` and `noImplicitOverride`.

**ESLint (errors, not warnings):**
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/consistent-type-imports`
- `@typescript-eslint/no-floating-promises` and `no-misused-promises`
- `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`
- `jsx-a11y` recommended
- `eqeqeq`, `no-console` (allow none in `src/`), `no-restricted-imports` (dependency rules, section 4)
- No default exports outside tool config files

**Anti-redundancy checklist (reviewers enforce):**
- Is there already a hook, util, or component that does this? Search before writing.
- Is a backend type being redeclared? Use the generated one.
- Is the same server data stored twice (query cache and state)? Remove one.
- Is an abstraction added for a single use? Inline it.
- Does `npm run knip` pass (no unused files, exports, or dependencies)?
- Commented-out code, unused props, and `TODO` without an issue link are not merged.

**Formatting:** Prettier, no debates. Runs on commit via lint-staged.

---

## 15. Testing

- **What to test:** behavior a user or another module depends on. Priority: the API client (refresh single-flight, retry-once, header attachment), route guards, forms with validation and server errors, and any logic in `shared/lib`.
- **How:** Vitest + React Testing Library, query by role/label (not by class or test id unless unavoidable). Mock the network with MSW handlers in `src/test/`, never mock `fetch` or the client module itself.
- Tests are colocated with the code they cover. A bug fix starts with a failing test.
- Do not snapshot-test components.
- End-to-end tests (Playwright) are added once the invite, upload, and review flows exist. Until then they are out of scope.

---

## 16. Performance & Security Rules

**Performance**
- Route-level code splitting for every page. Heavy dependencies (charts, PDF viewers) are lazily imported where used.
- Do not add `memo`/`useMemo`/`useCallback` without a measured reason.
- Set sensible `staleTime` defaults on the QueryClient; do not refetch on every mount.
- Long lists are paginated server-side. Virtualize only when measured necessary.

**Security**
- No tokens or user data in browser storage (except the active org id, section 7).
- No `dangerouslySetInnerHTML`. Uploaded file contents and extracted document text are rendered as plain text.
- Client-side file type and size checks are UX only; the server enforces them. Uploads go straight to storage via signed URLs, with the signed URL used immediately and never stored.
- Dependencies are locked (`package-lock.json` committed). `npm audit` runs in CI. Add dependencies deliberately; each one is a supply-chain decision.
- Production hosting sets a strict Content-Security-Policy and standard security headers.

---

## 17. Git & Review Workflow

- Branches: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- Commits follow Conventional Commits (`feat(organizations): add invite form`).
- Pull requests are small and single-purpose. CI must pass: typecheck, lint, test, build, knip.
- **Definition of done** for any feature PR:
  - [ ] Types come from the generated schema (regenerated if the API changed)
  - [ ] Loading, empty, error, and success states handled
  - [ ] Works at mobile and desktop widths
  - [ ] Keyboard and screen-reader basics verified
  - [ ] Tests cover the behavior that could regress
  - [ ] No duplicated logic, no dead code, no new `any`
  - [ ] This document updated if a convention changed

---

## 18. Adding a New Feature (recipe)

1. Regenerate API types (`npm run api:generate`) after the backend endpoints exist.
2. Create `features/<name>/` with only the folders you need now (do not scaffold empty ones).
3. Write `api/` first: request functions, key factory, query/mutation hooks.
4. Add `schemas.ts` for any forms, then components, then thin pages.
5. Export pages and any intentionally shared pieces from `index.ts`.
6. Register routes in `app/router/` (lazy-loaded, correct guard group).
7. Add tests for the behavior that matters, then run the full CI command set locally.

---

## 19. Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Vitest |
| `npm run knip` | Dead code and unused dependency check |
| `npm run api:generate` | Regenerate `schema.d.ts` from the backend OpenAPI schema |

---

## 20. Backend Module Mapping

| Frontend feature | Backend module | Endpoint prefix |
|---|---|---|
| `auth` | IAM | `/v1/auth`, `/v1/users` |
| `organizations` | Org / Workspace | `/v1/orgs` |
| `files` | File Storage | `/v1/files` |
| `documents` | Document Ingestion | `/v1/documents` |
| `invoicing` | Invoicing & Ledger | `/v1/clients`, `/v1/invoices`, `/v1/transactions` |
| `categorization` | Categorization & Tax | `/v1/categories`, `/v1/tax-rules` |
| `dashboard` | Reporting | `/v1/dashboard`, `/v1/reports` |
| `chat` | AI Chat / RAG | `/v1/chat` |
| `notifications` | Notification | `/v1/notifications` |
| `billing` | Billing & Subscription | `/v1/billing` |

Features are added in the same order as the backend build order, and only when the backend module exists.
