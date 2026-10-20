/**
 * Constrained view controls (US-004, ADR-3D-07) on top of camera-controls, as a plain class
 * (three.js objects are mutated here, not in React components):
 * - left drag on the empty scene turns the view, wheel zooms, right drag moves the view
 *   (Pointer Events, no browser context menu); touch gestures are prepared (US-021);
 * - limits from studio.json (render/math/camera.ts): distance, angles, target box, never
 *   below `minCameraY` nor inside the desk;
 * - Reset / Top / Front: 480 ms `in-out` transitions along an arc, interrupted by any user
 *   action, instant under `prefers-reduced-motion` (which also removes the inertia);
 * - keyboard steps arrive through the state store (`ViewController`).
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
import type { StudioConfig } from "../../core";
import {
  VIEW_STEPS,
  type ViewCommand,
  type ViewCommandResult,
  type ViewController,
} from "../../state";
import {
  cameraLimits,
  clampCameraPosition,
  clampPose,
  interpolatePose,
  maxPolarForHeight,
  stepPose,
  viewPose,
  lensShiftFor,
  type CameraLimits,
  type Pose,
  type ViewStep,
} from "../math/camera";
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
}

export class ViewRig implements ViewController {
  readonly controls: CameraControlsImpl;
  readonly limits: CameraLimits;
  private readonly camera: PerspectiveCamera;
  private readonly element: HTMLElement;
  private readonly config: StudioConfig;
  private readonly invalidate: () => void;
  private readonly onPointerViewChange: () => void;
  private readonly now: () => number;
  private readonly deskWidth: number;
  private reducedMotion = false;
  private tween: Tween | null = null;
  private readonly target = new Vector3();
  private readonly spherical = new Spherical();
  private readonly listeners: [string, () => void][];

  constructor(options: ViewRigOptions) {
    this.camera = options.camera;
    this.element = options.element;
    this.config = options.config;
    this.invalidate = options.invalidate;
    this.onPointerViewChange = options.onPointerViewChange;
    this.now = options.now ?? (() => performance.now());
    this.deskWidth = mmToM(options.config.desk.widthMm);
    this.limits = cameraLimits(options.config);

    const controls = new CameraControlsImpl(options.camera);
    this.controls = controls;
    const { limits } = this;
    controls.minDistance = limits.minDistance;
    controls.maxDistance = limits.maxDistance;
    controls.minPolarAngle = limits.minPolar;
    controls.maxPolarAngle = limits.maxPolar;
    controls.minAzimuthAngle = limits.minAzimuth;
    controls.maxAzimuthAngle = limits.maxAzimuth;
    controls.setBoundary(new Box3(new Vector3(...limits.pan.min), new Vector3(...limits.pan.max)));
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
    this.applyPose(this.viewPose("reset"), false);
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
    this.controls.getTarget(this.target, true);
    this.controls.getSpherical(this.spherical, true);
    return {
      target: [this.target.x, this.target.y, this.target.z],
      radius: this.spherical.radius,
      polar: this.spherical.phi,
      azimuth: this.spherical.theta,
    };
  }

  viewPose(view: "reset" | "top" | "front"): Pose {
    return viewPose(this.config, view, this.camera.aspect, this.limits);
  }

  /** ViewController: view bar and keyboard. */
  run(command: ViewCommand): ViewCommandResult {
    const from = this.endPose();
    if (command.type === "view") {
      const to = this.viewPose(command.view);
      const duration = this.config.camera.transitionMs;
      if (this.reducedMotion || duration === 0) {
        this.tween = null;
        this.applyPose(to, false);
      } else {
        this.tween = { from, to, start: this.now(), duration };
      }
      this.invalidate();
      return { limitReached: false };
    }
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
      this.applyPose(interpolatePose(tween.from, tween.to, EASE_IN_OUT(t)), false);
      if (t >= 1) this.tween = null;
    } else {
      // Zooming in lowers the largest tilt that keeps the camera above minCameraY.
      const end = this.endPose();
      const maxPolar = maxPolarForHeight(
        end.target[1],
        end.radius,
        limits.minCameraY,
        limits.maxPolar,
      );
      controls.maxPolarAngle = maxPolar;
      if (end.polar > maxPolar + 1e-6) void controls.rotatePolarTo(maxPolar, !this.reducedMotion);
    }
    const moving = controls.update(Math.min(deltaSeconds, MAX_DELTA_S));
    this.updateLensShift();
    // Last guard on the rendered camera (damping may overshoot by a few millimetres).
    const { position } = this.camera;
    const safe = clampCameraPosition([position.x, position.y, position.z], limits);
    if (safe[1] !== position.y) {
      position.y = safe[1];
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
   * Lens shift of the current tilt (render/math/camera.ts `lensShiftFor`). Only ratios of the
   * view offset matter, so it survives the resizes of the canvas.
   */
  private updateLensShift(): void {
    const shift = lensShiftFor(this.controls.polarAngle);
    const view = this.camera.view;
    if (view?.enabled && Math.abs(view.offsetY - shift / 2) < 1e-6) return;
    const { aspect } = this.camera;
    this.camera.setViewOffset(aspect, 1, 0, shift / 2, aspect, 1);
  }

  private applyPose(pose: Pose, smooth: boolean): void {
    const { controls, limits } = this;
    const safe = clampPose(pose, limits);
    controls.maxPolarAngle = Math.max(
      safe.polar,
      maxPolarForHeight(safe.target[1], safe.radius, limits.minCameraY, limits.maxPolar),
    );
    void controls.moveTo(safe.target[0], safe.target[1], safe.target[2], smooth);
    void controls.dollyTo(safe.radius, smooth);
    void controls.rotateTo(safe.azimuth, safe.polar, smooth);
  }

  private readonly onControlStart = () => {
    this.tween = null;
    this.onPointerViewChange();
    const action = this.controls.currentAction;
    this.element.style.cursor =
      (action & (ACTION.TRUCK | ACTION.TOUCH_TRUCK)) !== 0 ? "move" : "grabbing";
    this.invalidate();
  };

  /** Also fired by the wheel, which has no "controlstart". */
  private readonly onControl = () => {
    this.tween = null;
    this.onPointerViewChange();
    this.invalidate();
  };

  private readonly onControlEnd = () => {
    this.element.style.cursor = "grab";
  };
}
