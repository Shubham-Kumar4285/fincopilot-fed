import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { clearActiveOrg, getActiveOrg, restoreActiveOrg, useCurrentOrgQuery } from "@/features/organizations";
import { me, org } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { API, apiError, server, tokenResponse } from "@/test/server";

import { RedirectIfAuthed, RequireAuth, RequireOrg } from "./guards";
import { PATHS } from "@/shared/config/paths";

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

  it("keeps the session when refresh is rate limited instead of logging out", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => apiError(429, "Too many attempts. Please try again in 20 seconds.")));
    renderGuarded();
    expect(await screen.findByText("We couldn't restore your session")).toBeInTheDocument();
    expect(screen.getByText(/try again in 20 seconds/)).toBeInTheDocument();
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });

  it("redirects to login when there is no session", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => apiError(401, "Invalid refresh token")));
    renderGuarded();
    expect(await screen.findByText("login page")).toBeInTheDocument();
  });
});

function renderTree(initial: string, tree: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>{tree}</Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RequireOrg", () => {
  it("sends users without an organization to onboarding", async () => {
    server.use(http.get(`${API}/orgs/current`, () => apiError(404, "User has no organization")));
    renderTree(
      "/app",
      <>
        <Route element={<RequireOrg />}>
          <Route path="/app" element={<p>dashboard</p>} />
        </Route>
        <Route path={PATHS.createWorkspace} element={<p>create workspace</p>} />
      </>,
    );
    expect(await screen.findByText("create workspace")).toBeInTheDocument();
  });
});

describe("RedirectIfAuthed", () => {
  it("skips login for signed-in users, honouring a safe ?next=", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json(tokenResponse())));
    renderTree(
      "/login?next=%2Fapp%2Fprofile",
      <>
        <Route element={<RedirectIfAuthed />}>
          <Route path={PATHS.login} element={<p>login page</p>} />
        </Route>
        <Route path={PATHS.profile} element={<p>profile page</p>} />
      </>,
    );
    expect(await screen.findByText("profile page")).toBeInTheDocument();
  });

  it("sends a signed-in visitor from the landing page to the app (session restored on reload)", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json(tokenResponse())));
    renderTree(
      "/",
      <>
        <Route element={<RedirectIfAuthed />}>
          <Route path={PATHS.landing} element={<p>landing page</p>} />
        </Route>
        <Route path={PATHS.dashboard} element={<p>dashboard</p>} />
      </>,
    );
    expect(await screen.findByText("dashboard")).toBeInTheDocument();
  });

  it("shows the landing page to signed-out visitors", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => apiError(401, "Invalid refresh token")));
    renderTree(
      "/",
      <>
        <Route element={<RedirectIfAuthed />}>
          <Route path={PATHS.landing} element={<p>landing page</p>} />
        </Route>
        <Route path={PATHS.dashboard} element={<p>dashboard</p>} />
      </>,
    );
    expect(await screen.findByText("landing page")).toBeInTheDocument();
  });

  it("ignores an external ?next= (open-redirect guard)", async () => {
    server.use(http.post(`${API}/auth/refresh`, () => HttpResponse.json(tokenResponse())));
    renderTree(
      "/login?next=https%3A%2F%2Fevil.example",
      <>
        <Route element={<RedirectIfAuthed />}>
          <Route path={PATHS.login} element={<p>login page</p>} />
        </Route>
        <Route path={PATHS.dashboard} element={<p>dashboard</p>} />
      </>,
    );
    expect(await screen.findByText("dashboard")).toBeInTheDocument();
  });
});

function CurrentOrgName() {
  const current = useCurrentOrgQuery();
  return <p>Viewing: {current.data?.name ?? "…"}</p>;
}

describe("RequireOrg with a remembered workspace", () => {
  afterEach(() => {
    clearActiveOrg();
  });

  it("forgets a workspace the user no longer belongs to and falls back to the primary org", async () => {
    window.localStorage.setItem("fincopilot.activeOrgId", "7d4f8a2e-1b3c-4d5e-8f90-a1b2c3d4e5f6");
    restoreActiveOrg();
    server.use(
      http.get(`${API}/orgs/current`, ({ request }) =>
        request.headers.get("X-Org-Id") ? apiError(403, "You are not a member of this organization") : HttpResponse.json(org),
      ),
      http.get(`${API}/users/me`, () => HttpResponse.json(me)),
    );
    renderWithProviders(
      <Routes>
        <Route element={<RequireOrg />}>
          <Route path="/app" element={<CurrentOrgName />} />
        </Route>
      </Routes>,
      { route: "/app" },
    );

    expect(await screen.findByText(`Viewing: ${org.name}`)).toBeInTheDocument();
    expect(getActiveOrg()).toBeNull();
  });
});
