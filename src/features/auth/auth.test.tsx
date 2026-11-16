import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { tokenStore } from "@/shared/api/token-store";
import { API, apiError, server, tokenResponse } from "@/test/server";
import { renderWithProviders } from "@/test/render";

import { ForgotPasswordForm } from "./components/ForgotPasswordForm";
import { LoginForm } from "./components/LoginForm";
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
