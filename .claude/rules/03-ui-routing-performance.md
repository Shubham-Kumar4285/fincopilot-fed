---
paths:
  - "src/app/**"
  - "src/features/**/components/**"
  - "src/features/**/pages/**"
  - "src/shared/ui/**"
  - "src/shared/components/**"
  - "src/styles/**"
  - "vite.config.ts"
  - "index.html"
---
# Routing, Components & Performance

## Routing (React Router 7 data router)
- Route paths MUST come from `app/paths.ts` (`PATHS.x`). Hard-coded path strings are forbidden.
- Every page route MUST be lazy-loaded (route `lazy` or `React.lazy`) with a `Suspense` fallback.
- Pages compose; they don't implement. A page reads params, calls hooks and renders feature components (≤ 80 lines).
- Protected routes MUST sit under a guard layout that restores the session before rendering. Org-scoped routes add an org guard.
- Every route subtree MUST define an `errorElement` that offers a retry.

## Components
- One responsibility per component. Split above ~150 lines, or when a component owns more than one async resource.
- Async views MUST render:
  - Loading: a skeleton matching the final layout.
  - Empty: with a primary action.
  - Error: the `ApiError.message` plus a retry.
- Forms MUST:
  - Label every input.
  - Show field errors from Zod or from 422 `details`.
  - Disable submit while pending.
  - Use `noValidate`.
- Interactive elements MUST be `<button>` or `<a>`. Decorative icons get `aria-hidden`; icon-only buttons get an `aria-label`.
- Styling MUST use Tailwind utilities and the `@theme` tokens in `styles/index.css` (`bg-canvas`, `text-secondary`, `border-line`, `rounded-control`). Inline hex colors are forbidden. Join conditional classes with `cn()` from `@/shared/lib/cn`.
- `.css` files are allowed only in `src/styles/`, and only for complex keyframe choreography that utilities can't express (currently `ledger.css`).
- Animations MUST respect `useReducedMotion`.

## Performance
- `<img>` MUST set `width`, `height` and `alt`. Below-the-fold media also sets `loading="lazy"` and `decoding="async"`.
- Heavy libraries (charts, PDF, editors) MUST be dynamically imported at the point of use, never in the entry chunk.
- New dependencies need a justification and a before/after check of the `npm run build` chunk sizes.
- `memo` / `useMemo` / `useCallback` require a measured reason, stated in a comment.
- API lists MUST be paginated server-side (`limit` ≤ 200, matching the backend). Unbounded rendering is forbidden.
