/** MSW server + helpers that return real backend response shapes. */
import { HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const API = "http://localhost:8000/v1";

export const server = setupServer();

/** The backend error envelope (backend/.claude/rules/08-errors-logging.md). */
export function apiError(status: number, message: string, details: Record<string, unknown> = {}) {
  return HttpResponse.json({ data: null, meta: {}, error: { message, details } }, { status });
}

export const tokenResponse = (token = "access-1") => ({
  access_token: token,
  token_type: "bearer",
  expires_in: 900,
});
