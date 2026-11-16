# FinCopilot Frontend

React + Vite SPA (no SSR) for the FinCopilot API in `../backend`.
Design source of truth: [docs/FinCopilot-Frontend-Architecture.md](docs/FinCopilot-Frontend-Architecture.md).
Backend contract and conventions: `../backend/CLAUDE.md`.

## Stack (the only accepted choices)
React 19 · TypeScript strict · Vite · React Router 7 (data router) · TanStack Query · Zod · Tailwind 4 · Vitest + React Testing Library + MSW · openapi-typescript (via npx; it needs TypeScript 5)

## Commands
```bash
npm run dev     # http://localhost:3000 (strictPort; backend CORS allows only this origin)
npm run typecheck
npm run lint    # eslint, zero errors
npm run test    # vitest
npm run build   # production build
npm run api:generate   # regenerate API types from the running backend
```

## Definition of done
A task is complete only when `npm run typecheck && npm run lint && npm run test && npm run build` pass, and their output has been reported.

## Non-negotiables
1. Imports flow `app → features → shared`. `shared/` MUST NOT import from `features/` or `app/`.
2. All HTTP MUST go through `@/shared/api/client`. Components and hooks MUST NOT call `fetch`.
3. Server data MUST live only in the TanStack Query cache, never copied into `useState` or context.
4. The access token MUST live only in memory (`token-store.ts`). Tokens MUST NOT be written to Web Storage, IndexedDB or URLs.
5. Code MUST NOT use `any`, `@ts-ignore`, or default exports (tool config files excepted).
6. Every async view MUST render explicit loading, empty and error states.
7. Money MUST be handled as decimal strings and formatted by `shared/lib` helpers; it MUST NOT go through float arithmetic.

## Rules
Read the matching file before changing that area.

| Area | File |
|---|---|
| Folders, naming, TypeScript | [01-structure-typescript.md](.claude/rules/01-structure-typescript.md) |
| API client, backend contract, server state | [02-api-data.md](.claude/rules/02-api-data.md) |
| Routing, components, performance | [03-ui-routing-performance.md](.claude/rules/03-ui-routing-performance.md) |
| Auth, environment, security | [04-auth-security.md](.claude/rules/04-auth-security.md) |
| Testing | [05-testing.md](.claude/rules/05-testing.md) |
