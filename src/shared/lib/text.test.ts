import { describe, expect, it } from "vitest";

import { initials } from "./initials";
import { maskEmail } from "./mask-email";

describe("initials", () => {
  it.each([
    ["Arjun Mehta", "AM"],
    ["Priya Lakshmi Nair", "PN"],
    ["Meera", "ME"],
    ["kabir@studio.in", "KA"],
    ["  ", "?"],
  ])("%s → %s", (input, expected) => {
    expect(initials(input)).toBe(expected);
  });
});

describe("maskEmail", () => {
  it("keeps the first two characters and the domain", () => {
    expect(maskEmail("arjun@studio.in")).toBe("ar***@studio.in");
  });
  it("returns non-emails unchanged", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
});
