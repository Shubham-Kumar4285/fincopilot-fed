# FinCopilot Frontend

React + Vite SPA for the FinCopilot API (`../backend`).

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8000/v1
npm install
npm run dev              # http://localhost:3000
npm run typecheck && npm run lint && npm run test && npm run build
npm run api:generate     # regenerate src/shared/api/schema.d.ts (backend must be running)
```

Layout:
- `src/app/`: router, providers, guards.
- `src/features/<name>/`: `api.ts`, `schemas.ts`, `pages/`, `components/`, `index.ts`.
- `src/shared/`: API client, UI kit, helpers.

Conventions live in [CLAUDE.md](CLAUDE.md) and `.claude/rules/`.
