/**
 * Constrained view controls (US-004, ADR-3D-07) on top of camera-controls, as a plain class
 * (three.js objects are mutated here, not in React components):
 * - left drag on the empty scene turns the view, wheel zooms, right drag moves the view
 *   (Pointer Events, no browser context menu); touch gestures are prepared (US-021);
 * - limits from studio.json (render/math/camera.ts): distance, angles, target box, never
 *   below `minCameraY` nor inside the desk;
 * - Reset / Top / Front: 480 ms `in-out` transitions along an arc, interrupted by any user
 *   action, instant under `prefers-reduced-motion` (which also removes the inertia);
 * - keyboard steps arrive through the state store (`ViewController`);
 * - framing in the free zone between the panels (US-005 UX-8): read when a view is framed
 *   (start, Reset / Top / Front, change of desk), never followed live, so that collapsing or
 *   opening a panel never moves the camera (UX-7). The lens shift keeps the zone of the last
 *   framing and glides to the new one with the view transition;
 * - change of desk (US-006, `setDesk`): limits, keep-out and zoom-out limit follow the new
 *   desk; the view keeps its orientation and reframes the whole desk in the free zone, with
 *   the same 480 ms transition (instant under reduced motion).
 */
import CameraControlsImpl from "camera-controls";
import {
  Box3,
  Matrix4,
  Quaternion,
  Raycaster,
  Sphere,
  Spherical,
  Vector2,
  Vector3,
  Vector4,
  type PerspectiveCamera,
} from "three";
import { sameDesk, studioDeskSpec, type DeskSpec, type StudioConfig } from "../../core";
import {
  VIEW_STEPS,
  type ViewCommand,
  type ViewCommandResult,
  type ViewController,
} from "../../state";
import {
  cameraLimits,
  clampPose,
  clampPoseInto,
  createPose,
  interpolatePoseInto,
  maxPolarForHeight,
  maxRadiusInStudio,
  reframePose,
  safeCameraY,
  stepPose,
  viewPose,
  withMaxDistance,
  type CameraLimits,
  type DeskVolume,
  type Pose,
  type ViewStep,
} from "../math/camera";
import {
  blendLensInto,
  copyLensInto,
  createLens,
  isUsableZone,
  lensInto,
  lensY,
  type ScreenZone,
} from "../math/framing";
import { deskVolumeOf } from "../math/deskLayout";
import { EASE_IN_OUT } from "../math/easing";
import { DEG2RAD, mmToM } from "../math/units";

CameraControlsImpl.install({
  THREE: { Box3, Matrix4, Quaternion, Raycaster, Sphere, Spherical, Vector2, Vector3, Vector4 },
});

const { ACTION } = CameraControlsImpl;

/** Inertia after release: the view settles in less than 200 ms (UX §4). */
export const SMOOTH_TIME_S = 0.08;
const DRAG_SMOOTH_TIME_S = 0.035;
/** Longest frame step given to the damping after an idle period (frameloop "demand"). */
const MAX_DELTA_S = 1 / 30;

/** Keyboard step in scene units (docs/design/ux/stories/US-004.md §5). */
export function stepFor(
  command: Exclude<ViewCommand, { type: "view" }>,
  deskWidthM: number,
): ViewStep {
  const sign = (positive: boolean) => (positive ? 1 : -1);
  const horizontal =
    command.type !== "zoom" && (command.direction === "left" || command.direction === "right");
  switch (command.type) {
    case "turn":
      // Left / right: like a drag towards the same side. Up: look from higher.
      return horizontal
        ? {
            kind: "turn",
            azimuth: sign(command.direction === "left") * VIEW_STEPS.turnDeg * DEG2RAD,
            polar: 0,
          }
        : {
            kind: "turn",
            azimuth: 0,
            polar: sign(command.direction === "down") * VIEW_STEPS.tiltDeg * DEG2RAD,
          };
    case "zoom":
      return {
        kind: "zoom",
        factor:
          command.direction === "in" ? 1 - VIEW_STEPS.zoomRatio : 1 / (1 - VIEW_STEPS.zoomRatio),
      };
    case "move": {
      const distance = VIEW_STEPS.moveDeskWidthRatio * deskWidthM;
      return horizontal
        ? { kind: "move", right: sign(command.direction === "right") * distance, up: 0 }
        : { kind: "move", right: 0, up: sign(command.direction === "up") * distance };
    }
  }
}

interface Tween {
  readonly from: Pose;
  readonly to: Pose;
  readonly start: number;
  readonly duration: number;
}

