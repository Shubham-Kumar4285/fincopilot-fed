---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/test/**"
---
# Testing (Vitest + React Testing Library + MSW)

- Tests are colocated as `<file>.test.ts(x)`. Shared setup lives in `src/test/`: `server.ts` (MSW server, `apiError()` envelope helper) and `render.tsx` (`renderWithProviders`). Unhandled requests fail the test.
- The network is mocked with MSW handlers that return real backend shapes, including the error format. Mocking `fetch` or the client module is forbidden.
- Elements are queried by role, label or text. Class-name selectors and snapshot tests are forbidden.
- Required coverage:
  - API client: single-flight refresh, retry-once, error normalization, 204 handling.
  - Route guards.
  - Each form's validation plus 422 field mapping.
  - Every `shared/lib` money and date helper, with exact string assertions.
- Every async component test covers its loading, empty and error states.
- Each bug fix starts with a failing regression test.
