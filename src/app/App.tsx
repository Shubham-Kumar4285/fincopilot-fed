import { RouterProvider } from "react-router-dom";

import { configureClient } from "@/shared/api/client";

import { PATHS } from "./paths";
import { Providers } from "./providers";
import { queryClient } from "./query-client";
import { router } from "./router";

configureClient({
  onSessionExpired: () => {
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
