import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION } from "./limits";
import { migrate, MIGRATIONS, type Migration } from "./migrations";

describe("migrate", () => {
  it("is the identity at the current version and never mutates its input", () => {
    const doc = Object.freeze({ schemaVersion: CURRENT_SCHEMA_VERSION, a: 1 });
    const result = migrate(doc, CURRENT_SCHEMA_VERSION);
    expect(result).toEqual({ ok: true, value: { schemaVersion: CURRENT_SCHEMA_VERSION, a: 1 } });
    expect(result.ok && result.value).not.toBe(doc);
    expect(Object.keys(MIGRATIONS)).toHaveLength(CURRENT_SCHEMA_VERSION - 1);
  });

  it("applies the chain vN -> vN+1 in order and stamps each version", () => {
    const chain: Record<number, Migration> = {
      1: (doc) => ({ ...doc, renamed: doc["old"], old: undefined }),
      2: (doc) => ({ ...doc, added: "v3" }),
    };
    const result = migrate({ schemaVersion: 1, old: "x" }, 1, chain, 3);
    expect(result).toEqual({
      ok: true,
      value: { schemaVersion: 3, renamed: "x", old: undefined, added: "v3" },
    });
  });

  it("fails on a missing step", () => {
    expect(migrate({}, 1, { 2: (d) => d }, 3)).toEqual({ ok: false, error: { fromVersion: 1 } });
  });

  it("fails instead of throwing when a step throws", () => {
    const chain: Record<number, Migration> = {
      1: () => {
        throw new Error("boom");
      },
    };
    expect(migrate({}, 1, chain, 2)).toEqual({ ok: false, error: { fromVersion: 1 } });
  });
});
