import { describe, expect, it } from "vitest";
import { testCatalog } from "../../../tests/unit/helpers/fixtures";
import { deskSpec, studioDeskSpec, toStudioConfig, type DeskSpec } from "../../core";
import { DESK_STYLE_MM, deskLayout, deskVolumeOf, type DeskLayout } from "./deskLayout";

const catalog = testCatalog();
const config = toStudioConfig(catalog.studio);
const EDGE = config.desk.edgeRadiusMm;
const corner = (params: Record<string, string | number> = {}) =>
  deskSpec(catalog.objectTypes.get("desk.corner")!, params)!;

const boxTop = (layout: DeskLayout) => {
  if (layout.top.kind !== "box") throw new Error("box top expected");
  return layout.top.part;
};

describe("deskLayout, desk.rect 1400 x 700 x 740, top 25 mm", () => {
  const layout = deskLayout(studioDeskSpec(config), EDGE);

  it("puts the top surface at the desk height, origin on the floor", () => {
    const top = boxTop(layout);
    expect(top.size).toEqual([1.4, 0.025, 0.7]);
    expect(top.center[1] + top.size[1] / 2).toBeCloseTo(0.74);
    expect(top.radius).toBeCloseTo(0.009);
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
    expect(layout.rails).toHaveLength(1);
    const [rail] = layout.rails;
    expect(rail!.size[0]).toBeCloseTo(1.28);
    expect(rail!.center[0]).toBeCloseTo(0);
    expect(rail!.center[1]).toBeCloseTo(0.74 - 0.025 - 0.045);
    expect(rail!.center[2]).toBeCloseTo(-0.29);
  });

  it("lists one floor footprint per foot", () => {
    expect(layout.feet).toHaveLength(4);
    expect(layout.feet[0]?.size).toEqual([0.07, 0.07]);
    expect(layout.feet.every((foot) => foot.center[1] === 0)).toBe(true);
  });

  it("caps the edge radius to half the thickness", () => {
    const thin = deskLayout({ ...studioDeskSpec(config), thicknessMm: 10 } as DeskSpec, 9);
    expect(boxTop(thin).radius).toBeLessThan(0.005);
  });

  it("follows other desk sizes of the catalog range", () => {
    const large = deskLayout(
      { ...studioDeskSpec(config), widthMm: 1800, depthMm: 800 } as DeskSpec,
      EDGE,
    );
    const xs = large.legs.positions.map(([x]) => x);
    expect(Math.max(...xs)).toBeCloseTo(0.9 - DESK_STYLE_MM.legInset / 1000);
  });
});

describe("deskLayout, desk.corner (L, orientation right), 160 x 140, arm 60, wing 60", () => {
  const layout = deskLayout(corner(), EDGE);

  it("extrudes the L outline: 6 corners, 25 mm rounding, 12 mm at the inner corner", () => {
    if (layout.top.kind !== "outline") throw new Error("outline top expected");
    const { outline, radii, bottom, thickness, bevel } = layout.top;
    expect(outline).toEqual([
      [-0.8, -0.7],
      [0.8, -0.7],
      [0.8, 0.7],
      [0.2, 0.7],
      [0.2, -0.1],
      [-0.8, -0.1],
    ]);
    expect(radii.map((r) => Math.round(r * 1000))).toEqual([25, 25, 25, 25, 12, 25]);
    expect(bottom + thickness).toBeCloseTo(0.74);
    expect(bevel).toBeCloseTo(0.009);
  });

  it("places 6 posts at the corners of the outline inset 60 mm, all on the top", () => {
    const plan = layout.legs.positions.map(([x, , z]) => [x, z].map((v) => +v.toFixed(4)));
    expect(plan).toEqual([
      [-0.74, -0.64],
      [0.74, -0.64],
      [0.74, 0.64],
      [0.26, 0.64],
      [0.26, -0.16],
      [-0.74, -0.16],
    ]);
    expect(layout.feet).toHaveLength(6);
  });

  it("runs the rear rail along the back and the outer rail along the wing", () => {
    const [rear, wing] = layout.rails;
    expect(rear!.size[0]).toBeCloseTo(1.48);
    expect(rear!.center[2]).toBeCloseTo(-0.64);
    expect(wing!.size[2]).toBeCloseTo(1.28);
    expect(wing!.size[0]).toBeCloseTo(0.016);
    expect(wing!.center[0]).toBeCloseTo(0.74);
  });

  it("mirrors posts and rails for orientation left", () => {
    const left = deskLayout(corner({ orientation: "left" }), EDGE);
    const xs = (l: DeskLayout) => l.legs.positions.map(([x]) => +x.toFixed(4)).sort();
    expect(xs(left)).toEqual(
      xs(layout)
        .map((x) => -x)
        .sort(),
    );
    expect(left.rails[1]!.center[0]).toBeCloseTo(-0.74);
  });
});

describe("deskVolumeOf (what the view frames)", () => {
  it("is the bounding box, with the outline corners at the floor and at the top", () => {
    const volume = deskVolumeOf(
      corner({ width: 1800, depth: 1600, armDepth: 700, wingWidth: 700 }),
    );
    expect(volume.box).toEqual({ min: [-0.9, 0, -0.8], max: [0.9, 0.74, 0.8] });
    expect(volume.points).toHaveLength(12);
    // The front corner opposite to the wing is not part of the desk.
    expect(volume.points.some(([x, , z]) => x === -0.9 && z === 0.8)).toBe(false);
  });
});
