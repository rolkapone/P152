/**
 * Constrained view of the desk (US-004, ADR-3D-07): limits, view poses, transitions and
 * keyboard steps as pure functions (no three.js), tested in Node. Scene units: metres,
 * Y up, Y = 0 floor, desk centred on the origin, user side = +Z.
 *
 * A pose is the orbit around a target, with the three.js / camera-controls spherical
 * convention: `polar` (phi) from +Y, `azimuth` (theta) = atan2(x, z) from +Z.
 */
import type { StudioConfig, Vec3, ViewName } from "../../core";
import { clamp, DEG2RAD, mmToM } from "./units";

export interface Pose {
  readonly target: Vec3;
  readonly radius: number;
  readonly polar: number;
  readonly azimuth: number;
}

export interface Box {
  readonly min: Vec3;
  readonly max: Vec3;
}

export interface CameraLimits {
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly minPolar: number;
  readonly maxPolar: number;
  readonly minAzimuth: number;
  readonly maxAzimuth: number;
  /** The camera never goes below this height (never under the desk top). */
  readonly minCameraY: number;
  /**
   * Bounds of the orbit target: the catalog pan box intersected with the content (the desk).
   * The target, at the centre of the screen, is then always a point of the desk volume, so
   * moving the view never takes the desk completely out of the frame (UX-7).
   */
  readonly pan: Box;
  /** Desk volume inflated by the margin: the camera never enters it. */
  readonly keepOut: Box;
}

/**
 * How a view frames the desk on screen:
 * - `margin`: free space around the desk (1.05 = 5 % of the field on each side);
 * - `bottomInset`: fraction of the screen height kept free at the bottom for the floating
 *   view bar (UX-14: the bar never covers the desk in the default framing);
 * - `lensShift`: the orbit target is drawn above the centre of the screen, at this NDC
 *   height (0 = centre, 1 = top). Seen from the side, the target is on the desk top and the
 *   desk hangs below it: the shift centres the desk in the free area. Seen from above, the
 *   desk is around the target: the shift only clears the view bar. It follows the tilt
 *   (`lensShiftFor`) and is applied to the projection (`PerspectiveCamera.setViewOffset`),
 *   without changing the orbit itself.
 */
export interface ViewFraming {
  readonly margin: number;
  readonly bottomInset: number;
  readonly lensShift: number;
}

const FRAMING_MARGIN = 1.05;
const FRAMING_BOTTOM_INSET = 0.1;
const SIDE_LENS_SHIFT = 0.3;

/** Lens shift for a tilt: bottom inset when looking straight down, 0.3 from the side. */
export function lensShiftFor(polar: number): number {
  const side = Math.sin(clamp(polar, 0, Math.PI / 2));
  return FRAMING_BOTTOM_INSET + (SIDE_LENS_SHIFT - FRAMING_BOTTOM_INSET) * side;
}

export function framingFor(polar: number): ViewFraming {
  return {
    margin: FRAMING_MARGIN,
    bottomInset: FRAMING_BOTTOM_INSET,
    lensShift: lensShiftFor(polar),
  };
}
const EPSILON = 1e-6;

/** Intersection of two boxes; on an axis where they do not overlap, `outer` is kept. */
export function intersectBoxes(outer: Box, inner: Box): Box {
  const min: number[] = [];
  const max: number[] = [];
  for (let axis = 0; axis < 3; axis++) {
    const low = Math.max(outer.min[axis]!, inner.min[axis]!);
    const high = Math.min(outer.max[axis]!, inner.max[axis]!);
    const overlap = low <= high;
    min.push(overlap ? low : outer.min[axis]!);
    max.push(overlap ? high : outer.max[axis]!);
  }
  return { min: [min[0]!, min[1]!, min[2]!], max: [max[0]!, max[1]!, max[2]!] };
}

/**
 * Limits of the view. `content` is the box that must stay in view (the desk in US-004;
 * later stories may pass the bounds of the whole setup).
 */
export function cameraLimits(config: StudioConfig, content: Box = deskBox(config)): CameraLimits {
  const { limits } = config.camera;
  const keep = limits.deskKeepOutMm;
  const halfWidth = mmToM(keep.halfWidth + keep.margin);
  const halfDepth = mmToM(keep.halfDepth + keep.margin);
  return {
    minDistance: limits.minDistance,
    maxDistance: limits.maxDistance,
    minPolar: limits.minPolarDeg * DEG2RAD,
    maxPolar: limits.maxPolarDeg * DEG2RAD,
    minAzimuth: limits.minAzimuthDeg * DEG2RAD,
    maxAzimuth: limits.maxAzimuthDeg * DEG2RAD,
    minCameraY: limits.minCameraY,
    pan: intersectBoxes(
      {
        min: [limits.pan.x[0], limits.pan.y[0], limits.pan.z[0]],
        max: [limits.pan.x[1], limits.pan.y[1], limits.pan.z[1]],
      },
      content,
    ),
    keepOut: {
      min: [-halfWidth, 0, -halfDepth],
      max: [halfWidth, mmToM(keep.height + keep.margin), halfDepth],
    },
  };
}

