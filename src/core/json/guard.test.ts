import { describe, expect, it } from "vitest";
import { FORBIDDEN_KEYS, inspectJsonTree, isPlainRecord } from "./guard";
import { formatJsonPath } from "./path";

describe("inspectJsonTree", () => {
  it("accepts plain JSON data and primitives", () => {
    expect(inspectJsonTree(JSON.parse('{"a":[1,{"b":null}],"c":"x"}'), 8)).toBeNull();
    expect(inspectJsonTree(42, 8)).toBeNull();
    expect(inspectJsonTree(null, 8)).toBeNull();
    expect(inspectJsonTree(Object.create(null), 8)).toBeNull();
  });

  it.each([...FORBIDDEN_KEYS])("rejects the key %s at any depth", (key) => {
    const root = JSON.parse(`{"a":[{"b":{"${key}":{"x":1}}}]}`);
    expect(inspectJsonTree(root, 16)).toEqual({ code: "forbiddenKey", path: ["a", 0, "b", key] });
    expect(inspectJsonTree(JSON.parse(`{"${key}":1}`), 16)?.code).toBe("forbiddenKey");
  });

  it("rejects containers deeper than the limit, iteratively", () => {
    const deep = JSON.parse("[".repeat(100_000) + "]".repeat(100_000));
    expect(inspectJsonTree(deep, 16)?.code).toBe("tooDeep");
    expect(inspectJsonTree([[[]]], 3)).toBeNull();
    expect(inspectJsonTree([[[[]]]], 3)).toEqual({ code: "tooDeep", path: [0, 0, 0] });
  });

  it("rejects objects whose prototype was replaced (object literal __proto__)", () => {
    const literal = { __proto__: { polluted: true }, a: 1 };
    expect(inspectJsonTree({ nested: literal }, 8)).toEqual({
      code: "notPlainObject",
      path: ["nested"],
    });
    expect(inspectJsonTree(new Date(0), 8)?.code).toBe("notPlainObject");
  });
});

describe("isPlainRecord", () => {
  it("is true only for non-array objects", () => {
    expect(isPlainRecord({})).toBe(true);
    expect(isPlainRecord([])).toBe(false);
    expect(isPlainRecord(null)).toBe(false);
    expect(isPlainRecord("x")).toBe(false);
  });
});

describe("formatJsonPath", () => {
  it("formats keys and indexes", () => {
    expect(formatJsonPath(["objects", 3, "params", "width"])).toBe("objects[3].params.width");
    expect(formatJsonPath([])).toBe("");
    expect(formatJsonPath([0, "a"])).toBe("[0].a");
  });

  it("never echoes untrusted keys and truncates long paths", () => {
    expect(formatJsonPath(["extensions", "<img src=x onerror=alert(1)>"])).toBe("extensions.?");
    expect(formatJsonPath([Symbol("s")])).toBe("?");
    const long = formatJsonPath(Array.from({ length: 40 }, () => "segment"));
    expect(long.length).toBe(120);
    expect(long.endsWith("…")).toBe(true);
  });
});
