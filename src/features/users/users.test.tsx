import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { me } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { API, server } from "@/test/server";

import { ProfilePage } from "./pages/ProfilePage";

describe("ProfilePage", () => {
  it("saves a new name and shows unbuilt sections as Soon", async () => {
    let sent: unknown;
    server.use(
      http.get(`${API}/users/me`, () => HttpResponse.json(me)),
      http.patch(`${API}/users/me`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ ...me, full_name: "Arjun M", updated_at: "2026-02-01T00:00:00Z" });
      }),
    );
    renderWithProviders(<ProfilePage />);

    const name = await screen.findByLabelText("Full name");
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();

    await userEvent.clear(name);
    await userEvent.type(name, "Arjun M");
    await userEvent.click(save);

    expect(await screen.findByText("Profile updated")).toBeInTheDocument();
    expect(sent).toEqual({ full_name: "Arjun M" });
    expect(screen.getByRole("button", { name: "Update password" })).toBeDisabled();
  });
});
