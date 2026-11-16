import { RouterProvider } from "react-router-dom";

import { clearActiveOrg, restoreActiveOrg } from "@/features/organizations";
import { configureClient } from "@/shared/api/client";

import { PATHS } from "@/shared/config/paths";
import { Providers } from "./providers";
import { queryClient } from "./query-client";
import { router } from "./router";

restoreActiveOrg();
configureClient({
  onSessionExpired: () => {
    clearActiveOrg();
    queryClient.clear();
    void router.navigate(PATHS.login);
  },
});

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
