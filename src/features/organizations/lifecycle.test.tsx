import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { Schema } from "@/shared/api/types";
import { me, member, org, workspaceHandlers } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { API, apiError, server } from "@/test/server";

import { clearActiveOrg, getActiveOrg, setActiveOrg } from "./active-org";
import { OrgSwitcher } from "./components/OrgSwitcher";
import { CreateWorkspacePage } from "./pages/CreateWorkspacePage";
import { GeneralSettingsPage } from "./pages/GeneralSettingsPage";
import { MembersSettingsPage } from "./pages/MembersSettingsPage";

const OTHER_ID = "7d4f8a2e-1b3c-4d5e-8f90-a1b2c3d4e5f6";
const DELETED_ID = "3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a99";

const deletedOrg: Schema<"OrganizationWithRoleResponse"> = {
  ...org,
  id: DELETED_ID,
  name: "Old Studio",
  status: "pending_deletion",
  purge_after: "2026-12-18T12:00:00Z",
  role: "owner",
};

function Where() {
  const location = useLocation();
  return <p>At: {location.pathname + location.search}</p>;
}

/** Renders `page` at `route` plus the dashboard, so redirects after leave/delete are visible. */
function renderAt(page: React.ReactElement, path: string, route = path) {
  return renderWithProviders(
    <Routes>
      <Route path={path} element={<>{page}<Where /></>} />
      <Route path="/app" element={<Where />} />
    </Routes>,
    { route },
  );
}

afterEach(() => {
  clearActiveOrg();
});

// ---------------------------------------------------------------------------
// General settings: delete / leave
// ---------------------------------------------------------------------------