export interface ViewRigOptions {
  readonly camera: PerspectiveCamera;
  readonly element: HTMLElement;
  readonly config: StudioConfig;
  readonly reducedMotion: boolean;
  /** Requests a frame (frameloop "demand"). */
  readonly invalidate: () => void;
  /** A drag or a wheel zoom changed the view. */
  readonly onPointerViewChange: () => void;
  readonly now?: () => number;
  /** Free zone of the view between the panels (CSS px), read when a view is framed (UX-8). */
  readonly freeZone?: () => ScreenZone | null;
  /** Desk shown at the start (default: the studio desk). */
  readonly desk?: DeskSpec;
}

type FramedView = "reset" | "top" | "front";

export class ViewRig implements ViewController {
  readonly controls: CameraControlsImpl;
  /** Limits of the desk shown now (zoom-out limit of the desk, ADR-3D-11). */
  private deskLimits: CameraLimits;
  /** The same, the zoom-out limit raised to the last framing so that it is never cut. */
  private currentLimits: CameraLimits;
  private desk: DeskVolume;
  private deskSpec: DeskSpec;
  /** View whose target and distance a change of desk starts from (Reset once moved). */
  private baseView: FramedView = "reset";
  private readonly camera: PerspectiveCamera;
  private readonly element: HTMLElement;
  private readonly config: StudioConfig;
  private readonly invalidate: () => void;
  private readonly onPointerViewChange: () => void;
  private readonly now: () => number;
  private readonly freeZone: () => ScreenZone | null;
  /** Zone of the last framing (copy), or null: whole view. */
  private zone: ScreenZone | null = null;
  /** Lens shift drawn now, and the two ends of the one of a view transition. */
  private readonly lens = createLens();
  private readonly lensFrom = createLens();
  private readonly lensTo = createLens();
  /** The view was turned, moved or zoomed, or a view command ran, since the start. */
  private touched = false;
  private deskWidth: number;
  private reducedMotion = false;
  private tween: Tween | null = null;
  private readonly target = new Vector3();
  private readonly spherical = new Spherical();
  /** Work objects of `frame()` and `applyPose()`: nothing is allocated per frame. */
  private readonly framePose = createPose();
  private readonly safePose = createPose();
  private readonly listeners: [string, () => void][];

  constructor(options: ViewRigOptions) {
    this.camera = options.camera;
    this.element = options.element;
    this.config = options.config;
    this.invalidate = options.invalidate;
    this.onPointerViewChange = options.onPointerViewChange;
    this.now = options.now ?? (() => performance.now());
    this.freeZone = options.freeZone ?? (() => null);
    this.deskSpec = options.desk ?? studioDeskSpec(options.config);
    this.deskWidth = mmToM(this.deskSpec.widthMm);
    this.desk = deskVolumeOf(this.deskSpec);
    this.deskLimits = cameraLimits(options.config, this.desk);
    this.currentLimits = this.deskLimits;

    const controls = new CameraControlsImpl(options.camera);
    this.controls = controls;
    this.applyControlLimits();
    controls.boundaryFriction = 0;
    controls.dollyToCursor = false;
    controls.infinityDolly = false;
    controls.mouseButtons.left = ACTION.ROTATE;
    controls.mouseButtons.right = ACTION.TRUCK;
    controls.mouseButtons.middle = ACTION.DOLLY;
    controls.mouseButtons.wheel = ACTION.DOLLY;
    // Touch (US-021 will tune the gestures): one finger turns, two fingers zoom and move.
    controls.touches.one = ACTION.TOUCH_ROTATE;
    controls.touches.two = ACTION.TOUCH_DOLLY_TRUCK;
    controls.touches.three = ACTION.TOUCH_TRUCK;
    this.setReducedMotion(options.reducedMotion);

    // Default view, without transition.
    this.applyPose(this.frameView("reset"), false);
    copyLensInto(this.lens, this.lensTo);
    controls.update(0);
    this.updateLensShift();

    this.listeners = [
      ["controlstart", this.onControlStart],
      ["control", this.onControl],
      ["controlend", this.onControlEnd],
      ["update", this.invalidate],
      ["transitionstart", this.invalidate],
    ];
    for (const [type, listener] of this.listeners)
      controls.addEventListener(type as "update", listener);
    controls.connect(this.element);
    this.element.style.cursor = "grab";
    this.invalidate();
  }

  /** Limits in force (those of the desk, the zoom-out limit raised to the last framing). */
  get limits(): CameraLimits {
    return this.currentLimits;
  }

