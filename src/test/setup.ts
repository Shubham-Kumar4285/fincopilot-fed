import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { tokenStore } from "@/shared/api/token-store";

import { server } from "./server";

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});
afterEach(() => {
  server.resetHandlers();
  tokenStore.clear();
  cleanup();
});
afterAll(() => {
  server.close();
});
