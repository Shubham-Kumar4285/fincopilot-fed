import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { API, apiError, server, tokenResponse } from "@/test/server";

import { api, configureClient } from "./client";
import { ApiError, fieldErrors } from "./errors";
import { tokenStore } from "./token-store";

describe("api client", () => {
  it("parses the backend error envelope into ApiError", async () => {
    server.use(http.get(`${API}/thing`, () => apiError(409, "Invoice already issued", { id: "x" })));

    const error = await api.get("/thing").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: "Invoice already issued", details: { id: "x" } });
  });

  it("maps 422 field errors to form field names", async () => {
    server.use(
      http.post(`${API}/auth/signup`, () =>
        apiError(422, "Validation error", {
          errors: [{ field: "body -> email", message: "value is not a valid email address", type: "value_error" }],
        }),
      ),
    );

    const error = await api.post("/auth/signup", {}).catch((e: unknown) => e);

    expect(fieldErrors(error)).toEqual({ email: "value is not a valid email address" });
  });

  it("turns a network failure into ApiError with status 0", async () => {
    server.use(http.get(`${API}/thing`, () => HttpResponse.error()));

    await expect(api.get("/thing")).rejects.toMatchObject({ status: 0 });
  });

  it("resolves 204 to undefined for any method", async () => {
    server.use(http.post(`${API}/thing`, () => new HttpResponse(null, { status: 204 })));

    await expect(api.post("/thing")).resolves.toBeUndefined();
  });

  it("attaches the bearer token", async () => {
    tokenStore.set("abc");
    let auth: string | null = null;
    server.use(
      http.get(`${API}/me`, ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({});
      }),
    );

    await api.get("/me");

    expect(auth).toBe("Bearer abc");
  });

  it("refreshes once for concurrent 401s, then retries each request once", async () => {
    tokenStore.set("expired");
    let refreshCalls = 0;
    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json(tokenResponse("fresh"));
      }),
      http.get(`${API}/data`, ({ request }) =>
        request.headers.get("Authorization") === "Bearer fresh"
          ? HttpResponse.json({ ok: true })
          : apiError(401, "Invalid or expired token"),
      ),
    );

    const results = await Promise.all([api.get("/data"), api.get("/data"), api.get("/data")]);

    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshCalls).toBe(1);
    expect(tokenStore.get()).toBe("fresh");
  });

  it("calls onSessionExpired and throws when refresh fails", async () => {
    const onSessionExpired = vi.fn();
    configureClient({ onSessionExpired });
    server.use(
      http.post(`${API}/auth/refresh`, () => apiError(401, "Invalid refresh token")),
      http.get(`${API}/data`, () => apiError(401, "Invalid or expired token")),
    );

    await expect(api.get("/data")).rejects.toMatchObject({ status: 401 });
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it("does not retry a second time when the retried request is also 401", async () => {
    let dataCalls = 0;
    server.use(
      http.post(`${API}/auth/refresh`, () => HttpResponse.json(tokenResponse("fresh"))),
      http.get(`${API}/data`, () => {
        dataCalls += 1;
        return apiError(401, "Invalid or expired token");
      }),
    );

    await expect(api.get("/data")).rejects.toMatchObject({ status: 401 });
    expect(dataCalls).toBe(2);
  });
});
