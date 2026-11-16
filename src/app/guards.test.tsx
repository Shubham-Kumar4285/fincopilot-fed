import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { API, apiError, server, tokenResponse } from "@/test/server";

import { RequireAuth } from "./guards";
import { PATHS } from "./paths";

function renderGuarded() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/private" element={<p>secret page</p>} />
          </Route>
          <Route path={PATHS.login} element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RequireAuth", () => {
  it("restores the session from the refresh cookie and renders the route", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json(tokenResponse())));
    renderGuarded();
    expect(await screen.findByText("secret page")).toBeInTheDocument();
  });

  it("redirects to login when there is no session", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => apiError(401, "Invalid refresh token")));
    renderGuarded();
    expect(await screen.findByText("login page")).toBeInTheDocument();
  });
});
