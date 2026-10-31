/**
 * Constrained view of the desk (US-004, ADR-3D-07): limits, view poses, transitions and
 * keyboard steps as pure functions (no three.js), tested in Node. Scene units: metres,
 * Y up, Y = 0 floor, desk centred on the origin, user side = +Z.
 *
 * A pose is the orbit around a target, with the three.js / camera-controls spherical
 * convention: `polar` (phi) from +Y, `azimuth` (theta) = atan2(x, z) from +Z.
 */
import type { StudioConfig, Vec3, ViewName } from "../../core";
import { framingFor, REFERENCE_ZONES, type ScreenZone, type ViewFraming } from "./framing";
import { clamp, DEG2RAD, mmToM } from "./units";

export interface Pose {
  readonly target: Vec3;
  readonly radius: number;
  readonly polar: number;
  readonly azimuth: number;
}

/** Writable pose, for the `…Into(out)` variants used in the render loop (no allocation). */
export interface MutablePose {
  target: [number, number, number];
  radius: number;
  polar: number;
  azimuth: number;
}

/** A new writable pose (work object of the render loop). */
export function createPose(): MutablePose {
  return { target: [0, 0, 0], radius: 0, polar: 0, azimuth: 0 };
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
  /** Part of the studio the camera may occupy (in front of the curved wall, on the floor). */
  readonly keepIn: StudioKeepIn;
}

/**
 * What the view frames and avoids (US-006): the volume of the desk shown now, in metres,
 * origin on the floor. `points` span the desk (corners of its outline at the floor and at the
 * top): their convex hull is what must fit on screen, tighter than the box for an L-shaped desk.
 */
export interface DeskVolume {
  readonly box: Box;
  readonly points: readonly Vec3[];
}

/**
 * Studio space the camera may occupy (ADR-3D-11, risk R11): `minZ` keeps it in front of the
 * curved back wall and high enough above its rising floor, `maxZ` and `maxAbsX` on the
 * cyclorama floor. Derived from studio.json `cyclorama` with a clearance.
 */
export interface StudioKeepIn {
  readonly minZ: number;
  readonly maxZ: number;
  readonly maxAbsX: number;
}

/** Distance kept between the camera and the decor of the studio, metres. */
export const STUDIO_CLEARANCE_M = 0.3;
/** Room left beyond the farthest framing of the reference windows when zooming out. */
export const FIT_SPARE = 1.1;

// Framing of the views (whole view or free zone between the panels): ./framing.ts.
export { framingFor, lensShiftFor, type ScreenZone, type ViewFraming } from "./framing";

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

/** Corners of a box. */
export function boxCorners(box: Box): Vec3[] {
  const out: Vec3[] = [];
  for (const x of [box.min[0], box.max[0]]) {
    for (const y of [box.min[1], box.max[1]]) {
      for (const z of [box.min[2], box.max[2]]) out.push([x, y, z]);
    }
  }
  return out;
}

/** Volume of a box-shaped desk. */
export function boxVolume(box: Box): DeskVolume {
  return { box, points: boxCorners(box) };
}

/** Volume of the default desk of the studio (studio.json `desk`). */
export function deskVolume(config: StudioConfig): DeskVolume {
  return boxVolume(deskBox(config));
}

/** Studio space of the camera, from the cyclorama (see `StudioKeepIn`). */
export function studioKeepIn(config: StudioConfig): StudioKeepIn {
  const { cyclorama } = config;
  const c = STUDIO_CLEARANCE_M;
  const r = cyclorama.radius;
  const wallZ = cyclorama.curveStartZ - r;
  // The curved floor rises behind curveStartZ: the lowest camera (minCameraY) stays `c` above.
  const rise = config.camera.limits.minCameraY - c;
  let curveZ = wallZ;
  if (rise <= 0) curveZ = cyclorama.curveStartZ;
  else if (rise < r) curveZ = cyclorama.curveStartZ - Math.sqrt(r * r - (r - rise) * (r - rise));
  return {
    minZ: Math.max(wallZ + c, curveZ),
    maxZ: cyclorama.floorEndZ - c,
    maxAbsX: cyclorama.halfWidthX - c,
  };
}

/**
 * Largest distance from `target` along (polar, azimuth) that keeps the camera in the studio
 * space. Infinite when the direction never leaves it. Numbers only: used in the render loop.
 */
