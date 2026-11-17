/**
 * The one HTTP client. Features call `api.*`; nothing else calls fetch.
 *
 * - Prefixes `env.VITE_API_URL`, sends cookies (refresh token is httpOnly).
 * - Attaches `Authorization` from the token store and `X-Org-Id` when an org is active.
 * - On 401: one shared refresh, then retries the original request exactly once.
 * - Normalizes every failure (including network errors) into ApiError.
 */

import { env } from "@/shared/config/env";

import { ApiError, parseErrorResponse } from "./errors";
import { tokenStore } from "./token-store";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  /** Don't attach the access token (login, signup). */
  skipAuth?: boolean;
  /** Don't attempt a refresh on 401 (auth endpoints themselves). */
  skipRefresh?: boolean;
  signal?: AbortSignal;
}

interface ClientConfig {
  /** Called when the refresh token is rejected; the app navigates to login. */
  onSessionExpired: () => void;
}

let config: ClientConfig = { onSessionExpired: () => undefined };
let activeOrgId: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function configureClient(next: ClientConfig): void {
  config = next;
}

export function setActiveOrgId(orgId: string | null): void {
  activeOrgId = orgId;
}

async function send(method: Method, path: string, body: unknown, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token && !opts.skipAuth) headers.Authorization = `Bearer ${token}`;
  if (activeOrgId) headers["X-Org-Id"] = activeOrgId;

  try {
    return await fetch(`${env.VITE_API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
      signal: opts.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }
}

/**
 * Single-flight refresh: concurrent 401s share one request.
 * Resolves `true` (new token) or `false` (refresh cookie rejected: the session is over).
 * Throws ApiError when the server couldn't answer (offline, 429 rate limit, 5xx): the session
 * may still be valid, so callers must not log the user out for that.
 */
export function refreshSession(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const response = await send("POST", "/auth/refresh", undefined, { skipAuth: true });
      if (response.status === 401 || response.status === 403) {
        tokenStore.clear();
        return false;
      }
      if (!response.ok) throw await parseErrorResponse(response);
      const data = (await response.json()) as { access_token?: unknown };
      if (typeof data.access_token !== "string") return false;
      tokenStore.set(data.access_token);
      return true;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(method: Method, path: string, body: unknown, opts: RequestOptions = {}): Promise<T> {
  let response = await send(method, path, body, opts);

  if (response.status === 401 && !opts.skipRefresh) {
    if (await refreshSession()) {
      response = await send(method, path, body, opts);
    } else {
      config.onSessionExpired();
    }
  }

  if (!response.ok) throw await parseErrorResponse(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PATCH", path, body, opts),
  delete: <T = undefined>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, undefined, opts),
};
