/**
 * Which workspace the user is looking at. The id is sent as `X-Org-Id` by the API client;
 * the backend checks membership on every request. An org id is not a secret, so it is kept
 * in localStorage to survive reloads (tokens are never stored there).
 */

import { setActiveOrgId } from "@/shared/api/client";

const STORAGE_KEY = "fincopilot.activeOrgId";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let activeOrg: string | null = null;

function readStored(): string | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && UUID_RE.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function getActiveOrg(): string | null {
  return activeOrg;
}

/** `null` means "no explicit choice": the backend falls back to the user's primary org. */
export function setActiveOrg(orgId: string | null): void {
  activeOrg = orgId && UUID_RE.test(orgId) ? orgId : null;
  setActiveOrgId(activeOrg);
  try {
    if (activeOrg) window.localStorage.setItem(STORAGE_KEY, activeOrg);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): the choice still applies for this page load.
  }
}

/** Call once at startup, before the first request. */
export function restoreActiveOrg(): void {
  setActiveOrg(readStored());
}

export function clearActiveOrg(): void {
  setActiveOrg(null);
}