describe("GeneralSettingsPage danger zone", () => {
  it("owner deletes the workspace after typing its name", async () => {
    let sent: unknown = null;
    setActiveOrg(OTHER_ID);
    server.use(
      ...workspaceHandlers(),
      http.delete(`${API}/orgs/current`, async ({ request }) => {
        sent = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderAt(<GeneralSettingsPage />, "/app/settings/general");

    await userEvent.click(await screen.findByRole("button", { name: "Delete workspace" }));
    const dialog = screen.getByRole("dialog", { name: "Delete workspace?" });
    const confirm = within(dialog).getByRole("button", { name: "Delete workspace" });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText(`Type "${org.name}" to confirm`), "arjun design studio");
    expect(confirm).toBeDisabled(); // must match exactly
    await userEvent.clear(within(dialog).getByLabelText(`Type "${org.name}" to confirm`));
    await userEvent.type(within(dialog).getByLabelText(`Type "${org.name}" to confirm`), org.name);
    await userEvent.click(confirm);

    expect(await screen.findByText("At: /app")).toBeInTheDocument();
    expect(sent).toEqual({ confirm_name: org.name });
    expect(getActiveOrg()).toBeNull();
  });

  it("shows the server's message when deletion is refused", async () => {
    server.use(
      ...workspaceHandlers(),
      http.delete(`${API}/orgs/current`, () => apiError(403, "Only the owner can delete the organization")),
    );
    renderAt(<GeneralSettingsPage />, "/app/settings/general");

    await userEvent.click(await screen.findByRole("button", { name: "Delete workspace" }));
    const dialog = screen.getByRole("dialog", { name: "Delete workspace?" });
    await userEvent.type(within(dialog).getByLabelText(`Type "${org.name}" to confirm`), org.name);
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete workspace" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Only the owner can delete the organization");
  });

  it("owner is pointed to transfer ownership instead of leaving", async () => {
    server.use(...workspaceHandlers());
    renderAt(<GeneralSettingsPage />, "/app/settings/general");

    expect(await screen.findByRole("link", { name: "Transfer ownership" })).toHaveAttribute("href", "/app/settings/members");
    expect(screen.queryByRole("button", { name: "Leave workspace" })).not.toBeInTheDocument();
  });

  it("a member leaves the workspace", async () => {
    let left = false;
    server.use(
      ...workspaceHandlers({ role: "member" }),
      http.post(`${API}/orgs/current/leave`, () => {
        left = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderAt(<GeneralSettingsPage />, "/app/settings/general");

    await userEvent.click(await screen.findByRole("button", { name: "Leave workspace" }));
    const dialog = screen.getByRole("dialog", { name: "Leave workspace?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Leave workspace" }));

    expect(await screen.findByText("At: /app")).toBeInTheDocument();
    expect(left).toBe(true);
    expect(screen.queryByRole("button", { name: "Delete workspace" })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Members: roles, transfer, remove permissions, ?org=
// ---------------------------------------------------------------------------

describe("MembersSettingsPage ownership", () => {
  it("owner changes a member's role", async () => {
    let sent: unknown = null;
    server.use(
      ...workspaceHandlers(),
      http.patch(`${API}/orgs/current/members/:userId`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(member("u-meera", "Meera Shah", "admin"));
      }),
    );
    renderWithProviders(<MembersSettingsPage />);

    await userEvent.selectOptions(await screen.findByLabelText("Role for Meera Shah"), "admin");

    expect(await screen.findByText("Meera Shah is now an admin.")).toBeInTheDocument();
    expect(sent).toEqual({ role: "admin" });
  });

  it("owner transfers ownership after typing the member's email", async () => {
    let sent: unknown = null;
    server.use(
      ...workspaceHandlers(),
      http.post(`${API}/orgs/current/transfer-ownership`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ org_id: org.id, new_owner_id: "u-meera", your_role: "admin" });
      }),
    );
    renderWithProviders(<MembersSettingsPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Make Meera Shah the owner" }));
    const dialog = screen.getByRole("dialog", { name: "Transfer ownership?" });
    const confirm = within(dialog).getByRole("button", { name: "Transfer ownership" });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText("Type meera@studio.in to confirm"), "MEERA@studio.in");
    await userEvent.click(confirm);

    expect(await screen.findByText("Meera Shah is now the owner. You're an admin.")).toBeInTheDocument();
    expect(sent).toEqual({ user_id: "u-meera" });
  });

  it("an admin can remove members but not other admins, and sees no owner controls", async () => {
    const members = [
      member("u-owner-2", "Priya Nair", "owner"),
      member(me.id, me.full_name, "admin"),
      member("u-kabir", "Kabir Rao", "admin"),
      member("u-meera", "Meera Shah", "member"),
    ];
    server.use(
      http.get(`${API}/orgs/current/members`, () => HttpResponse.json({ members, total: members.length })),
      ...workspaceHandlers(),
    );
    renderWithProviders(<MembersSettingsPage />);

    expect(await screen.findByRole("button", { name: "Remove Meera Shah" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Kabir Rao" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Priya Nair" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /the owner$/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Role for Meera Shah")).not.toBeInTheDocument();
  });

  it("?org= switches to that workspace and drops the param", async () => {
    server.use(...workspaceHandlers());
    renderAt(<MembersSettingsPage />, "/app/settings/members", `/app/settings/members?org=${OTHER_ID}`);

    expect(await screen.findByText("At: /app/settings/members")).toBeInTheDocument();
    expect(getActiveOrg()).toBe(OTHER_ID);
  });
});

// ---------------------------------------------------------------------------
// Pending-deletion workspaces
// ---------------------------------------------------------------------------

describe("restoring a deleted workspace", () => {
  it("the switcher shows it as deleted and restores it", async () => {
    let restored = false;
    server.use(
      http.get(`${API}/orgs/current`, () => HttpResponse.json(org)),
      http.get(`${API}/orgs`, () => HttpResponse.json([{ ...org, role: "owner" }, deletedOrg])),
      http.get(`${API}/users/me/invites`, () => HttpResponse.json([])),
      http.post(`${API}/orgs/${DELETED_ID}/restore`, () => {
        restored = true;
        return HttpResponse.json({ ...org, id: DELETED_ID, name: "Old Studio" });
      }),
    );
    renderAt(<OrgSwitcher />, "/app/settings/general");

    await userEvent.click(await screen.findByRole("button", { name: /switch workspace/i }));
    const item = await screen.findByRole("menuitem", { name: "Restore Old Studio…" });
    expect(item).toHaveTextContent("Deleted · restore by 18 Dec 2026");
    await userEvent.click(item);

    // Selecting a deleted workspace only asks; it must not restore on its own.
    const dialog = await screen.findByRole("dialog", { name: "Restore Old Studio?", hidden: true });
    expect(restored).toBe(false);
    await userEvent.click(within(dialog).getByRole("button", { name: "Restore workspace", hidden: true }));

    await waitFor(() => {
      expect(getActiveOrg()).toBe(DELETED_ID);
    });
    expect(restored).toBe(true);
  });

  it("members see a deleted workspace with whom to contact, and can't open or restore it", async () => {
    server.use(
      http.get(`${API}/orgs/current`, () => HttpResponse.json(org)),
      http.get(`${API}/orgs`, () =>
        HttpResponse.json([
          { ...org, role: "owner" },
          { ...deletedOrg, role: "member", purge_after: null, owner_name: "Olivia Owner" },
        ]),
      ),
      http.get(`${API}/users/me/invites`, () => HttpResponse.json([])),
    );
    renderAt(<OrgSwitcher />, "/app/settings/general");

    await userEvent.click(await screen.findByRole("button", { name: /switch workspace/i }));
    const item = await screen.findByRole("menuitem", { name: /Old Studio/ });
    expect(item).toHaveTextContent("Deleted by Olivia Owner. Contact them to restore it.");
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("menuitem", { name: /Restore Old Studio/ })).not.toBeInTheDocument();
    await userEvent.click(item);
    expect(getActiveOrg()).not.toBe(DELETED_ID);
  });

  it("cancelling the restore confirmation leaves the workspace deleted", async () => {
    let restored = false;
    server.use(
      http.get(`${API}/orgs/current`, () => HttpResponse.json(org)),
      http.get(`${API}/orgs`, () => HttpResponse.json([{ ...org, role: "owner" }, deletedOrg])),
      http.get(`${API}/users/me/invites`, () => HttpResponse.json([])),
      http.post(`${API}/orgs/${DELETED_ID}/restore`, () => {
        restored = true;
        return HttpResponse.json({ ...org, id: DELETED_ID, name: "Old Studio" });
      }),
    );
    renderAt(<OrgSwitcher />, "/app/settings/general");

    await userEvent.click(await screen.findByRole("button", { name: /switch workspace/i }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Restore Old Studio…" }));
    const dialog = await screen.findByRole("dialog", { name: "Restore Old Studio?", hidden: true });
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel", hidden: true }));

    expect(restored).toBe(false);
    expect(getActiveOrg()).not.toBe(DELETED_ID);
  });

  it("onboarding tells a member whose workspace was deleted whom to contact, without a restore button", async () => {
    server.use(
      http.get(`${API}/orgs`, () =>
        HttpResponse.json([{ ...deletedOrg, role: "member", purge_after: null, owner_name: "Olivia Owner" }]),
      ),
      http.get(`${API}/users/me/invites`, () => HttpResponse.json([])),
    );
    renderAt(<CreateWorkspacePage />, "/onboarding/workspace");

    const section = await screen.findByRole("region", { name: "Workspaces deleted by their owner" });
    expect(section).toHaveTextContent("Old Studio was deleted by Olivia Owner. Contact them if you need it back.");
    expect(screen.queryByRole("button", { name: /Restore/ })).not.toBeInTheDocument();
  });

  it("onboarding offers to restore when the owner's only workspace was deleted", async () => {
    server.use(
      http.get(`${API}/orgs`, () => HttpResponse.json([deletedOrg])),
      http.get(`${API}/users/me/invites`, () => HttpResponse.json([])),
      http.post(`${API}/orgs/${DELETED_ID}/restore`, () =>
        HttpResponse.json({ ...org, id: DELETED_ID, name: "Old Studio" }),
      ),
    );
    renderAt(<CreateWorkspacePage />, "/onboarding/workspace");

    const section = await screen.findByRole("region", { name: "Deleted workspaces" });
    expect(within(section).getByText("Restore by 18 Dec 2026")).toBeInTheDocument();
    await userEvent.click(within(section).getByRole("button", { name: "Restore Old Studio" }));

    expect(await screen.findByText("At: /app")).toBeInTheDocument();
    expect(getActiveOrg()).toBe(DELETED_ID);
  });
});
