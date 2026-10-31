/**
 * Real footprint of a desk top (US-006, ADR-3D-06), millimetres, in the desk frame (origin at
 * the centre of the bounding box, +x to the user's right, +z towards the user). A rectangle
 * for `desk.rect`; for `desk.corner` the union of two rectangles, the main arm along the back
 * edge and the return wing on the orientation side: the inner corner of the L is not desk.
 * The "does it fit?" rules (US-014 to US-016) use this, never the bounding box.
 */
import type { DeskSpec } from "../catalog/desk";

export interface RectMm {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

export type PointMm = readonly [x: number, z: number];

/** Bounding box of the top (width x depth, centred). */
export function deskBounds(desk: DeskSpec): RectMm {
  const hx = desk.widthMm / 2;
  const hz = desk.depthMm / 2;
  return { minX: -hx, maxX: hx, minZ: -hz, maxZ: hz };
}

/** Rectangles whose union is the top, without overlap: [desk] or [main arm, return wing]. */
export function deskFootprint(desk: DeskSpec): readonly RectMm[] {
  const bounds = deskBounds(desk);
  if (desk.shape === "rect") return [bounds];
  const { minX, maxX, minZ, maxZ } = bounds;
  const armEnd = minZ + desk.armDepthMm;
  const wing =
    desk.orientation === "right"
      ? { minX: maxX - desk.wingWidthMm, maxX }
      : { minX, maxX: minX + desk.wingWidthMm };
  return [
    { minX, maxX, minZ, maxZ: armEnd },
    { ...wing, minZ: armEnd, maxZ },
  ];
}

/**
 * Outline of the top, counter-clockwise in (x, z) (positive shoelace area). Rectangle: 4
 * corners from the back left. L, orientation right: back left, back right, front right, front
 * of the wing inner edge, inner corner of the L, front of the arm left; left is the mirror.
 */
export function deskOutline(desk: DeskSpec): readonly PointMm[] {
  const { minX: x0, maxX: x1, minZ: z0, maxZ: z1 } = deskBounds(desk);
  if (desk.shape === "rect") {
    return [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
    ];
  }
  const right: PointMm[] = [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x1 - desk.wingWidthMm, z1],
    [x1 - desk.wingWidthMm, z0 + desk.armDepthMm],
    [x0, z0 + desk.armDepthMm],
  ];
  if (desk.orientation === "right") return right;
  // Mirror in x reverses the winding: read the mirrored points backwards from the same corner.
  const mirrored = right.map(([x, z]): PointMm => [-x, z]);
  return [mirrored[1]!, mirrored[0]!, ...mirrored.slice(2).reverse()];
}

/** Signed area of a polygon (shoelace), positive when counter-clockwise in (x, z). */
export function polygonArea(points: readonly PointMm[]): number {
  let twice = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i]!;
    const [x2, z2] = points[(i + 1) % points.length]!;
    twice += x1 * z2 - x2 * z1;
  }
  return twice / 2;
}

/** Area of the top, mm². */
export function deskArea(desk: DeskSpec): number {
  return deskFootprint(desk).reduce(
    (sum, rect) => sum + (rect.maxX - rect.minX) * (rect.maxZ - rect.minZ),
    0,
  );
}

/** True when the point is on the top (edges included). */
export function isOnDesk(desk: DeskSpec, x: number, z: number): boolean {
  return deskFootprint(desk).some(
    (rect) => x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ,
  );
}
