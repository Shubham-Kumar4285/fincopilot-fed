export const PATHS = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  inviteAccept: "/invites/accept",
  createWorkspace: "/onboarding/workspace",
  dashboard: "/app",
  settingsGeneral: "/app/settings/general",
  settingsMembers: "/app/settings/members",
  profile: "/app/profile",
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];

const APP_PATHS = new Set<string>(Object.values(PATHS));

/**
 * Validates a `?next=` value: only known in-app paths (plus their query string) are allowed,
 * so the param can't be used as an open redirect.
 */
export function safeNextPath(next: string | null, fallback: AppPath = PATHS.dashboard): string {
  if (!next?.startsWith("/") || next.startsWith("//")) return fallback;
  const pathname = next.split("?")[0] ?? "";
  return APP_PATHS.has(pathname) ? next : fallback;
}

/** Appends `?next=` when present: `withNext("/login", "/app")` → "/login?next=%2Fapp". */
export function withNext(path: string, next: string | null | undefined): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}
