import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { tokenStore } from "@/shared/api/token-store";
import { API, apiError, server, tokenResponse } from "@/test/server";
import { renderWithProviders } from "@/test/render";

import { ForgotPasswordForm } from "./components/ForgotPasswordForm";
import { LoginForm } from "./components/LoginForm";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordForm } from "./components/ResetPasswordForm";
import { SignupForm } from "./components/SignupForm";

describe("LoginForm", () => {
  it("validates before calling the API", async () => {
    renderWithProviders(<LoginForm onSuccess={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
  });

  it("stores the token and calls onSuccess", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ ...tokenResponse("tok"), user_id: "u1", email: "a@b.in", full_name: "A" }),
      ),
    );
    const onSuccess = vi.fn();
    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Email"), "a@b.in");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
    expect(tokenStore.get()).toBe("tok");
  });

  it("shows the backend's error message", async () => {
    server.use(http.post(`${API}/auth/login`, () => apiError(401, "Invalid email or password")));
    renderWithProviders(<LoginForm onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Email"), "a@b.in");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });
});

describe("LoginForm: deleted account", () => {
  const pendingDeletion = () =>
    apiError(403, "This account was deleted. You can restore it until the date shown.", {
      code: "account_pending_deletion",
      restore_until: "2026-12-18T12:00:00Z",
    });

  it("offers to restore, then logs in with restore_account", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as { restore_account?: boolean };
        bodies.push(body);
        if (!body.restore_account) return pendingDeletion();
        return HttpResponse.json({ ...tokenResponse("tok"), user_id: "u1", email: "a@b.in", full_name: "A" });
      }),
    );
    const onSuccess = vi.fn();
    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Email"), "a@b.in");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    const dialog = await screen.findByRole("dialog", { name: "Restore your account?" });
    expect(within(dialog).getByText("18 Dec 2026")).toBeInTheDocument();
    // The generic "couldn't log you in" alert is replaced by the dialog.
    expect(screen.queryByText("We couldn't log you in.")).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Restore and log in" }));

    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
    expect(bodies).toEqual([
      { email: "a@b.in", password: "secret", restore_account: false },
      { email: "a@b.in", password: "secret", restore_account: true },
    ]);
    expect(await screen.findByText("Your account was restored.")).toBeInTheDocument();
  });

  it("cancelling the restore dialog leaves the user logged out", async () => {
    server.use(http.post(`${API}/auth/login`, () => pendingDeletion()));
    const onSuccess = vi.fn();
    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Email"), "a@b.in");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    const dialog = await screen.findByRole("dialog", { name: "Restore your account?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Restore your account?" })).not.toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("LoginPage", () => {
  it.each([
    ["account_deleted", "Your account was deleted."],
    ["signed_out", "You signed out of this device."],
  ])("explains ?reason=%s", (reason, text) => {
    renderWithProviders(<LoginPage />, { route: `/login?reason=${reason}` });
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("ignores unknown reasons", () => {
    renderWithProviders(<LoginPage />, { route: "/login?reason=<script>" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("SignupForm", () => {
  it("accepts an 8-character password (matches backend min_length=8)", async () => {
    server.use(
      http.post(`${API}/auth/signup`, () =>
        HttpResponse.json({ ...tokenResponse(), user_id: "u1", email: "a@b.in", full_name: "A" }, { status: 201 }),
      ),
    );
    const onSuccess = vi.fn();
    renderWithProviders(<SignupForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Full name"), "Arjun");
    await userEvent.type(screen.getByLabelText("Email"), "a@b.in");
    await userEvent.type(screen.getByLabelText("Password"), "abcdefgh");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("maps a 422 on full_name to the Full name field", async () => {
    server.use(
      http.post(`${API}/auth/signup`, () =>
        apiError(422, "Validation error", {
          errors: [{ field: "body -> full_name", message: "Name not allowed", type: "value_error" }],
        }),
      ),
    );
    renderWithProviders(<SignupForm onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Full name"), "Arjun");
    await userEvent.type(screen.getByLabelText("Email"), "a@b.in");
    await userEvent.type(screen.getByLabelText("Password"), "abcdefgh");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Name not allowed")).toBeInTheDocument();
  });
});

describe("ForgotPasswordForm", () => {
  it("shows the same confirmation regardless of whether the account exists", async () => {
    server.use(
      http.post(`${API}/auth/password/forgot`, () =>
        HttpResponse.json({ message: "If the email exists, a reset link has been sent" }),
      ),
    );
    renderWithProviders(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText("Email"), "nobody@b.in");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
  });
});

describe("ResetPasswordForm", () => {
  it("shows the invalid-link state without a token", () => {
    renderWithProviders(<ResetPasswordForm token={null} />);
    expect(screen.getByRole("heading", { name: "This link doesn't work" })).toBeInTheDocument();
  });

  it("requires both passwords to match", async () => {
    renderWithProviders(<ResetPasswordForm token="t" />);

    await userEvent.type(screen.getByLabelText("New password"), "abcdefgh");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "abcdefgX");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
  });

  it("resets the password", async () => {
    let sent: unknown;
    server.use(
      http.post(`${API}/auth/password/reset`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ message: "Password has been reset successfully" });
      }),
    );
    renderWithProviders(<ResetPasswordForm token="t" />);

    await userEvent.type(screen.getByLabelText("New password"), "abcdefgh");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "abcdefgh");
    await userEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByRole("heading", { name: "Password updated" })).toBeInTheDocument();
    expect(sent).toEqual({ token: "t", new_password: "abcdefgh" });
  });
});
