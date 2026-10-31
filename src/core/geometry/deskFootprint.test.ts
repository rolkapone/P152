import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { testCatalog } from "../../../tests/unit/helpers/fixtures";
import { deskChoices, deskSpec, type CornerDeskSpec, type DeskSpec } from "../catalog/desk";
import {
  deskArea,
  deskBounds,
  deskFootprint,
  deskOutline,
  isOnDesk,
  polygonArea,
} from "./deskFootprint";

const catalog = testCatalog();
const corner = catalog.objectTypes.get("desk.corner")!;

/** Any L-shaped desk inside the catalog bounds of desk.corner. */
const anyCorner = fc
  .record({
    width: fc.integer({ min: 1200, max: 2400 }),
    depth: fc.integer({ min: 1000, max: 2000 }),
    armDepth: fc.integer({ min: 500, max: 800 }),
    wingWidth: fc.integer({ min: 500, max: 800 }),
    orientation: fc.constantFrom("right", "left"),
  })
  .map((params) => deskSpec(corner, params) as CornerDeskSpec);

describe("desk footprint (real top, mm)", () => {
  it("is one rectangle for a rectangular desk, equal to its bounds", () => {
    const desk = deskSpec(catalog.objectTypes.get("desk.rect")!)!;
    expect(deskFootprint(desk)).toEqual([{ minX: -700, maxX: 700, minZ: -350, maxZ: 350 }]);
    expect(deskOutline(desk)).toHaveLength(4);
    expect(deskArea(desk)).toBe(1400 * 700);
  });

  it("is the main arm and the wing on the right for the corner desk 160 x 140", () => {
    const desk = deskSpec(corner)!;
    expect(deskFootprint(desk)).toEqual([
      { minX: -800, maxX: 800, minZ: -700, maxZ: -100 },
      { minX: 200, maxX: 800, minZ: -100, maxZ: 700 },
    ]);
    expect(isOnDesk(desk, -700, 600)).toBe(false); // inner corner of the L: not desk
    expect(isOnDesk(desk, 700, 600)).toBe(true); // on the wing
    expect(isOnDesk(desk, -700, -600)).toBe(true); // on the arm
  });

  it("mirrors the wing for orientation left", () => {
    const desk = deskSpec(corner, { orientation: "left" })!;
    expect(deskFootprint(desk)[1]).toEqual({ minX: -800, maxX: -200, minZ: -100, maxZ: 700 });
    expect(deskOutline(desk)[0]).toEqual([-800, -700]);
  });

  it("matches the dimensions of every desk of the list (1 mm)", () => {
    for (const { spec } of deskChoices(catalog)) {
      const b = deskBounds(spec);
      expect(Math.abs(b.maxX - b.minX - spec.widthMm)).toBeLessThanOrEqual(1);
      expect(Math.abs(b.maxZ - b.minZ - spec.depthMm)).toBeLessThanOrEqual(1);
    }
  });

  it("outline and rectangles describe the same L, whatever its size and side", () => {
    fc.assert(
      fc.property(anyCorner, (desk: DeskSpec & CornerDeskSpec) => {
        const area =
          desk.widthMm * desk.depthMm -
          (desk.widthMm - desk.wingWidthMm) * (desk.depthMm - desk.armDepthMm);
        const outline = deskOutline(desk);
        expect(outline).toHaveLength(6);
        expect(polygonArea(outline)).toBeCloseTo(area, 6);
        expect(deskArea(desk)).toBeCloseTo(area, 6);
        // Rectangles inside the bounds, touching without overlap.
        const [arm, wing] = deskFootprint(desk) as [
          ReturnType<typeof deskBounds>,
          ReturnType<typeof deskBounds>,
        ];
        expect(arm.maxZ).toBe(wing.minZ);
        const b = deskBounds(desk);
        for (const rect of [arm, wing]) {
          expect(rect.minX).toBeGreaterThanOrEqual(b.minX);
          expect(rect.maxX).toBeLessThanOrEqual(b.maxX);
          expect(rect.minZ).toBeGreaterThanOrEqual(b.minZ);
          expect(rect.maxZ).toBeLessThanOrEqual(b.maxZ);
        }
        // The front corner opposite to the wing is never desk.
        const side = desk.orientation === "right" ? -1 : 1;
        expect(isOnDesk(desk, side * (b.maxX - 1), b.maxZ - 1)).toBe(false);
        // Every outline vertex is on the top.
        return outline.every(([x, z]) => isOnDesk(desk, x, z));
      }),
      { seed: 20261031, numRuns: 300 },
    );
  });
});
