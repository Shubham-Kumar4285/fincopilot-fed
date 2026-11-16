import { createBrowserRouter } from "react-router-dom";

import { PATHS } from "./paths";
import { RouteError, RouteFallback } from "./RouteStates";

/** Every page is lazy-loaded: one chunk per feature. */
export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      {
        path: PATHS.landing,
        lazy: async () => ({ Component: (await import("@/features/landing")).LandingPage }),
      },
      {
        path: PATHS.login,
        lazy: async () => ({ Component: (await import("@/features/auth")).LoginPage }),
      },
      {
        path: PATHS.signup,
        lazy: async () => ({ Component: (await import("@/features/auth")).SignupPage }),
      },
      {
        path: PATHS.forgotPassword,
        lazy: async () => ({ Component: (await import("@/features/auth")).ForgotPasswordPage }),
      },
      // Protected routes go under <RequireAuth /> from ./guards once the dashboard exists.
    ],
  },
]);