export function maxRadiusInStudio(
  targetX: number,
  targetZ: number,
  polar: number,
  azimuth: number,
  keepIn: StudioKeepIn,
): number {
  const s = Math.sin(polar);
  const dx = s * Math.sin(azimuth);
  const dz = s * Math.cos(azimuth);
  let radius = Infinity;
  if (dz < -EPSILON) radius = Math.min(radius, (targetZ - keepIn.minZ) / -dz);
  if (dz > EPSILON) radius = Math.min(radius, (keepIn.maxZ - targetZ) / dz);
  if (Math.abs(dx) > EPSILON) {
    radius = Math.min(radius, (keepIn.maxAbsX - Math.sign(dx) * targetX) / Math.abs(dx));
  }
  return Math.max(radius, 0);
}

/**
 * Zoom-out limit for a desk (ADR-3D-11): the catalog distance, or more for a large desk, so
 * that every view frames it in the reference windows (1024 px wide, both panels docked) with
 * `FIT_SPARE` to spare. The studio space still bounds the camera (`maxRadiusInStudio`).
 */
export function deskMaxDistance(config: StudioConfig, desk: DeskVolume): number {
  let needed = 0;
  for (const view of ["reset", "top", "front"] as const) {
    const { position, target } = config.camera.views[view];
    const pose = poseFromLookAt(position, target);
    for (const zone of REFERENCE_ZONES) {
      const fit = fitRadius(
        desk.points,
        pose.target,
        pose.polar,
        pose.azimuth,
        config.camera.fovDeg,
        zone.width / zone.height,
        framingFor(pose.polar, zone),
      );
      needed = Math.max(needed, fit);
    }
  }
  return Math.max(config.camera.limits.maxDistance, needed * FIT_SPARE);
}

/**
 * Limits of the view for the desk shown now (`desk`, the studio default desk when omitted):
 * zoom-out limit, target box and keep-out box follow the desk (US-006).
 */
export function cameraLimits(
  config: StudioConfig,
  desk: DeskVolume = deskVolume(config),
): CameraLimits {
  const { limits } = config.camera;
  const margin = mmToM(limits.deskKeepOutMm.margin);
  const content = desk.box;
  return {
    minDistance: limits.minDistance,
    maxDistance: deskMaxDistance(config, desk),
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
      min: [content.min[0] - margin, 0, content.min[2] - margin],
      max: [content.max[0] + margin, content.max[1] + margin, content.max[2] + margin],
    },
    keepIn: studioKeepIn(config),
  };
}

