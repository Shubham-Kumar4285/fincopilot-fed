import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { useLogoutMutation } from "@/features/auth";
import type { Schema } from "@/shared/api/types";
import { org } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { API, apiError, server } from "@/test/server";

import { clearActiveOrg, getActiveOrg, setActiveOrg } from "./active-org";
import { useCurrentOrgQuery } from "./api";
import { OrgSwitcher } from "./components/OrgSwitcher";
import { PendingInvitesBanner } from "./components/PendingInvitesBanner";

const OTHER_ID = "7d4f8a2e-1b3c-4d5e-8f90-a1b2c3d4e5f6";
const otherOrg: Schema<"OrganizationResponse"> = { ...org, id: OTHER_ID, name: "Test Org", plan_tier: "team" };
const myOrgs: Schema<"OrganizationWithRoleResponse">[] = [
  { ...org, role: "owner" },
  { ...otherOrg, role: "member" },
];
const invite: Schema<"MyInviteResponse"> = {
  id: "9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d",
  org_id: OTHER_ID,
  org_name: "Test Org",
  role: "member",
  invited_by_name: "Asha Rao",
  expires_at: "2099-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
};

/** `/orgs/current` answers for whichever org the X-Org-Id header names (primary org when absent). */
function orgHandlers({ invites = [] as Schema<"MyInviteResponse">[] } = {}) {
  const seenHeaders: (string | null)[] = [];
  server.use(
    http.get(`${API}/orgs/current`, ({ request }) => {
      const header = request.headers.get("X-Org-Id");
      seenHeaders.push(header);
      return HttpResponse.json(header === OTHER_ID ? otherOrg : org);
    }),
    http.get(`${API}/orgs`, () => HttpResponse.json(myOrgs)),
    http.get(`${API}/users/me/invites`, () => HttpResponse.json(invites)),
  );
  return seenHeaders;
}

function CurrentOrgName() {
  const current = useCurrentOrgQuery();
  return <p>Viewing: {current.data?.name ?? "…"}</p>;
}

afterEach(() => {
  clearActiveOrg();
});

describe("active org", () => {
  it("persists a valid org id and ignores anything that isn't a UUID", () => {
    setActiveOrg(OTHER_ID);
    expect(window.localStorage.getItem("fincopilot.activeOrgId")).toBe(OTHER_ID);
    setActiveOrg("not-an-id");
    expect(getActiveOrg()).toBeNull();
    expect(window.localStorage.getItem("fincopilot.activeOrgId")).toBeNull();
  });

  it("is cleared on logout", async () => {
    server.use(http.post(`${API}/auth/logout`, () => HttpResponse.json({ message: "ok" })));
    setActiveOrg(OTHER_ID);
    function LogoutButton() {
      const logout = useLogoutMutation();
      return <button onClick={() => { logout.mutate(); }}>Log out</button>;
    }
    renderWithProviders(<LogoutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    await waitFor(() => { expect(getActiveOrg()).toBeNull(); });
  });
});

describe("OrgSwitcher", () => {
  it("lists my workspaces with roles and switches the active org", async () => {
    const seenHeaders = orgHandlers();
    renderWithProviders(
      <Routes>
        <Route path="/app" element={<><OrgSwitcher /><CurrentOrgName /></>} />
      </Routes>,
      { route: "/app" },
    );
    expect(await screen.findByText(`Viewing: ${org.name}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /switch workspace/i }));
    const current = await screen.findByRole("menuitemradio", { name: /Arjun Design Studio/ });
    expect(current).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: /Test Org/ })).toHaveTextContent("Member");

    await userEvent.click(screen.getByRole("menuitemradio", { name: /Test Org/ }));

    expect(await screen.findByText("Viewing: Test Org")).toBeInTheDocument();
    expect(seenHeaders.at(-1)).toBe(OTHER_ID);
    expect(getActiveOrg()).toBe(OTHER_ID);
  });

  it("shows a pending-invite count", async () => {
    orgHandlers({ invites: [invite] });
    renderWithProviders(<OrgSwitcher />);
    expect(await screen.findByLabelText("1 pending invite")).toBeInTheDocument();
  });
});

describe("PendingInvitesBanner", () => {
  it("joins the workspace and switches into it", async () => {
    const seenHeaders = orgHandlers({ invites: [invite] });
    let accepted = false;
    server.use(
      http.post(`${API}/users/me/invites/${invite.id}/accept`, () => {
        accepted = true;
        return HttpResponse.json({ message: "ok", org_id: OTHER_ID, org_name: "Test Org" });
      }),
    );
    renderWithProviders(
      <Routes>
        <Route path="/onboarding" element={<PendingInvitesBanner />} />
        <Route path="/app" element={<CurrentOrgName />} />
      </Routes>,
      { route: "/onboarding" },
    );

    expect(await screen.findByText(/Asha Rao invited you to join/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Join Test Org" }));

    expect(await screen.findByText("Viewing: Test Org")).toBeInTheDocument();
    expect(accepted).toBe(true);
    expect(seenHeaders.at(-1)).toBe(OTHER_ID);
    expect(screen.getByText(/Welcome to Test Org/)).toBeInTheDocument();
  });

  it("declines after confirmation and the invite disappears", async () => {
    let invites = [invite];
    server.use(
      http.get(`${API}/users/me/invites`, () => HttpResponse.json(invites)),
      http.post(`${API}/users/me/invites/${invite.id}/decline`, () => {
        invites = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<PendingInvitesBanner />);

    await userEvent.click(await screen.findByRole("button", { name: "Decline" }));
    await userEvent.click(screen.getByRole("button", { name: "Decline invite" }));

    await waitFor(() => { expect(screen.queryByText(/invited you to join/)).not.toBeInTheDocument(); });
  });

  it("shows an error when invites can't be loaded", async () => {
    server.use(http.get(`${API}/users/me/invites`, () => apiError(500, "boom")));
    renderWithProviders(<PendingInvitesBanner />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't check for workspace invites/i);
  });
});
