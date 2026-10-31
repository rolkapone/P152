/**
 * Geometry of the procedural desks (ADR-3D-03) from their layout in metres: one geometry per
 * material slot, so a desk costs 2 draw calls (budgets of desk.json and desk-corner.json).
 * The L-shaped top is a single extrusion (one draw call, docs/design/3d/US-006-bureaux.md).
 */
import { CylinderGeometry, ExtrudeGeometry, Shape, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { BoxPart, DeskLayout, DeskTop, PlanPoint } from "../math/deskLayout";

/** Tessellation, within the catalog budgets (1500 triangles rect, 2500 corner). */
export const DESK_SEGMENTS = {
  topRound: 4,
  railRound: 1,
  legRadial: 24,
  outlineCurve: 4,
  outlineBevel: 3,
} as const;

function roundedBox(part: BoxPart, segments: number): BufferGeometry {
  const [w, h, d] = part.size;
  const radius = Math.min(part.radius, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const geometry = new RoundedBoxGeometry(w, h, d, segments, radius);
  geometry.translate(...part.center);
  return geometry;
}

/**
 * Plan outline with rounded corners as a three.js Shape. The shape is drawn in (x, -z): after
 * the extrusion is turned by -90 degrees around X, shape y becomes world -z.
 */
function roundedShape(outline: readonly PlanPoint[], radii: readonly number[]): Shape {
  const shape = new Shape();
  const n = outline.length;
  const toShape = ([x, z]: PlanPoint): [number, number] => [x, -z];
  for (let i = 0; i < n; i++) {
    const p = outline[i]!;
    const a = outline[(i - 1 + n) % n]!;
    const b = outline[(i + 1) % n]!;
    const r = radii[i]!;
    const towards = (q: PlanPoint): PlanPoint => {
      const length = Math.hypot(q[0] - p[0], q[1] - p[1]);
      return [p[0] + ((q[0] - p[0]) / length) * r, p[1] + ((q[1] - p[1]) / length) * r];
    };
    const [ax, ay] = toShape(towards(a));
    const [px, py] = toShape(p);
    const [bx, by] = toShape(towards(b));
    if (i === 0) shape.moveTo(ax, ay);
    else shape.lineTo(ax, ay);
    shape.quadraticCurveTo(px, py, bx, by);
  }
  shape.closePath();
  return shape;
}

function topGeometry(top: DeskTop): BufferGeometry {
  if (top.kind === "box") return roundedBox(top.part, DESK_SEGMENTS.topRound);
  const { bevel, thickness } = top;
  const geometry = new ExtrudeGeometry(roundedShape(top.outline, top.radii), {
    depth: thickness - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: DESK_SEGMENTS.outlineBevel,
    curveSegments: DESK_SEGMENTS.outlineCurve,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, top.bottom + bevel, 0);
  return geometry;
}

/** Geometries per material slot: `top`, `legs` (posts + rails). */
export function buildDeskGeometries(layout: DeskLayout): {
  top: BufferGeometry;
  legs: BufferGeometry;
} {
  const posts = layout.legs.positions.map((position) => {
    const post = new CylinderGeometry(
      layout.legs.radiusTop,
      layout.legs.radiusBottom,
      layout.legs.height,
      DESK_SEGMENTS.legRadial,
      1,
      true, // both ends are hidden (floor, under the top): no caps
    );
    post.translate(...position);
    return post;
  });
  const rails = layout.rails.map((part) => roundedBox(part, DESK_SEGMENTS.railRound));
  // RoundedBoxGeometry is not indexed, CylinderGeometry is: merge them all non-indexed.
  const sources = [...posts, ...rails];
  const parts = sources.map((part) => (part.index === null ? part : part.toNonIndexed()));
  const legs = mergeGeometries(parts, false);
  for (const part of new Set([...sources, ...parts])) part.dispose();
  if (legs === null) throw new Error("desk legs: incompatible geometries");
  return { top: topGeometry(layout.top), legs };
}