/** Bounding box of the default desk of the studio, in metres (origin on the floor). */
export function deskBox(config: StudioConfig): Box {
  const w = mmToM(config.desk.widthMm) / 2;
  const d = mmToM(config.desk.depthMm) / 2;
  return { min: [-w, 0, -d], max: [w, mmToM(config.desk.heightMm), d] };
}

export function poseFromLookAt(position: Vec3, target: Vec3): Pose {
  const x = position[0] - target[0];
  const y = position[1] - target[1];
  const z = position[2] - target[2];
  const radius = Math.hypot(x, y, z);
  return {
    target,
    radius,
    polar: radius === 0 ? 0 : Math.acos(clamp(y / radius, -1, 1)),
    azimuth: Math.atan2(x, z),
  };
}

/** Unit vector from the target towards the camera. */
function direction(polar: number, azimuth: number): Vec3 {
  const s = Math.sin(polar);
  return [s * Math.sin(azimuth), Math.cos(polar), s * Math.cos(azimuth)];
}

export function positionOf(pose: Pose): Vec3 {
  const [dx, dy, dz] = direction(pose.polar, pose.azimuth);
  const [tx, ty, tz] = pose.target;
  return [tx + pose.radius * dx, ty + pose.radius * dy, tz + pose.radius * dz];
}

/**
 * Screen axes of the camera in world space. Defined from the azimuth (not from world up),
 * so they stay stable when looking straight down: in the top view, screen up is -Z (the
 * back edge of the desk is at the top of the screen).
 */
export function screenAxes(pose: Pose): { right: Vec3; up: Vec3; back: Vec3 } {
  const back = direction(pose.polar, pose.azimuth);
  const right: Vec3 = [Math.cos(pose.azimuth), 0, -Math.sin(pose.azimuth)];
  const up: Vec3 = [
    back[1] * right[2] - back[2] * right[1],
    back[2] * right[0] - back[0] * right[2],
    back[0] * right[1] - back[1] * right[0],
  ];
  return { right, up, back };
}

/** Largest polar angle that keeps the camera at or above `minY` for this target and distance. */
export function maxPolarForHeight(
  targetY: number,
  radius: number,
  minY: number,
  maxPolar: number,
): number {
  if (radius <= 0) return maxPolar;
  // camera y = targetY + radius * cos(polar) >= minY
  const cos = (minY - targetY) / radius;
  if (cos <= -1) return maxPolar;
  if (cos >= 1) return 0;
  return Math.min(maxPolar, Math.acos(cos));
}

const clampVec = (v: Vec3, box: Box): Vec3 => [
  clamp(v[0], box.min[0], box.max[0]),
  clamp(v[1], box.min[1], box.max[1]),
  clamp(v[2], box.min[2], box.max[2]),
];

/** The closest pose that respects every limit (target box, distance, angles, height). */
export function clampPose(pose: Pose, limits: CameraLimits): Pose {
  const target = clampVec(pose.target, limits.pan);
  const radius = clamp(pose.radius, limits.minDistance, limits.maxDistance);
  const azimuth = clamp(pose.azimuth, limits.minAzimuth, limits.maxAzimuth);
  const maxPolar = maxPolarForHeight(target[1], radius, limits.minCameraY, limits.maxPolar);
  const polar = clamp(pose.polar, Math.min(limits.minPolar, maxPolar), maxPolar);
  return { target, radius, polar, azimuth };
}

export function isInside(point: Vec3, box: Box): boolean {
  return point.every((value, axis) => value > box.min[axis]! && value < box.max[axis]!);
}

/**
 * Last-resort guard applied to the rendered camera position (after damping): never under
 * `minCameraY`, never inside the desk keep-out box (pushed above it).
 */
export function clampCameraPosition(position: Vec3, limits: CameraLimits): Vec3 {
  let y = Math.max(position[1], limits.minCameraY);
  const lifted: Vec3 = [position[0], y, position[2]];
  if (isInside(lifted, limits.keepOut)) y = limits.keepOut.max[1];
  return [position[0], y, position[2]];
}

