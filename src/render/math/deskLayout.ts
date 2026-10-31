/**
 * Layout of the procedural desks (ADR-3D-03, US-004 and US-006), in metres, from a desk of the
 * catalog in millimetres (`DeskSpec`, core). Pure: the geometry is built from this in
 * render/scene/deskGeometry.ts. Proportions follow docs/design/3d/US-004-scene.md and
 * US-006-bureaux.md: posts r 22 -> 18 mm inset 60 mm from the outline, rails 70 x 16 mm,
 * 45 mm under the top.
 * - `desk.rect`: rounded box top, 4 posts, rear rail.
 * - `desk.corner`: L-shaped top extruded from the outline (corners rounded 25 mm in plan,
 *   12 mm at the inner corner, 9 mm edge bevel), 6 posts at the corners of the outline inset
 *   60 mm, rear rail and outer rail of the wing.
 */
import { deskOutline, type DeskSpec, type Vec3 } from "../../core";
import type { DeskVolume } from "./camera";
import { mmToM } from "./units";

export interface BoxPart {
  readonly size: Vec3;
  readonly center: Vec3;
  readonly radius: number;
}

/** Point of the plan, metres: (x, z). */
export type PlanPoint = readonly [x: number, z: number];

export type DeskTop =
  | { readonly kind: "box"; readonly part: BoxPart }
  | {
      readonly kind: "outline";
      /** Outline of the top in plan (counter-clockwise in (x, z)). */
      readonly outline: readonly PlanPoint[];
      /** Corner radius in plan at each outline point. */
      readonly radii: readonly number[];
      /** Height of the underside of the top. */
      readonly bottom: number;
      readonly thickness: number;
      /** Rounding of the top and bottom edges. */
      readonly bevel: number;
    };

export interface DeskLayout {
  readonly top: DeskTop;
  readonly legs: {
    readonly positions: readonly Vec3[];
    readonly height: number;
    readonly radiusTop: number;
    readonly radiusBottom: number;
  };
  readonly rails: readonly BoxPart[];
  /** Floor footprints of the parts touching the floor (contact shadows), centre + size. */
  readonly feet: readonly { readonly center: Vec3; readonly size: readonly [number, number] }[];
}

/** Generator proportions (mm), shared by every size of the catalog range. */
export const DESK_STYLE_MM = {
  legInset: 60,
  legRadiusTop: 22,
  legRadiusBottom: 18,
  railHeight: 70,
  railThickness: 16,
  railDrop: 45,
  railRadius: 6,
  footShadow: 70,
  cornerRadius: 25,
  innerCornerRadius: 12,
} as const;

/** Is the outline point `i` a reflex (inner) corner? The outline is counter-clockwise. */
function isInnerCorner(outline: readonly PlanPoint[], i: number): boolean {
  const n = outline.length;
  const [ax, az] = outline[(i - 1 + n) % n]!;
  const [px, pz] = outline[i]!;
  const [bx, bz] = outline[(i + 1) % n]!;
  return (px - ax) * (bz - pz) - (pz - az) * (bx - px) < 0;
}

/** Outline inset by `d` (metres) towards the inside, for an axis-aligned polygon. */
function insetOutline(outline: readonly PlanPoint[], d: number): PlanPoint[] {
  const n = outline.length;
  return outline.map((point, i) => {
    const [ax, az] = outline[(i - 1 + n) % n]!;
    const [px, pz] = point;
    const [bx, bz] = outline[(i + 1) % n]!;
    // Inward normal of an edge of a counter-clockwise polygon in (x, z): (-dz, dx).
    const inward = (x1: number, z1: number, x2: number, z2: number): PlanPoint => {
      const length = Math.hypot(x2 - x1, z2 - z1);
      return [-(z2 - z1) / length, (x2 - x1) / length];
    };
    const n1 = inward(ax, az, px, pz);
    const n2 = inward(px, pz, bx, bz);
    // Axis-aligned corner: the two normals are orthogonal, the offsets simply add.
    return [px + d * (n1[0] + n2[0]), pz + d * (n1[1] + n2[1])];
  });
}

