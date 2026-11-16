/**
 * In-memory access token store.
 * The token is never persisted to localStorage, sessionStorage, or cookies.
 * The refresh token is managed by the backend as an httpOnly cookie.
 */

let accessToken: string | null = null;

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },

  set(token: string): void {
    accessToken = token;
  },

  clear(): void {
    accessToken = null;
  },
};
