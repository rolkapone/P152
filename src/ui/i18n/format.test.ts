import { describe, expect, it } from "vitest";
import { formatCentimetres } from "./format";

describe("formatCentimetres", () => {
  it("shows millimetres as centimetres with at most one decimal", () => {
    expect(formatCentimetres(1400, "en")).toBe("140");
    expect(formatCentimetres(700, "en")).toBe("70");
    expect(formatCentimetres(705, "en")).toBe("70.5");
    expect(formatCentimetres(1234, "en")).toBe("123.4");
  });

  it("follows the language", () => {
    expect(formatCentimetres(705, "fr")).toBe("70,5");
  });
});