/** Rail between two post axes (along X or Z), 45 mm under the top. */
function rail(a: PlanPoint, b: PlanPoint, y: number): BoxPart {
  const s = DESK_STYLE_MM;
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const alongX = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]);
  const thickness = mmToM(s.railThickness);
  const height = mmToM(s.railHeight);
  return {
    size: alongX ? [length, height, thickness] : [thickness, height, length],
    center: [(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2],
    radius: mmToM(s.railRadius),
  };
}

export function deskLayout(desk: DeskSpec, edgeRadiusMm: number): DeskLayout {
  const s = DESK_STYLE_MM;
  const width = mmToM(desk.widthMm);
  const depth = mmToM(desk.depthMm);
  const height = mmToM(desk.heightMm);
  const thickness = mmToM(desk.thicknessMm);
  const edge = Math.min(mmToM(edgeRadiusMm), thickness / 2 - 1e-4);
  const legHeight = height - thickness;
  const railY = height - thickness - mmToM(s.railDrop);
  const outline = deskOutline(desk).map(([x, z]): PlanPoint => [mmToM(x), mmToM(z)]);
  const posts = insetOutline(outline, mmToM(s.legInset));

  let top: DeskTop;
  let rails: BoxPart[];
  if (desk.shape === "rect") {
    top = {
      kind: "box",
      part: {
        size: [width, thickness, depth],
        center: [0, height - thickness / 2, 0],
        radius: edge,
      },
    };
    // Back left -> back right (outline order).
    rails = [rail(posts[0]!, posts[1]!, railY)];
  } else {
    top = {
      kind: "outline",
      outline,
      radii: outline.map((_, i) =>
        mmToM(isInnerCorner(outline, i) ? s.innerCornerRadius : s.cornerRadius),
      ),
      bottom: height - thickness,
      thickness,
      bevel: edge,
    };
    // Rear rail along the back edge, outer rail along the wing (the side of the full depth).
    const back = posts.findIndex(([, z]) => z === Math.min(...posts.map((p) => p[1])));
    const backEdge: [PlanPoint, PlanPoint] = [posts[back]!, posts[(back + 1) % posts.length]!];
    const wingX =
      desk.orientation === "right"
        ? Math.max(...posts.map((p) => p[0]))
        : Math.min(...posts.map((p) => p[0]));
    const wingPosts = posts.filter(([x]) => Math.abs(x - wingX) < 1e-9);
    rails = [rail(backEdge[0], backEdge[1], railY), rail(wingPosts[0]!, wingPosts[1]!, railY)];
  }
  const foot = mmToM(s.footShadow);
  const positions = posts.map(([x, z]): Vec3 => [x, legHeight / 2, z]);
  return {
    top,
    legs: {
      positions,
      height: legHeight,
      radiusTop: mmToM(s.legRadiusTop),
      radiusBottom: mmToM(s.legRadiusBottom),
    },
    rails,
    feet: positions.map(([x, , z]) => ({ center: [x, 0, z] as Vec3, size: [foot, foot] as const })),
  };
}

/** Volume of a desk for the view (framing, keep-out, zoom limit), metres, origin on the floor. */
export function deskVolumeOf(desk: DeskSpec): DeskVolume {
  const outline = deskOutline(desk);
  const height = mmToM(desk.heightMm);
  const hx = mmToM(desk.widthMm) / 2;
  const hz = mmToM(desk.depthMm) / 2;
  return {
    box: { min: [-hx, 0, -hz], max: [hx, height, hz] },
    points: outline.flatMap(([x, z]): Vec3[] => [
      [mmToM(x), 0, mmToM(z)],
      [mmToM(x), height, mmToM(z)],
    ]),
  };
}
