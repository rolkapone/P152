import { describe, expect, it } from "vitest";
import { testCatalog } from "../../../tests/unit/helpers/fixtures";
import { deskSpec, toStudioConfig } from "../../core";
import { CONTACT_CORE, contactShadowPixels, deskContactFootprints } from "./contactShadow";
import { cycloramaBuffers, cycloramaProfile, triangleCount } from "./cyclorama";
import { cubicBezier, EASE_IN_OUT } from "./easing";
import { clamp, mmToM } from "./units";

const config = toStudioConfig(testCatalog().studio);

describe("units", () => {
  it("converts millimetres to metres", () => {
    expect(mmToM(1400)).toBe(1.4);
    expect(mmToM(25)).toBe(0.025);
    expect(mmToM(0)).toBe(0);
  });
  it("clamps", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});

describe("easing (--ease-in-out, 480 ms view transitions)", () => {
  it("starts at 0, ends at 1, outside values clamped", () => {
    expect(EASE_IN_OUT(0)).toBe(0);
    expect(EASE_IN_OUT(1)).toBe(1);
    expect(EASE_IN_OUT(-1)).toBe(0);
    expect(EASE_IN_OUT(2)).toBe(1);
  });
  it("is symmetric and monotonic (in-out)", () => {
    let previous = 0;
    for (let t = 0.05; t < 1; t += 0.05) {
      const value = EASE_IN_OUT(t);
      expect(value).toBeGreaterThanOrEqual(previous);
      expect(value + EASE_IN_OUT(1 - t)).toBeCloseTo(1, 5);
      previous = value;
    }
    expect(EASE_IN_OUT(0.5)).toBeCloseTo(0.5, 5);
    expect(EASE_IN_OUT(0.2)).toBeLessThan(0.1); // slow start
  });
  it("is the identity for a linear curve", () => {
    const linear = cubicBezier(0.25, 0.25, 0.75, 0.75);
    for (const t of [0.1, 0.33, 0.9]) expect(linear(t)).toBeCloseTo(t, 6);
  });
  it("solves a curve with flat slopes", () => {
    const steep = cubicBezier(1, 0, 0, 1);
    expect(steep(0.5)).toBeCloseTo(0.5, 4);
    expect(steep(0.25)).toBeLessThan(0.25);
  });
});

describe("cyclorama", () => {
  const buffers = cycloramaBuffers(config.cyclorama);

  it("runs from the floor front edge to the top of the back wall", () => {
    const profile = cycloramaProfile(config.cyclorama);
    expect(profile[0]).toEqual([9, 0]);
    expect(profile.at(-1)).toEqual([-1.6 - 1.5, 7]);
    expect(profile).toHaveLength(config.cyclorama.segments + 3);
  });

  it("stays within the triangle budget of the catalog", () => {
    expect(triangleCount(buffers)).toBe((config.cyclorama.segments + 2) * 2);
    expect(triangleCount(buffers)).toBeLessThanOrEqual(config.cyclorama.tris);
  });

  it("has unit normals facing the scene (up on the floor, +Z on the wall)", () => {
    for (let i = 0; i < buffers.normals.length; i += 3) {
      const length = Math.hypot(
        buffers.normals[i]!,
        buffers.normals[i + 1]!,
        buffers.normals[i + 2]!,
      );
      expect(length).toBeCloseTo(1);
    }
    expect(buffers.normals[1]).toBeCloseTo(1); // floor: +Y
    expect(buffers.normals.at(-1)).toBeCloseTo(1); // wall top: +Z
  });
});

describe("contact shadow texture", () => {
  const size = 64;
  const pixels = contactShadowPixels(size);
  const alpha = (i: number, j: number) => pixels[(j * size + i) * 4 + 3]!;

  it("is opaque black at the centre and transparent at the corners", () => {
    expect(alpha(size / 2, size / 2)).toBe(255);
    expect(alpha(0, 0)).toBe(0);
    expect(pixels[0]).toBe(0);
  });

  it("is symmetric", () => {
    expect(alpha(5, 20)).toBe(alpha(size - 1 - 5, 20));
    expect(alpha(20, 5)).toBe(alpha(20, size - 1 - 5));
  });

  it("darkens the whole footprint core", () => {
    const edge = Math.round(((1 - CONTACT_CORE) / 2) * size) + 2;
    expect(alpha(edge, size / 2)).toBeGreaterThan(128);
  });
});

describe("desk contact footprints (US-006, PO decision 31: desk minus 200 x 140 mm)", () => {
  const catalog = testCatalog();
  const rect = catalog.objectTypes.get("desk.rect")!;
  const corner = catalog.objectTypes.get("desk.corner")!;
  const inset = config.lighting.contactShadow.deskInsetMm;

  it("reads the lighter shadow of studio.json", () => {
    expect(config.lighting.contactShadow.opacity).toBe(0.24);
    expect(inset).toEqual([200, 140]);
  });

  it("is the desk minus the inset, for every rectangular size", () => {
    for (const width of [1000, 1400, 1800]) {
      const [plane, ...rest] = deskContactFootprints(deskSpec(rect, { width, depth: 800 })!, inset);
      expect(rest).toEqual([]);
      expect(plane!.x).toBe(0);
      expect(plane!.z).toBe(0);
      expect(plane!.width).toBeCloseTo((width - 200) / 1000, 9);
      expect(plane!.depth).toBeCloseTo(0.66, 9);
    }
  });

  it("is the main arm and the wing for the L, mirrored for orientation left", () => {
    const [arm, wing] = deskContactFootprints(deskSpec(corner)!, inset);
    expect(arm!.width).toBeCloseTo(1.4, 9);
    expect(arm!.depth).toBeCloseTo(0.46, 9);
    expect(arm!.z).toBeCloseTo(-0.4, 9);
    expect(wing!.x).toBeCloseTo(0.5, 9);
    expect(wing!.width).toBeCloseTo(0.4, 9);
    // The wing overlaps the arm by 40 mm and stops 70 mm before the front edge.
    expect(wing!.z - wing!.depth / 2).toBeCloseTo(-0.14, 9);
    expect(wing!.z + wing!.depth / 2).toBeCloseTo(0.63, 9);
    const [, left] = deskContactFootprints(deskSpec(corner, { orientation: "left" })!, inset);
    expect(left!.x).toBeCloseTo(-0.5, 9);
  });

  it("never gives an empty plane, even with a huge inset", () => {
    const planes = deskContactFootprints(deskSpec(corner)!, [5000, 5000]);
    expect(planes.every((plane) => plane.width > 0 && plane.depth > 0)).toBe(true);
  });
});
