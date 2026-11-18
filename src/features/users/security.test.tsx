import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { configureClient } from "@/shared/api/client";
import type { Schema } from "@/shared/api/types";
import { renderWithProviders } from "@/test/render";
import { API, apiError, server } from "@/test/server";

import { DeleteAccountSection } from "./components/DeleteAccountSection";
import { PasswordSection } from "./components/PasswordSection";
import { SessionsSection } from "./components/SessionsSection";

const EMAIL = "arjun@studio.in";
const CHROME = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const FIREFOX = "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0";

const session = (id: string, isCurrent: boolean, ua: string): Schema<"SessionResponse"> => ({
  id,
  device_info: ua,
  ip_address: "203.0.113.7",
  created_at: "2026-11-01T12:00:00Z",
  last_used_at: "2026-11-17T12:00:00Z",
  is_current: isCurrent,
});

const codeSent = (hasPassword: boolean) =>
  HttpResponse.json({ message: "A verification code has been sent to your email", expires_in: 600, has_password: hasPassword });

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

describe("PasswordSection", () => {
  async function openForm(hasPassword: boolean) {
    server.use(http.post(`${API}/users/me/password/otp`, () => codeSent(hasPassword)));
    renderWithProviders(<PasswordSection email={EMAIL} />);
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));
    await screen.findByText(/We sent a 6-digit code to ar\*\*\*@studio.in/);
  }

  it("changes the password with the code and current password", async () => {
    let sent: unknown = null;
    server.use(
      http.post(`${API}/users/me/password`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ message: "Password updated. Your other devices have been signed out." });
      }),
    );
    await openForm(true);

    await userEvent.type(screen.getByLabelText("Verification code"), "123456");
    await userEvent.type(screen.getByLabelText("Current password"), "old-password");
    await userEvent.type(screen.getByLabelText("New password"), "new-password-1");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "new-password-1");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Your other devices were signed out.")).toBeInTheDocument();
    expect(sent).toEqual({ otp: "123456", new_password: "new-password-1", current_password: "old-password" });
    // Back to the first step.
    expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument();
  });

  it("lets a Google-only account set a password without a current one", async () => {
    let sent: unknown = null;
    server.use(
      http.post(`${API}/users/me/password`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ message: "ok" });
      }),
    );
    await openForm(false);

    expect(screen.getByRole("heading", { name: "Set a password" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Verification code"), "123456");
    await userEvent.type(screen.getByLabelText("New password"), "new-password-1");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "new-password-1");
    await userEvent.click(screen.getByRole("button", { name: "Set password" }));

    expect(await screen.findByText("Password set")).toBeInTheDocument();
    expect(sent).toEqual({ otp: "123456", new_password: "new-password-1", current_password: null });
  });

  it("validates the code, the current password and the confirmation", async () => {
    await openForm(true);

    await userEvent.type(screen.getByLabelText("Verification code"), "12ab");
    await userEvent.type(screen.getByLabelText("New password"), "new-password-1");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "different-1");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(screen.getByText("Enter the 6-digit code from the email.")).toBeInTheDocument();
    expect(screen.getByText("Enter your current password.")).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
  });

  it("shows the server's message for a wrong code", async () => {
    server.use(
      http.post(`${API}/users/me/password`, () =>
        apiError(400, "The code or your current password is incorrect, or the code has expired"),
      ),
    );
    await openForm(true);

    await userEvent.type(screen.getByLabelText("Verification code"), "000000");
    await userEvent.type(screen.getByLabelText("Current password"), "old-password");
    await userEvent.type(screen.getByLabelText("New password"), "new-password-1");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "new-password-1");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/code or your current password is incorrect/);
  });

  it("maps a 422 onto the new-password field", async () => {
    server.use(
      http.post(`${API}/users/me/password`, () =>
        apiError(422, "Validation error", {
          errors: [{ field: "body -> new_password", message: "String should have at most 128 characters", type: "x" }],
        }),
      ),
    );
    await openForm(true);

    await userEvent.type(screen.getByLabelText("Verification code"), "123456");
    await userEvent.type(screen.getByLabelText("Current password"), "old-password");
    await userEvent.type(screen.getByLabelText("New password"), "new-password-1");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "new-password-1");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("String should have at most 128 characters")).toBeInTheDocument();
  });

  it("puts resend on a cooldown", async () => {
    await openForm(true);
    expect(screen.getByRole("button", { name: /Resend in \d+s/ })).toBeDisabled();
  });

  it("shows why a code couldn't be sent", async () => {
    server.use(http.post(`${API}/users/me/password/otp`, () => apiError(429, "Too many requests. Try again later.")));
    renderWithProviders(<PasswordSection email={EMAIL} />);

    await userEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests. Try again later.");
  });
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

