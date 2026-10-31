import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DEFAULT_FC_SEED, resolveFcSeed } from "./setup/fastCheck";

describe("fast-check global seed", () => {
  it("is fixed by the Vitest setup file", () => {
    expect(fc.readConfigureGlobal().seed).toBe(resolveFcSeed(process.env["FC_SEED"]));
  });

  it("defaults when FC_SEED is unset or empty, and reads an integer otherwise", () => {
    expect(resolveFcSeed(undefined)).toBe(DEFAULT_FC_SEED);
    expect(resolveFcSeed(" ")).toBe(DEFAULT_FC_SEED);
    expect(resolveFcSeed("60940642")).toBe(60940642);
  });

  it("rejects a value that is not a 32-bit integer", () => {
    for (const raw of ["abc", "1.5", "4294967296", "-2147483649"]) {
      expect(() => resolveFcSeed(raw)).toThrow(/FC_SEED/);
    }
  });
});
