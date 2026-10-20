import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { utf8ByteLength } from "./utf8";

describe("utf8ByteLength", () => {
  it.each([
    ["", 0],
    ["abc", 3],
    ["é", 2],
    ["€", 3],
    ["😀", 4],
    ["\ud800", 3],
    ["\ud800x", 4],
    ["\udc00", 3],
  ])("measures %j as %i bytes", (text, bytes) => {
    expect(utf8ByteLength(text)).toBe(bytes);
  });

  it("matches TextEncoder for any string", () => {
    const encoder = new TextEncoder();
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (text) => {
        expect(utf8ByteLength(text)).toBe(encoder.encode(text).length);
      }),
    );
  });

  it("stops counting once the limit is exceeded", () => {
    expect(utf8ByteLength("a".repeat(100), 10)).toBe(11);
  });
});
