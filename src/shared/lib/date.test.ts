import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime } from "./date";

describe("formatDate", () => {
  it("formats an ISO timestamp as day, short month and year", () => {
    // Midday UTC lands on the same calendar day in every time zone.
    expect(formatDate("2026-12-18T12:00:00Z")).toBe("18 Dec 2026");
  });

  it("returns unparseable input unchanged", () => {
    expect(formatDate("not a date")).toBe("not a date");
  });
});

describe("formatDateTime", () => {
  it("includes the date and a time", () => {
    expect(formatDateTime("2026-12-18T12:00:00Z")).toMatch(/^18 Dec 2026, \d{1,2}:\d{2}\s?(am|pm)$/i);
  });

  it("returns unparseable input unchanged", () => {
    expect(formatDateTime("")).toBe("");
  });
});
