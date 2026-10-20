/**
 * Layout of the procedural rectangular desk `desk.rect` (ADR-3D-03), in metres, from the
 * catalog parameters in millimetres. Pure: the geometry is built from this in
 * render/scene/Desk.tsx. Proportions follow docs/design/3d/US-004-scene.md (4 posts
 * r 22 -> 18 mm inset 60 mm from the edges, rear rail 70 x 16 mm, 45 mm under the top).
 */
import type { Vec3 } from "../../core";
import { mmToM } from "./units";

export interface DeskParamsMm {
  readonly widthMm: number;
  readonly depthMm: number;
  readonly heightMm: number;
  readonly thicknessMm: number;
  readonly edgeRadiusMm: number;
}

export interface BoxPart {
  readonly size: Vec3;
  readonly center: Vec3;
  readonly radius: number;
}

export interface DeskLayout {
  readonly top: BoxPart;
  readonly legs: {
    readonly positions: readonly Vec3[];
    readonly height: number;
    readonly radiusTop: number;
    readonly radiusBottom: number;
  };
  readonly rail: BoxPart;
  /** Floor footprints of the parts touching the floor (contact shadows), centre + size. */
  readonly feet: readonly { readonly center: Vec3; readonly size: readonly [number, number] }[];
}

/** Generator proportions (mm), shared by every width/depth of the catalog range. */
export const DESK_STYLE_MM = {
  legInset: 60,
  legRadiusTop: 22,
  legRadiusBottom: 18,
  railHeight: 70,
  railThickness: 16,
  railDrop: 45,
  railRadius: 6,
  footShadow: 70,
} as const;

export function deskLayout(params: DeskParamsMm): DeskLayout {
  const s = DESK_STYLE_MM;
  const width = mmToM(params.widthMm);
  const depth = mmToM(params.depthMm);
  const height = mmToM(params.heightMm);
  const thickness = mmToM(params.thicknessMm);
  const legX = width / 2 - mmToM(s.legInset);
  const legZ = depth / 2 - mmToM(s.legInset);
  const legHeight = height - thickness;
  const positions: Vec3[] = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) positions.push([sx * legX, legHeight / 2, sz * legZ]);
  }
  const foot = mmToM(s.footShadow);
  return {
    top: {
      size: [width, thickness, depth],
      center: [0, height - thickness / 2, 0],
      radius: Math.min(mmToM(params.edgeRadiusMm), thickness / 2 - 1e-4),
    },
    legs: {
      positions,
      height: legHeight,
      radiusTop: mmToM(s.legRadiusTop),
      radiusBottom: mmToM(s.legRadiusBottom),
    },
    rail: {
      size: [2 * legX, mmToM(s.railHeight), mmToM(s.railThickness)],
      center: [0, height - thickness - mmToM(s.railDrop), -legZ],
      radius: mmToM(s.railRadius),
    },
    feet: positions.map(([x, , z]) => ({ center: [x, 0, z] as Vec3, size: [foot, foot] as const })),
  };
}
