import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { pendingInvite, workspaceHandlers } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { API, apiError, server } from "@/test/server";

import { MembersSettingsPage } from "./pages/MembersSettingsPage";

describe("MembersSettingsPage", () => {
  it("lists members and pending invites for an owner", async () => {
    server.use(...workspaceHandlers());
    renderWithProviders(<MembersSettingsPage />);

    expect(await screen.findByText("Meera Shah")).toBeInTheDocument();
    expect(await screen.findByText("kavya@studio.in")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /invite member/i })).toBeInTheDocument();
  });

  it("shows a declined invite and sends a new one", async () => {
    const declined = { ...pendingInvite, declined_at: "2026-01-02T00:00:00Z" };
    let sent: unknown = null;
    server.use(
      http.get(`${API}/orgs/current/invites`, () => HttpResponse.json([declined])),
      http.post(`${API}/orgs/current/invites`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ ...pendingInvite, id: "inv-2" }, { status: 201 });
      }),
      ...workspaceHandlers(),
    );
    renderWithProviders(<MembersSettingsPage />);

    expect(await screen.findByText("Declined")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Invite again" }));

    expect(await screen.findByText(/We emailed kavya@studio.in a new invite/)).toBeInTheDocument();
    expect(sent).toEqual({ email: "kavya@studio.in", role: "member" });
  });

  it("shows an error state with retry", async () => {
    // MSW uses the first matching handler, so the override goes first.
    server.use(
      http.get(`${API}/orgs/current/members`, () => apiError(500, "Internal server error")),
      ...workspaceHandlers(),
    );
    renderWithProviders(<MembersSettingsPage />);

    expect(await screen.findByText("Members couldn't be loaded")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("hides admin actions from regular members", async () => {
    server.use(...workspaceHandlers({ role: "member" }));
    renderWithProviders(<MembersSettingsPage />);

    expect(await screen.findByText("Meera Shah")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /invite member/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("shows the backend's plan-tier message when inviting is not allowed", async () => {
    server.use(
      ...workspaceHandlers(),
      http.post(`${API}/orgs/current/invites`, () =>
        apiError(403, "Team tier or higher required to invite members. Please upgrade your plan."),
      ),
    );
    renderWithProviders(<MembersSettingsPage />);

    await userEvent.click(await screen.findByRole("button", { name: /invite member/i }));
    const dialog = screen.getByRole("dialog", { name: "Invite member" });
    await userEvent.type(within(dialog).getByLabelText("Email"), "new@studio.in");
    await userEvent.click(within(dialog).getByRole("button", { name: "Send invite" }));

    expect(await within(dialog).findByText(/Team tier or higher required/)).toBeInTheDocument();
  });

  it("sends an invite and shows the confirmation", async () => {
    server.use(
      ...workspaceHandlers(),
      http.post(`${API}/orgs/current/invites`, async ({ request }) => {
        const body = (await request.json()) as { email: string; role: string };
        return HttpResponse.json(
          {
            id: "inv-2",
            org_id: "org-1",
            email: body.email,
            role: body.role,
            expires_at: "2099-01-01T00:00:00Z",
            accepted_at: null,
            created_at: "2026-01-01T00:00:00Z",
            invited_by: null,
            token: null,
          },
          { status: 201 },
        );
      }),
    );
    renderWithProviders(<MembersSettingsPage />);

    await userEvent.click(await screen.findByRole("button", { name: /invite member/i }));
    const dialog = screen.getByRole("dialog", { name: "Invite member" });
    await userEvent.type(within(dialog).getByLabelText("Email"), "new@studio.in");
    await userEvent.click(within(dialog).getByRole("button", { name: "Send invite" }));

    expect(await screen.findByText(/An invitation was sent to new@studio.in/)).toBeInTheDocument();
  });

  it("removes a member after confirmation", async () => {
    let removed: string | undefined;
    server.use(
      ...workspaceHandlers(),
      http.delete(`${API}/orgs/current/members/:userId`, ({ params }) => {
        removed = String(params.userId);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<MembersSettingsPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Remove" }));
    const dialog = screen.getByRole("dialog", { name: "Remove member?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove member" }));

    expect(await screen.findByText("Member removed")).toBeInTheDocument();
    expect(removed).toBe("u-meera");
  });
});
