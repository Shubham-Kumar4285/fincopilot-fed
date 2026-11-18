import { RouterProvider } from "react-router-dom";

import { clearActiveOrg, restoreActiveOrg } from "@/features/organizations";
import { configureClient } from "@/shared/api/client";

import { PATHS } from "@/shared/config/paths";
import { Providers } from "./providers";
import { queryClient } from "./query-client";
import { router } from "./router";

restoreActiveOrg();
configureClient({
  onSessionExpired: (reason) => {
    clearActiveOrg();
    queryClient.clear();
    void router.navigate(reason === "expired" ? PATHS.login : `${PATHS.login}?reason=${reason}`);
  },
});

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