/** The same limits with another zoom-out limit (never below the zoom-in limit). */
export function withMaxDistance(limits: CameraLimits, maxDistance: number): CameraLimits {
  return { ...limits, maxDistance: Math.max(limits.minDistance, maxDistance) };
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

/** The closest pose that respects every limit (target box, distance, angles, height). */
export function clampPose(pose: Pose, limits: CameraLimits): Pose {
  return clampPoseInto(createPose(), pose, limits);
}

/** `clampPose` written into `out` (may be `pose` itself), without allocation. */
export function clampPoseInto(out: MutablePose, pose: Pose, limits: CameraLimits): MutablePose {
  const { pan } = limits;
  const tx = clamp(pose.target[0], pan.min[0], pan.max[0]);
  const ty = clamp(pose.target[1], pan.min[1], pan.max[1]);
  const tz = clamp(pose.target[2], pan.min[2], pan.max[2]);
  const azimuth = clamp(pose.azimuth, limits.minAzimuth, limits.maxAzimuth);
  // The studio limit is taken at the widest tilt allowed: the final tilt is never wider (it
  // only goes up to keep the minimum height), so the camera stays in the studio.
  const studio = maxRadiusInStudio(
    tx,
    tz,
    clamp(pose.polar, limits.minPolar, limits.maxPolar),
    azimuth,
    limits.keepIn,
  );
  const radius = clamp(
    pose.radius,
    limits.minDistance,
    Math.max(limits.minDistance, Math.min(limits.maxDistance, studio)),
  );
  const maxPolar = maxPolarForHeight(ty, radius, limits.minCameraY, limits.maxPolar);
  const polar = clamp(pose.polar, Math.min(limits.minPolar, maxPolar), maxPolar);
  out.target[0] = tx;
  out.target[1] = ty;
  out.target[2] = tz;
  out.radius = radius;
  out.polar = polar;
  out.azimuth = azimuth;
  return out;
}

export function isInside(point: Vec3, box: Box): boolean {
  return point.every((value, axis) => value > box.min[axis]! && value < box.max[axis]!);
}

/**
 * Last-resort guard applied to the rendered camera position (after damping): never under
 * `minCameraY`, never inside the desk keep-out box (pushed above it).
 */
export function clampCameraPosition(position: Vec3, limits: CameraLimits): Vec3 {
  return [position[0], safeCameraY(position[0], position[1], position[2], limits), position[2]];
}

/** Height given by `clampCameraPosition` (x and z never change), without allocation. */
export function safeCameraY(x: number, y: number, z: number, limits: CameraLimits): number {
  const lifted = Math.max(y, limits.minCameraY);
  const { min, max } = limits.keepOut;
  const inside =
    x > min[0] && x < max[0] && lifted > min[1] && lifted < max[1] && z > min[2] && z < max[2];
  return inside ? max[1] : lifted;
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Smallest distance from `target`, along the direction (polar, azimuth), at which the whole
 * box (or the convex hull of the points) is inside the framing rectangle of the screen, the
 * target being drawn at the framing centre (perspective camera, vertical FOV). A convex shape
 * fits when its corners do.
 */
export function fitRadius(
  content: Box | readonly Vec3[],
  target: Vec3,
  polar: number,
  azimuth: number,
  fovDeg: number,
  aspect: number,
  framing: ViewFraming = framingFor(polar),
): number {
  const { right, up, back } = screenAxes({ target, radius: 1, polar, azimuth });
  const tan = Math.tan((fovDeg * DEG2RAD) / 2);
  // Visible field on each side of the target, up to the edges of the framing rectangle.
  const tanUp = tan * (framing.top - framing.centerY);
  const tanDown = tan * (framing.centerY - framing.bottom);
  const tanRight = tan * aspect * (framing.right - framing.centerX);
  const tanLeft = tan * aspect * (framing.centerX - framing.left);
  let radius = 0;
  const points = "min" in content ? boxCorners(content) : content;
  for (const corner of points) {
    const rel: Vec3 = [corner[0] - target[0], corner[1] - target[1], corner[2] - target[2]];
    const lateral = dot(rel, right);
    const vertical = dot(rel, up);
    const needed = Math.max(
      lateral >= 0 ? lateral / tanRight : -lateral / tanLeft,
      vertical >= 0 ? vertical / tanUp : -vertical / tanDown,
    );
    radius = Math.max(radius, dot(rel, back) + needed);
  }
  return radius;
}

/**
 * Pose of a named view: the catalog pose, moved back if needed so that the whole desk is
 * framed with a margin at this aspect ratio (in the free `zone` between the panels when one
 * is measured, UX-8), then clamped to the limits.
 */
export function viewPose(
  config: StudioConfig,
  view: ViewName,
  aspect: number,
  limits: CameraLimits = cameraLimits(config),
  zone: ScreenZone | null = null,
  desk: DeskVolume = deskVolume(config),
): Pose {
  const { position, target } = config.camera.views[view];
  const pose = poseFromLookAt(position, target);
  const fit = fitRadius(
    desk.points,
    pose.target,
    pose.polar,
    pose.azimuth,
    config.camera.fovDeg,
    aspect,
    framingFor(pose.polar, zone),
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
  return interpolatePoseInto(createPose(), from, to, t);
}

/** `interpolatePose` written into `out`, without allocation. */
export function interpolatePoseInto(
  out: MutablePose,
  from: Pose,
  to: Pose,
  t: number,
): MutablePose {
  out.target[0] = lerp(from.target[0], to.target[0], t);
  out.target[1] = lerp(from.target[1], to.target[1], t);
  out.target[2] = lerp(from.target[2], to.target[2], t);
  out.radius = lerp(from.radius, to.radius, t);
  out.polar = lerp(from.polar, to.polar, t);
  out.azimuth = lerp(from.azimuth, to.azimuth, t);
  return out;
}

export function posesEqual(a: Pose, b: Pose, epsilon = EPSILON): boolean {
  return (
    Math.abs(a.radius - b.radius) <= epsilon &&
    Math.abs(a.polar - b.polar) <= epsilon &&
    Math.abs(a.azimuth - b.azimuth) <= epsilon &&
    a.target.every((value, axis) => Math.abs(value - b.target[axis]!) <= epsilon)
  );
}

/** One keyboard step, in scene units (see `stepFor` in render/scene/viewRig.ts). */
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
