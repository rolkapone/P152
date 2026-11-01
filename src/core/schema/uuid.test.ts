import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { SetupV1Schema } from "./setupV1";
import { UUID_BYTES, uuidV4FromBytes } from "./uuid";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SetupId = SetupV1Schema.shape.id;

describe("uuidV4FromBytes", () => {
  it("formats 16 bytes as a v4 UUID, version and variant bits forced", () => {
    const bytes = Uint8Array.from({ length: UUID_BYTES }, (_, i) => i);
    expect(uuidV4FromBytes(bytes)).toBe("00010203-0405-4607-8809-0a0b0c0d0e0f");
    expect(uuidV4FromBytes(new Uint8Array(UUID_BYTES))).toBe(
      "00000000-0000-4000-8000-000000000000",
    );
    expect(uuidV4FromBytes(new Uint8Array(UUID_BYTES).fill(0xff))).toBe(
      "ffffffff-ffff-4fff-bfff-ffffffffffff",
    );
  });

  it("does not modify the bytes it receives", () => {
    const bytes = new Uint8Array(UUID_BYTES).fill(0xff);
    uuidV4FromBytes(bytes);
    expect(Array.from(bytes)).toEqual(new Array(UUID_BYTES).fill(0xff));
  });

  it("refuses any other number of bytes", () => {
    expect(uuidV4FromBytes(new Uint8Array(15))).toBeNull();
    expect(uuidV4FromBytes(new Uint8Array(17))).toBeNull();
    expect(uuidV4FromBytes(new Uint8Array(0))).toBeNull();
  });

  it("always gives a v4 UUID accepted as a setup id (fixed seed)", () => {
    fc.assert(
      fc.property(fc.uint8Array({ minLength: UUID_BYTES, maxLength: UUID_BYTES }), (bytes) => {
        const id = uuidV4FromBytes(bytes);
        expect(id).toMatch(V4);
        expect(SetupId.safeParse(id).success).toBe(true);
      }),
      { seed: 20261101, numRuns: 500 },
    );
  });
});
