import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSessionQuery } from "@/features/auth";

import { PATHS } from "./paths";
import { RouteFallback } from "./RouteStates";

/** Renders child routes only with a session; otherwise sends the user to login. */
export function RequireAuth() {
  const session = useSessionQuery();
  const location = useLocation();

  if (session.isPending) return <RouteFallback />;
  if (!session.data) return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