  /** Static limits of camera-controls (the dynamic ones are set before each frame). */
  private applyControlLimits(): void {
    const { controls, currentLimits: limits } = this;
    controls.minDistance = limits.minDistance;
    controls.maxDistance = limits.maxDistance;
    controls.minPolarAngle = limits.minPolar;
    controls.maxPolarAngle = limits.maxPolar;
    controls.minAzimuthAngle = limits.minAzimuth;
    controls.maxAzimuthAngle = limits.maxAzimuth;
    controls.setBoundary(new Box3(new Vector3(...limits.pan.min), new Vector3(...limits.pan.max)));
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    this.controls.smoothTime = reduced ? 0 : SMOOTH_TIME_S;
    this.controls.draggingSmoothTime = reduced ? 0 : DRAG_SMOOTH_TIME_S;
  }

  get transitioning(): boolean {
    return this.tween !== null;
  }

  /** Pose the controls are heading to (end values, after damping). */
  endPose(): Pose {
    this.readEnd();
    return {
      target: [this.target.x, this.target.y, this.target.z],
      radius: this.spherical.radius,
      polar: this.spherical.phi,
      azimuth: this.spherical.theta,
    };
  }

  /** Writes the end target and orbit into `this.target` / `this.spherical`. */
  private readEnd(): void {
    this.controls.getTarget(this.target, true);
    this.controls.getSpherical(this.spherical, true);
  }

  /** Pose of a view in the zone of the last framing, with the limits in force. */
  viewPose(view: "reset" | "top" | "front"): Pose {
    return viewPose(this.config, view, this.camera.aspect, this.limits, this.zone, this.desk);
  }

  /**
   * Reads the free zone now (it becomes `lensTo`), then frames the view in it. The zoom-out
   * limit is raised to the framing if needed (a window taller than the reference ones), so a
   * view is never cut by it; the studio space still bounds the camera.
   */
  private frameView(view: FramedView): Pose {
    return this.frameWith((free) =>
      viewPose(this.config, view, this.camera.aspect, free, this.zone, this.desk),
    );
  }

  /** Reads the free zone, computes a pose without zoom-out limit, then sets the limits. */
  private frameWith(compute: (free: CameraLimits) => Pose): Pose {
    const zone = this.freeZone();
    this.zone = isUsableZone(zone) ? Object.freeze({ ...zone }) : null;
    lensInto(this.lensTo, this.zone);
    const pose = compute(withMaxDistance(this.deskLimits, Infinity));
    this.currentLimits = withMaxDistance(
      this.deskLimits,
      Math.max(this.deskLimits.maxDistance, pose.radius),
    );
    this.applyControlLimits();
    return clampPose(pose, this.currentLimits);
  }

  /**
   * The free zone changed (panel collapsed or opened, window resized). The camera stays where
   * it is (UX-7): the next Reset / Top / Front reads the new zone. Only exception: the first
   * framing had no measured zone yet and nobody has moved the view, then the start framing is
   * simply redone (first display, UX-8).
   */
  freeZoneChanged(): void {
    if (this.touched || this.zone !== null) return;
    const pose = this.frameView("reset");
    if (this.zone === null) return;
    this.tween = null;
    copyLensInto(this.lens, this.lensTo);
    this.applyPose(pose, false);
    this.invalidate();
  }

  /**
   * Shows another desk (US-006): new limits (keep-out, target box, zoom-out limit), then the
   * view keeps its orientation and frames the whole desk in the free zone (UX-10), with the
   * view transition (UX-11). The same desk again changes nothing.
   */
  setDesk(desk: DeskSpec): void {
    if (sameDesk(desk, this.deskSpec)) return;
    this.deskSpec = desk;
    this.deskWidth = mmToM(desk.widthMm);
    this.desk = deskVolumeOf(desk);
    this.deskLimits = cameraLimits(this.config, this.desk);
    const from = this.endPose();
    copyLensInto(this.lensFrom, this.lens);
    const view = this.baseView;
    const to = this.frameWith((free) =>
      reframePose(this.config, from, view, this.camera.aspect, free, this.zone, this.desk),
    );
    this.glideTo(from, to);
  }

  /** Transition to `to` (480 ms, or a jump under reduced motion), lens included. */
  private glideTo(from: Pose, to: Pose): void {
    const duration = this.config.camera.transitionMs;
    if (this.reducedMotion || duration === 0) {
      this.tween = null;
      copyLensInto(this.lens, this.lensTo);
      this.applyPose(to, false);
    } else {
      this.tween = { from, to, start: this.now(), duration };
    }
    this.invalidate();
  }

  /** ViewController: view bar and keyboard. */
  run(command: ViewCommand): ViewCommandResult {
    this.touched = true;
    const from = this.endPose();
    if (command.type === "view") {
      copyLensInto(this.lensFrom, this.lens);
      this.baseView = command.view;
      this.glideTo(from, this.frameView(command.view));
      return { limitReached: false };
    }
    this.baseView = "reset";
    this.tween = null;
    const { pose, limitReached } = stepPose(from, stepFor(command, this.deskWidth), this.limits);
    this.applyPose(pose, !this.reducedMotion);
    this.invalidate();
    return { limitReached };
  }

