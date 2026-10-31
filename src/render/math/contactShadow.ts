/**
 * Soft contact shadow texture (docs/design/3d/US-004-scene.md): a rounded-rectangle alpha
 * gradient, generated once in code and shared by every contact plane. The gradient core
 * covers `CONTACT_CORE` of the plane, so a plane is 1 / CONTACT_CORE larger than the
 * footprint it darkens. Pure (RGBA bytes), tested in Node.
 */
import type { DeskSpec } from "../../core";
import { mmToM } from "./units";

export const CONTACT_CORE = 0.62;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** RGBA bytes (black, alpha = shadow) of a `size` x `size` texture. */
export function contactShadowPixels(size = 128): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  const r = 0.18;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const px = Math.abs(((i + 0.5) / size) * 2 - 1) - CONTACT_CORE;
      const py = Math.abs(((j + 0.5) / size) * 2 - 1) - CONTACT_CORE;
      const qx = px + r;
      const qy = py + r;
      const distance =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      const alpha = Math.pow(1 - smoothstep(-0.08, 0.38, distance), 1.6);
      data[(j * size + i) * 4 + 3] = Math.round(255 * alpha);
    }
  }
  return data;
}

/** A contact plane on the floor, metres: centre and size of the footprint it darkens. */
export interface ContactFootprint {
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly depth: number;
}

/** Overlap of the wing plane over the arm plane, so that the L shadow has no light seam. */
const WING_OVERLAP_M = 0.04;

/**
 * Contact footprints of the desk top (US-006, PO decision 31), derived from the desk shown:
 * its footprint minus `insetMm` (width, depth), so that the soft shadow stays under the top.
 * L-shaped desk: the main arm, and the return wing overlapping it slightly (same planes as the
 * validated preview, docs/design/3d/US-006-bureaux.md section 4).
 */
export function deskContactFootprints(
  desk: DeskSpec,
  insetMm: readonly [number, number],
): ContactFootprint[] {
  const [ix, iz] = [mmToM(insetMm[0]), mmToM(insetMm[1])];
  const width = mmToM(desk.widthMm);
  const depth = mmToM(desk.depthMm);
  const positive = (value: number) => Math.max(value, 0.01);
  if (desk.shape === "rect") {
    return [{ x: 0, z: 0, width: positive(width - ix), depth: positive(depth - iz) }];
  }
  const hx = width / 2;
  const hz = depth / 2;
  const arm = mmToM(desk.armDepthMm);
  const wing = mmToM(desk.wingWidthMm);
  const side = desk.orientation === "left" ? -1 : 1;
  const z0 = -hz + arm - WING_OVERLAP_M;
  const z1 = hz - iz / 2;
  return [
    { x: 0, z: -hz + arm / 2, width: positive(width - ix), depth: positive(arm - iz) },
    {
      x: side * (hx - wing / 2),
      z: (z0 + z1) / 2,
      width: positive(wing - ix),
      depth: positive(z1 - z0),
    },
  ];
}
