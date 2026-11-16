import { createBrowserRouter } from "react-router-dom";

import { PATHS } from "@/shared/config/paths";

import { RedirectIfAuthed, RequireAuth, RequireOrg } from "./guards";
import { AppShell } from "./layouts/AppShell";
import { MinimalLayout } from "./layouts/MinimalLayout";
import { RouteError, RouteFallback } from "./RouteStates";

/**
 * Every page is lazy-loaded from its own module (the one place app/ reaches into a feature's
 * pages/ directly), so pages stay out of the entry chunk. `handle.title` feeds the app top bar.
 */
export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      {
        // Signed-in visitors skip the marketing page, login and signup and go straight to the app.
        element: <RedirectIfAuthed />,
        children: [
          {
            path: PATHS.landing,
            lazy: async () => ({ Component: (await import("@/features/landing/pages/LandingPage")).LandingPage }),
          },
          { path: PATHS.login, lazy: async () => ({ Component: (await import("@/features/auth/pages/LoginPage")).LoginPage }) },
          { path: PATHS.signup, lazy: async () => ({ Component: (await import("@/features/auth/pages/SignupPage")).SignupPage }) },
        ],
      },
      {
        path: PATHS.forgotPassword,
        lazy: async () => ({ Component: (await import("@/features/auth/pages/ForgotPasswordPage")).ForgotPasswordPage }),
      },
      {
        path: PATHS.resetPassword,
        lazy: async () => ({ Component: (await import("@/features/auth/pages/ResetPasswordPage")).ResetPasswordPage }),
      },
      {
        element: <MinimalLayout />,
        children: [
          {
            path: PATHS.inviteAccept,
            lazy: async () => ({ Component: (await import("@/features/organizations/pages/InviteAcceptPage")).InviteAcceptPage }),
          },
          {
            element: <RequireAuth />,
            children: [
              {
                path: PATHS.createWorkspace,
                lazy: async () => ({ Component: (await import("@/features/organizations/pages/CreateWorkspacePage")).CreateWorkspacePage }),
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireOrg />,
            children: [
              {
                element: <AppShell />,
                children: [
                  {
                    path: PATHS.dashboard,
                    handle: { title: "Dashboard" },
                    lazy: async () => ({ Component: (await import("@/features/dashboard/pages/DashboardPage")).DashboardPage }),
                  },
                  {
                    path: PATHS.settingsGeneral,
                    handle: { title: "Settings" },
                    lazy: async () => ({ Component: (await import("@/features/organizations/pages/GeneralSettingsPage")).GeneralSettingsPage }),
                  },
                  {
                    path: PATHS.settingsMembers,
                    handle: { title: "Settings" },
                    lazy: async () => ({ Component: (await import("@/features/organizations/pages/MembersSettingsPage")).MembersSettingsPage }),
                  },
                  {
                    path: PATHS.profile,
                    handle: { title: "Profile & security" },
                    lazy: async () => ({ Component: (await import("@/features/users/pages/ProfilePage")).ProfilePage }),
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: "*", lazy: async () => ({ Component: (await import("./NotFound")).NotFound }) },
    ],
  },
]);
