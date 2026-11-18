import { describe, expect, it } from "vitest";

import { deviceLabel } from "./device-label";

describe("deviceLabel", () => {
  it.each([
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      "Chrome on Windows",
    ],
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
      "Safari on macOS",
    ],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0", "Firefox on Linux"],
    [
      "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0",
      "Edge on Windows",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      "Safari on iOS",
    ],
    ["python-httpx/0.27", "Unknown device"],
    [null, "Unknown device"],
  ])("%s → %s", (ua, expected) => {
    expect(deviceLabel(ua)).toBe(expected);
  });
});