function corners(box: Box): Vec3[] {
  const out: Vec3[] = [];
  for (const x of [box.min[0], box.max[0]]) {
    for (const y of [box.min[1], box.max[1]]) {
      for (const z of [box.min[2], box.max[2]]) out.push([x, y, z]);
    }
  }
  return out;
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Smallest distance from `target`, along the direction (polar, azimuth), at which the whole
 * box is inside the free area of the screen described by `framing` (perspective camera,
 * vertical FOV).
 */
export function fitRadius(
  box: Box,
  target: Vec3,
  polar: number,
  azimuth: number,
  fovDeg: number,
  aspect: number,
  framing: ViewFraming = framingFor(polar),
): number {
  const { right, up, back } = screenAxes({ target, radius: 1, polar, azimuth });
  const tan = Math.tan((fovDeg * DEG2RAD) / 2) / framing.margin;
  // Visible field above and below the target (lens shift), minus the view bar at the bottom.
  const tanUp = tan * (1 - framing.lensShift);
  const tanDown = tan * (1 + framing.lensShift - 2 * framing.bottomInset);
  const tanX = tan * aspect;
  let radius = 0;
  for (const corner of corners(box)) {
    const rel: Vec3 = [corner[0] - target[0], corner[1] - target[1], corner[2] - target[2]];
    const vertical = dot(rel, up);
    const lateral = Math.max(
      Math.abs(dot(rel, right)) / tanX,
      vertical >= 0 ? vertical / tanUp : -vertical / tanDown,
    );
    radius = Math.max(radius, dot(rel, back) + lateral);
  }
  return radius;
}

/**
 * Pose of a named view: the catalog pose, moved back if needed so that the whole desk is
 * framed with a margin at this aspect ratio, then clamped to the limits.
 */
export function viewPose(
  config: StudioConfig,
  view: ViewName,
  aspect: number,
  limits: CameraLimits = cameraLimits(config),
): Pose {
  const { position, target } = config.camera.views[view];
  const pose = poseFromLookAt(position, target);
  const fit = fitRadius(
    deskBox(config),
    pose.target,
    pose.polar,
    pose.azimuth,
    config.camera.fovDeg,
    aspect,
  );
  return clampPose({ ...pose, radius: Math.max(pose.radius, fit) }, limits);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Pose at `t` in [0, 1] between two poses: the camera glides on an arc around a moving
 * target. Angles are interpolated without wrapping: both ends are inside the azimuth limits
 * (an interval narrower than a turn), so the whole path stays inside them too.
 */
export function interpolatePose(from: Pose, to: Pose, t: number): Pose {
  return {
    target: [
      lerp(from.target[0], to.target[0], t),
      lerp(from.target[1], to.target[1], t),
      lerp(from.target[2], to.target[2], t),
    ],
    radius: lerp(from.radius, to.radius, t),
    polar: lerp(from.polar, to.polar, t),
    azimuth: lerp(from.azimuth, to.azimuth, t),
  };
}

export function posesEqual(a: Pose, b: Pose, epsilon = EPSILON): boolean {
  return (
    Math.abs(a.radius - b.radius) <= epsilon &&
    Math.abs(a.polar - b.polar) <= epsilon &&
    Math.abs(a.azimuth - b.azimuth) <= epsilon &&
    a.target.every((value, axis) => Math.abs(value - b.target[axis]!) <= epsilon)
  );
}

/** One keyboard step, in scene units (see `stepFor` in render/scene/viewCommands.ts). */
export type ViewStep =
  | { readonly kind: "turn"; readonly azimuth: number; readonly polar: number }
  | { readonly kind: "zoom"; readonly factor: number }
  | { readonly kind: "move"; readonly right: number; readonly up: number };

/** Applies a step then the limits; `limitReached` when a limit cut the step. */
export function stepPose(
  pose: Pose,
  step: ViewStep,
  limits: CameraLimits,
): { pose: Pose; limitReached: boolean } {
  let wanted: Pose;
  switch (step.kind) {
    case "turn":
      wanted = { ...pose, azimuth: pose.azimuth + step.azimuth, polar: pose.polar + step.polar };
      break;
    case "zoom":
      wanted = { ...pose, radius: pose.radius * step.factor };
      break;
    case "move": {
      const { right, up } = screenAxes(pose);
      const [x, y, z] = pose.target;
      wanted = {
        ...pose,
        target: [
          x + right[0] * step.right + up[0] * step.up,
          y + right[1] * step.right + up[1] * step.up,
          z + right[2] * step.right + up[2] * step.up,
        ],
      };
      break;
    }
  }
  const clamped = clampPose(wanted, limits);
  // Only the quantity the step changes counts: zooming in may also lower the allowed tilt
  // (minimum height), which is not a "zoom limit".
  const cut = (a: number, b: number) => Math.abs(a - b) > 1e-9;
  const limitReached =
    step.kind === "zoom"
      ? cut(clamped.radius, wanted.radius)
      : step.kind === "turn"
        ? cut(clamped.azimuth, wanted.azimuth) || cut(clamped.polar, wanted.polar)
        : clamped.target.some((value, axis) => cut(value, wanted.target[axis]!));
  return { pose: clamped, limitReached };
}