  /** Called before each rendered frame. */
  frame(deltaSeconds: number): void {
    const { controls, limits } = this;
    const tween = this.tween;
    if (tween !== null) {
      const t = Math.min((this.now() - tween.start) / tween.duration, 1);
      const eased = EASE_IN_OUT(t);
      this.applyPose(interpolatePoseInto(this.framePose, tween.from, tween.to, eased), false);
      // The lens glides with the view (an interrupted transition keeps it where it is).
      blendLensInto(this.lens, this.lensFrom, this.lensTo, eased);
      if (t >= 1) this.tween = null;
    } else {
      // Zooming in lowers the largest tilt that keeps the camera above minCameraY.
      this.readEnd();
      const { radius, phi, theta } = this.spherical;
      const maxPolar = maxPolarForHeight(this.target.y, radius, limits.minCameraY, limits.maxPolar);
      controls.maxPolarAngle = maxPolar;
      if (phi > maxPolar + 1e-6) void controls.rotatePolarTo(maxPolar, !this.reducedMotion);
      // Turning towards the back wall while zoomed out brings the camera closer (ADR-3D-11).
      const studio = maxRadiusInStudio(this.target.x, this.target.z, phi, theta, limits.keepIn);
      const maxRadius = Math.max(limits.minDistance, Math.min(limits.maxDistance, studio));
      controls.maxDistance = maxRadius;
      if (radius > maxRadius + 1e-6) void controls.dollyTo(maxRadius, !this.reducedMotion);
    }
    const moving = controls.update(Math.min(deltaSeconds, MAX_DELTA_S));
    this.updateLensShift();
    // Last guard on the rendered camera (damping may overshoot by a few millimetres).
    const { position } = this.camera;
    const safeY = safeCameraY(position.x, position.y, position.z, limits);
    if (safeY !== position.y) {
      position.y = safeY;
      this.camera.lookAt(controls.getTarget(this.target, false));
    }
    if (moving || this.tween !== null) this.invalidate();
  }

  dispose(): void {
    for (const [type, listener] of this.listeners) {
      this.controls.removeEventListener(type as "update", listener);
    }
    this.controls.disconnect();
    this.controls.dispose();
    this.camera.clearViewOffset();
    this.element.style.cursor = "";
  }

  /**
   * Lens shift of the current tilt (render/math/framing.ts): the target is drawn at NDC
   * (x, y). Only ratios of the view offset matter, so it survives the resizes of the canvas.
   * No allocation (called before each frame).
   */
  private updateLensShift(): void {
    const x = this.lens.x;
    const y = lensY(this.lens, this.controls.polarAngle);
    const view = this.camera.view;
    if (
      view?.enabled &&
      Math.abs(view.offsetX / view.fullWidth + x / 2) < 1e-6 &&
      Math.abs(view.offsetY / view.fullHeight - y / 2) < 1e-6
    ) {
      return;
    }
    const { aspect } = this.camera;
    this.camera.setViewOffset(aspect, 1, (-x * aspect) / 2, y / 2, aspect, 1);
  }

  private applyPose(pose: Pose, smooth: boolean): void {
    const { controls, limits } = this;
    const safe = clampPoseInto(this.safePose, pose, limits);
    // Lifted here, lowered again before the next frame where the studio requires it.
    controls.maxDistance = Math.max(safe.radius, limits.maxDistance);
    controls.maxPolarAngle = Math.max(
      safe.polar,
      maxPolarForHeight(safe.target[1], safe.radius, limits.minCameraY, limits.maxPolar),
    );
    void controls.moveTo(safe.target[0], safe.target[1], safe.target[2], smooth);
    void controls.dollyTo(safe.radius, smooth);
    void controls.rotateTo(safe.azimuth, safe.polar, smooth);
  }

  private readonly onControlStart = () => {
    this.touched = true;
    this.baseView = "reset";
    this.tween = null;
    this.onPointerViewChange();
    const action = this.controls.currentAction;
    this.element.style.cursor =
      (action & (ACTION.TRUCK | ACTION.TOUCH_TRUCK)) !== 0 ? "move" : "grabbing";
    this.invalidate();
  };

  /** Also fired by the wheel, which has no "controlstart". */
  private readonly onControl = () => {
    this.touched = true;
    this.baseView = "reset";
    this.tween = null;
    this.onPointerViewChange();
    this.invalidate();
  };

  private readonly onControlEnd = () => {
    this.element.style.cursor = "grab";
  };
}
