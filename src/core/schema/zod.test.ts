import { afterEach, describe, expect, it, vi } from "vitest";
import { fixture } from "../../../tests/unit/helpers/fixtures";
import { SetupV1Schema } from "./setupV1";
import { z } from "./zod";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Zod configuration (CSP without unsafe-eval)", () => {
  it("is jitless", () => {
    expect(z.config().jitless).toBe(true);
  });

  it("validates without ever generating code through Function", () => {
    const calls: unknown[] = [];
    const forbidden = function (...args: unknown[]) {
      calls.push(args);
      throw new EvalError("Function constructor blocked by CSP");
    };
    const doc: unknown = JSON.parse(fixture("valid", "full"));
    // Fresh schema: a JIT would compile it on first use.
    const schema = SetupV1Schema.extend({});
    vi.stubGlobal("Function", forbidden);
    const result = schema.safeParse(doc);
    vi.unstubAllGlobals();
    expect(calls).toEqual([]);
    expect(result.success).toBe(true);
  });
});
