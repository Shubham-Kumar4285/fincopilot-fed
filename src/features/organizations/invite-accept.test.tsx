import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { tokenStore } from "@/shared/api/token-store";
import { me } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { API, apiError, server } from "@/test/server";

import { InviteAcceptPage } from "./pages/InviteAcceptPage";

const preview = (email: string, userExists = false) =>
  http.get(`${API}/orgs/invites/tok`, () =>
    HttpResponse.json({
      org_name: "Arjun Design Studio",
      email,
      role: "admin",
      expires_at: "2099-01-01T00:00:00Z",
      user_exists: userExists,
    }),
  );
const noSession = http.post(`${API}/auth/refresh`, () => apiError(401, "Invalid refresh token"));
const render = () => renderWithProviders(<InviteAcceptPage />, { route: "/invites/accept?token=tok" });

describe("InviteAcceptPage", () => {
  it("logged out, new user: offers sign up with the invite email locked", async () => {
    server.use(preview("new@studio.in"), noSession);
    render();

    const link = await screen.findByRole("link", { name: "Create account to join" });
    expect(link.getAttribute("href")).toContain("email=new%40studio.in");
    expect(link.getAttribute("href")).toContain("next=");
  });

  it("signed in with the invited email: joins the workspace", async () => {
    tokenStore.set("tok");
    let accepted = false;
    server.use(
      preview(me.email, true),
      http.get(`${API}/users/me`, () => HttpResponse.json(me)),
      http.post(`${API}/orgs/invites/tok/accept`, () => {
        accepted = true;
        return HttpResponse.json({ message: "ok", org_id: "org-1", org_name: "Arjun Design Studio" });
      }),
    );
    render();

    await userEvent.click(await screen.findByRole("button", { name: "Join Arjun Design Studio" }));

    expect(await screen.findByText("Workspace joined")).toBeInTheDocument();
    expect(accepted).toBe(true);
  });

  it("signed in as someone else: warns with a masked email", async () => {
    tokenStore.set("tok");
    server.use(preview("priya@studio.in", true), http.get(`${API}/users/me`, () => HttpResponse.json(me)));
    render();

    expect(await screen.findByText(/pr\*\*\*@studio.in/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out and continue" })).toBeInTheDocument();
  });

  it("expired invite: shows the no-longer-available state", async () => {
    server.use(http.get(`${API}/orgs/invites/tok`, () => apiError(400, "This invite has expired")));
    render();

    expect(await screen.findByRole("heading", { name: "Invite no longer available" })).toBeInTheDocument();
    expect(screen.getByText("This invite has expired")).toBeInTheDocument();
  });

  it("unknown token: shows not found", async () => {
    server.use(http.get(`${API}/orgs/invites/tok`, () => apiError(404, "Invite not found")));
    render();

    expect(await screen.findByRole("heading", { name: "Invite not found" })).toBeInTheDocument();
  });
});
