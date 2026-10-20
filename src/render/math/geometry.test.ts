import { describe, expect, it } from "vitest";
import { testCatalog } from "../../../tests/unit/helpers/fixtures";
import { toStudioConfig } from "../../core";
import { CONTACT_CORE, contactShadowPixels } from "./contactShadow";
import { cycloramaBuffers, cycloramaProfile, triangleCount } from "./cyclorama";
import { DESK_STYLE_MM, deskLayout } from "./deskLayout";
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

describe("deskLayout (desk.rect 1400 x 700 x 740, top 25 mm)", () => {
  const layout = deskLayout(config.desk);

  it("puts the top surface at the desk height, origin on the floor", () => {
    expect(layout.top.size).toEqual([1.4, 0.025, 0.7]);
    expect(layout.top.center[1] + layout.top.size[1] / 2).toBeCloseTo(0.74);
    expect(layout.top.radius).toBeCloseTo(0.009);
  });

  it("places 4 posts from the floor to the top, inset 60 mm", () => {
    expect(layout.legs.positions).toHaveLength(4);
    for (const [x, y, z] of layout.legs.positions) {
      expect(Math.abs(x)).toBeCloseTo(0.64);
      expect(Math.abs(z)).toBeCloseTo(0.29);
      expect(y - layout.legs.height / 2).toBeCloseTo(0);
      expect(y + layout.legs.height / 2).toBeCloseTo(0.715);
    }
    expect(layout.legs.radiusTop).toBeCloseTo(0.022);
    expect(layout.legs.radiusBottom).toBeCloseTo(0.018);
  });

  it("puts the rear rail between the back posts, 45 mm under the top", () => {
    expect(layout.rail.size[0]).toBeCloseTo(1.28);
    expect(layout.rail.center[1]).toBeCloseTo(0.74 - 0.025 - 0.045);
    expect(layout.rail.center[2]).toBeCloseTo(-0.29);
  });

  it("lists one floor footprint per foot", () => {
    expect(layout.feet).toHaveLength(4);
    expect(layout.feet[0]?.size).toEqual([0.07, 0.07]);
    expect(layout.feet.every((foot) => foot.center[1] === 0)).toBe(true);
  });

  it("caps the edge radius to half the thickness", () => {
    const thin = deskLayout({ ...config.desk, thicknessMm: 10, edgeRadiusMm: 9 });
    expect(thin.top.radius).toBeLessThan(0.005);
  });

  it("follows other desk sizes of the catalog range", () => {
    const large = deskLayout({ ...config.desk, widthMm: 1800, depthMm: 800 });
    expect(large.legs.positions[3]?.[0]).toBeCloseTo(0.9 - DESK_STYLE_MM.legInset / 1000);
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
