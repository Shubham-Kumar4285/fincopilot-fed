---
paths:
  - "src/**"
  - "tsconfig*.json"
  - "eslint.config.js"
---
# Structure & TypeScript

## Layout (mirrors backend `app/modules/<feature>`)
- `src/app/`: composition root (router, providers, layouts). It MUST NOT contain business logic or data fetching.
- `src/features/<feature>/` is flat: `api.ts` (requests, query keys, hooks), `schemas.ts` (Zod), `pages/`, `components/`, `index.ts`. Add `hooks/` or split `api.ts` into `api/` only once the feature passes ~10 files. Feature names MUST match backend module names.
- `src/shared/`: feature-agnostic code (`api/`, `ui/`, `hooks/`, `lib/`, `config/`). Shared components that need an app path take it as a prop (e.g. `<Wordmark to={PATHS.landing} />`). Code that knows a business concept (invoice, org) MUST NOT live in `shared/`.
- Code moves to `shared/` only when a second feature needs it, in the same change.
- Cross-feature imports MUST go through the other feature's `index.ts`, which exports hooks, keys, types and the few components other features or `app/` embed (e.g. `OrgSwitcher`), never pages. No other barrel files are allowed.
- `app/router.tsx` is the only place that imports page modules (`@/features/x/pages/XPage`), lazily, so every page stays out of the entry chunk.
- Dependency direction is enforced by ESLint: `features/` cannot import `app/`; `shared/` cannot import either. App-wide constants (`PATHS`) live in `shared/config/`.
- Inside a feature, imports MUST be relative; across boundaries they MUST use `@/`.

## Naming
- Components: `PascalCase.tsx`, file name = main component. Non-component exports (class helpers, clients) live in their own `kebab-case.ts` so Fast Refresh works.
- Other files: `kebab-case.ts`. Hooks: `use-x.ts` exporting `useX`.
- Query hooks: `use<Resource>Query` / `use<Action>Mutation`. Key factories: `<feature>Keys`. Zod: `<name>Schema` → `<Name>Input`.
- Booleans use an `is/has/can/should` prefix. Handler props are `onX`; internal handlers are `handleX`. Constants are `SCREAMING_SNAKE_CASE`.
- Named exports only.

## TypeScript
- `tsconfig.app.json` MUST keep `strict`, `noUncheckedIndexedAccess` and `noImplicitOverride` enabled.
- Code MUST NOT use `any`, `as unknown as`, `@ts-ignore`, or non-null `!` on external data.
- `eslint-disable` MUST name the rule and give a one-line reason.
- Type-only imports MUST use `import type`.
- Caught errors are `unknown`. Narrow them with `instanceof ApiError` before reading fields.
- Backend shapes MUST come from the generated `shared/api/schema.d.ts` (`npm run api:generate`). Hand-written copies of response types MUST NOT exist; narrow them with `Pick`/`Omit`.

## Hygiene
- Each helper has exactly one implementation. Search `src/` before adding a hook, util or component.
- Forms MUST validate with the feature's Zod schema. Parallel hand-written validators MUST NOT exist.
- Dead code, commented-out code and unused exports MUST NOT be merged.