describe("SessionsSection", () => {
  it("lists devices and marks this one", async () => {
    server.use(
      http.get(`${API}/users/me/sessions`, () =>
        HttpResponse.json({ items: [session("s-me", true, CHROME), session("s-2", false, FIREFOX)] }),
      ),
    );
    renderWithProviders(<SessionsSection />);

    const list = await screen.findByRole("list", { name: "Signed-in devices" });
    expect(within(list).getByText("Chrome on Windows")).toBeInTheDocument();
    expect(within(list).getByText("Firefox on Linux")).toBeInTheDocument();
    expect(within(list).getByText("This device")).toBeInTheDocument();
  });

  it("signs out another device", async () => {
    let revoked: string | undefined;
    let items = [session("s-me", true, CHROME), session("s-2", false, FIREFOX)];
    server.use(
      http.get(`${API}/users/me/sessions`, () => HttpResponse.json({ items })),
      http.delete(`${API}/users/me/sessions/:id`, ({ params }) => {
        revoked = String(params.id);
        items = items.filter((s) => s.id !== revoked);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<SessionsSection />);

    await userEvent.click(await screen.findByRole("button", { name: "Sign out Firefox on Linux" }));

    expect(await screen.findByText("Device signed out")).toBeInTheDocument();
    expect(revoked).toBe("s-2");
    expect(await screen.findByText("You're only signed in on this device.")).toBeInTheDocument();
  });

  it("signing out this device ends the session", async () => {
    const onSessionExpired = vi.fn();
    configureClient({ onSessionExpired });
    server.use(
      http.get(`${API}/users/me/sessions`, () => HttpResponse.json({ items: [session("s-me", true, CHROME)] })),
      http.delete(`${API}/users/me/sessions/:id`, () => new HttpResponse(null, { status: 204 })),
    );
    renderWithProviders(<SessionsSection />);

    await userEvent.click(await screen.findByRole("button", { name: "Sign out Chrome on Windows (this device)" }));

    await vi.waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledWith("signed_out");
    });
  });

  it("signs out all other devices after confirming", async () => {
    let called = false;
    server.use(
      http.get(`${API}/users/me/sessions`, () =>
        HttpResponse.json({ items: [session("s-me", true, CHROME), session("s-2", false, FIREFOX)] }),
      ),
      http.post(`${API}/users/me/sessions/revoke-others`, () => {
        called = true;
        return HttpResponse.json({ revoked: 1 });
      }),
    );
    renderWithProviders(<SessionsSection />);

    await userEvent.click(await screen.findByRole("button", { name: "Sign out all other devices" }));
    const dialog = screen.getByRole("dialog", { name: "Sign out other devices?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Sign out devices" }));

    expect(await screen.findByText("1 device was signed out.")).toBeInTheDocument();
    expect(called).toBe(true);
  });

  it("shows the only-this-device state", async () => {
    server.use(http.get(`${API}/users/me/sessions`, () => HttpResponse.json({ items: [session("s-me", true, CHROME)] })));
    renderWithProviders(<SessionsSection />);

    expect(await screen.findByText("You're only signed in on this device.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out all other devices" })).not.toBeInTheDocument();
  });

  it("shows an error state with retry", async () => {
    server.use(http.get(`${API}/users/me/sessions`, () => apiError(500, "Internal server error")));
    renderWithProviders(<SessionsSection />);

    expect(await screen.findByText("Sessions couldn't be loaded")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Delete account
// ---------------------------------------------------------------------------

describe("DeleteAccountSection", () => {
  it("lists workspaces to hand over when the backend refuses (409)", async () => {
    server.use(
      http.post(`${API}/users/me/delete/otp`, () =>
        apiError(409, "You own organizations that have other members.", {
          orgs: [{ org_id: "org-1", name: "Arjun Design Studio", member_count: 3 }],
        }),
      ),
    );
    renderWithProviders(<DeleteAccountSection email={EMAIL} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete your account?" });

    expect(await within(dialog).findByText("Transfer or delete your workspaces first")).toBeInTheDocument();
    expect(within(dialog).getByText("Arjun Design Studio")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Manage members" })).toHaveAttribute(
      "href",
      "/app/settings/members?org=org-1",
    );
    expect(within(dialog).queryByLabelText("Verification code")).not.toBeInTheDocument();
  });

  it("deletes the account with the code, password and typed confirmation", async () => {
    const onSessionExpired = vi.fn();
    configureClient({ onSessionExpired });
    let sent: unknown = null;
    server.use(
      http.post(`${API}/users/me/delete/otp`, () => codeSent(true)),
      http.delete(`${API}/users/me`, async ({ request }) => {
        sent = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<DeleteAccountSection email={EMAIL} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete your account?" });
    await userEvent.type(await within(dialog).findByLabelText("Verification code"), "123456");
    await userEvent.type(within(dialog).getByLabelText("Current password"), "my-password");

    const submit = within(dialog).getByRole("button", { name: "Delete account" });
    expect(submit).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText("Type DELETE to confirm"), "DELETE");
    await userEvent.click(submit);

    await vi.waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledWith("account_deleted");
    });
    expect(sent).toEqual({ otp: "123456", current_password: "my-password" });
  });

  it("shows the server's message for a wrong code", async () => {
    server.use(
      http.post(`${API}/users/me/delete/otp`, () => codeSent(false)),
      http.delete(`${API}/users/me`, () => apiError(400, "The code is invalid or has expired. Request a new code and try again.")),
    );
    renderWithProviders(<DeleteAccountSection email={EMAIL} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete your account?" });
    await userEvent.type(await within(dialog).findByLabelText("Verification code"), "000000");
    expect(within(dialog).queryByLabelText("Current password")).not.toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText("Type DELETE to confirm"), "DELETE");
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("The code is invalid or has expired.");
  });
});
