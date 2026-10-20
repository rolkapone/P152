/**
 * Geometry of the procedural desk `desk.rect` (ADR-3D-03) from its layout in metres: one
 * geometry per material slot, so the desk costs 2 draw calls (budget of desk.json).
 */
import { CylinderGeometry, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { BoxPart, DeskLayout } from "../math/deskLayout";

/** Tessellation, within the budget of desk.json (1500 triangles). */
export const DESK_SEGMENTS = { topRound: 4, railRound: 1, legRadial: 24 } as const;

function roundedBox(part: BoxPart, segments: number): BufferGeometry {
  const [w, h, d] = part.size;
  const radius = Math.min(part.radius, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const geometry = new RoundedBoxGeometry(w, h, d, segments, radius);
  geometry.translate(...part.center);
  return geometry;
}

/** Geometries per material slot: `top`, `legs` (posts + rail). */
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
  const rail = roundedBox(layout.rail, DESK_SEGMENTS.railRound);
  // RoundedBoxGeometry is not indexed, CylinderGeometry is: merge them all non-indexed.
  const sources = [...posts, rail];
  const parts = sources.map((part) => (part.index === null ? part : part.toNonIndexed()));
  const legs = mergeGeometries(parts, false);
  for (const part of new Set([...sources, ...parts])) part.dispose();
  if (legs === null) throw new Error("desk legs: incompatible geometries");
  return { top: roundedBox(layout.top, DESK_SEGMENTS.topRound), legs };
}
