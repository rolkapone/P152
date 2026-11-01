import { describe, expect, it, vi } from "vitest";
import { randomUuid, type RandomSource } from "./randomUuid";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Deterministic bytes 0, 1, 2… instead of random ones. */
function countingBytes(array: Uint8Array<ArrayBuffer>): Uint8Array {
  array.forEach((_, i) => (array[i] = i));
  return array;
}

describe("randomUuid", () => {
  it("uses crypto.randomUUID in a secure context", () => {
    const getRandomValues = vi.fn(countingBytes);
    const source: RandomSource = {
      randomUUID: () => "11111111-2222-4333-8444-555555555555",
      getRandomValues,
    };
    expect(randomUuid(source)).toBe("11111111-2222-4333-8444-555555555555");
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it("falls back to crypto.getRandomValues outside a secure context (no randomUUID)", () => {
    const getRandomValues = vi.fn(countingBytes);
    expect(randomUuid({ getRandomValues })).toBe("00010203-0405-4607-8809-0a0b0c0d0e0f");
    expect(getRandomValues).toHaveBeenCalledTimes(1);
    expect(getRandomValues.mock.calls[0]![0]).toHaveLength(16);
  });

  it("keeps the method bound to its crypto object", () => {
    const source = {
      getRandomValues(this: unknown, array: Uint8Array<ArrayBuffer>): Uint8Array {
        expect(this).toBe(source);
        return countingBytes(array);
      },
    };
    expect(randomUuid(source)).toMatch(V4);
  });

  it("defaults to the Web Crypto of the page", () => {
    expect(randomUuid()).toMatch(V4);
  });
});
