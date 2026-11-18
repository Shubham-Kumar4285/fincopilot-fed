import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";

import { useSessionQuery } from "@/features/auth";
import { clearActiveOrg, getActiveOrg, isOrgPendingDeletion, useCurrentOrgQuery } from "@/features/organizations";
import { ApiError, getErrorMessage } from "@/shared/api/errors";
import { PATHS, safeNextPath, withNext } from "@/shared/config/paths";
import { StateMessage } from "@/shared/ui/StateMessage";
import { useToast } from "@/shared/ui/toast-context";

import { RouteFallback } from "./RouteStates";

/** Child routes need a session; otherwise go to login and come back afterwards. */
export function RequireAuth() {
  const session = useSessionQuery();
  const location = useLocation();

  if (session.isPending) return <RouteFallback />;
  if (session.isError) {
    // The server couldn't answer (offline, rate limited): the session may still be fine, so don't log out.
    return (
      <StateMessage
        icon={<AlertCircle size={20} />}
        title="We couldn't restore your session"
        description={getErrorMessage(session.error)}
        actionLabel="Try again"
        onAction={() => void session.refetch()}
      />
    );
  }
  if (!session.data) return <Navigate to={withNext(PATHS.login, location.pathname + location.search)} replace />;
  return <Outlet />;
}

/** Child routes need an organization; users without one go to onboarding. */
export function RequireOrg() {
  const org = useCurrentOrgQuery();
  const toast = useToast();
  // A remembered workspace the user can no longer open (removed, deleted by its owner, or another
  // account) is a 403: forget it and fall back to the primary org.
  const isStaleSelection = org.error instanceof ApiError && org.error.status === 403 && getActiveOrg() !== null;
  const wasDeleted = isOrgPendingDeletion(org.error);
  const { refetch } = org;

  useEffect(() => {
    if (!isStaleSelection) return;
    if (wasDeleted) {
      // The switcher then lists it as deleted: with a restore action for the owner, whom to contact for members.
      toast("That workspace was deleted", "See the workspace switcher for details. You've been moved to another workspace.");
    }
    clearActiveOrg();
    void refetch();
  }, [isStaleSelection, wasDeleted, refetch, toast]);

  if (org.isPending || isStaleSelection) return <RouteFallback />;
  if (org.error instanceof ApiError && org.error.status === 404) {
    return <Navigate to={PATHS.createWorkspace} replace />;
  }
  if (org.isError) {
    return (
      <StateMessage
        icon={<AlertCircle size={20} />}
        title="Your workspace couldn't be loaded"
        description="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void org.refetch()}
      />
    );
  }
  return <Outlet />;
}

/** Landing / login / signup: already signed-in users skip straight to where they were going. */
export function RedirectIfAuthed() {
  const session = useSessionQuery();
  const [params] = useSearchParams();

  if (session.isPending) return <RouteFallback />;
  if (session.data) return <Navigate to={safeNextPath(params.get("next"))} replace />;
  return <Outlet />;
}
