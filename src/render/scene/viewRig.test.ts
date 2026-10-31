import { PerspectiveCamera, Vector3 } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import studio from "../../../assets/catalog/scene/studio.json";
import { StudioSceneSchema, toStudioConfig } from "../../core";
import {
  cameraLimits,
  isInside,
  lensShiftFor,
  positionOf,
  posesEqual,
  viewPose,
} from "../math/camera";
import type { ScreenZone } from "../math/framing";
import { DEG2RAD } from "../math/units";
import { stepFor, ViewRig } from "./viewRig";

// jsdom project: the studio file is imported directly (the disk helpers are Node-only).
const config = toStudioConfig(StudioSceneSchema.parse(studio));
const ASPECT = 1366 / 768;

const rigs: ViewRig[] = [];
afterEach(() => {
  for (const rig of rigs.splice(0)) rig.dispose();
});

function makeRig(reducedMotion = false, freeZone: () => ScreenZone | null = () => null) {
  let now = 0;
  const camera = new PerspectiveCamera(config.camera.fovDeg, ASPECT, 0.1, 40);
  const element = document.createElement("div");
  const invalidate = vi.fn();
  const onPointerViewChange = vi.fn();
  const rig = new ViewRig({
    camera,
    element,
    config,
    reducedMotion,
    invalidate,
    onPointerViewChange,
    now: () => now,
    freeZone,
  });
  rigs.push(rig);
  const advance = (ms: number) => {
    now += ms;
    rig.frame(ms / 1000);
  };
  /** Runs frames until the damping settles. */
  const settle = () => {
    for (let i = 0; i < 200; i++) advance(16);
  };
  return { rig, camera, element, invalidate, onPointerViewChange, advance, settle };
}

describe("stepFor (keyboard steps)", () => {
  it("turns 15 degrees left / right, tilts 10 degrees up / down", () => {
    expect(stepFor({ type: "turn", direction: "left" }, 1.4)).toEqual({
      kind: "turn",
      azimuth: 15 * DEG2RAD,
      polar: 0,
    });
    expect(stepFor({ type: "turn", direction: "right" }, 1.4)).toMatchObject({
      azimuth: -15 * DEG2RAD,
    });
    expect(stepFor({ type: "turn", direction: "up" }, 1.4)).toMatchObject({
      azimuth: 0,
      polar: -10 * DEG2RAD,
    });
    expect(stepFor({ type: "turn", direction: "down" }, 1.4)).toMatchObject({
      polar: 10 * DEG2RAD,
    });
  });

  it("zooms by 10 %", () => {
    expect(stepFor({ type: "zoom", direction: "in" }, 1.4)).toEqual({ kind: "zoom", factor: 0.9 });
    expect(stepFor({ type: "zoom", direction: "out" }, 1.4)).toEqual({
      kind: "zoom",
      factor: 1 / 0.9,
    });
  });

  it("moves by 5 % of the desk width", () => {
    const step = (direction: "left" | "right" | "up" | "down") =>
      stepFor({ type: "move", direction }, 1.4) as { right: number; up: number };
    expect(step("right").right).toBeCloseTo(0.07);
    expect(step("right").up).toBe(0);
    expect(step("left").right).toBeCloseTo(-0.07);
    expect(step("up")).toMatchObject({ right: 0 });
    expect(step("up").up).toBeCloseTo(0.07);
    expect(step("down").up).toBeCloseTo(-0.07);
  });
});

describe("ViewRig", () => {
  it("starts on the Reset view, with a grab cursor", () => {
    const { rig, camera, element } = makeRig();
    expect(posesEqual(rig.endPose(), viewPose(config, "reset", ASPECT), 1e-6)).toBe(true);
    const expected = positionOf(viewPose(config, "reset", ASPECT));
    expect(camera.position.distanceTo(new Vector3(...expected))).toBeLessThan(1e-6);
    expect(element.style.cursor).toBe("grab");
  });

  it("draws the target above the centre of the screen (lens shift for the view bar)", () => {
    const { rig, camera } = makeRig();
    camera.updateMatrixWorld();
    const target = rig.controls.getTarget(new Vector3()).project(camera);
    expect(target.x).toBeCloseTo(0);
    expect(target.y).toBeCloseTo(lensShiftFor(rig.controls.polarAngle));
    expect(target.y).toBeGreaterThan(0.25);
    camera.aspect = 0.5; // a resize keeps the shift
    camera.updateProjectionMatrix();
    expect(rig.controls.getTarget(new Vector3()).project(camera).y).toBeCloseTo(target.y);
    // seen from above, the shift only clears the view bar
    rig.setReducedMotion(true);
    rig.run({ type: "view", view: "top" });
    rig.frame(0.016);
    camera.updateMatrixWorld();
    expect(rig.controls.getTarget(new Vector3()).project(camera).y).toBeCloseTo(0.1, 2);
  });

  it("glides to Top in 480 ms with an in-out curve, then stops", () => {
    const { rig, advance, invalidate } = makeRig();
    const from = rig.endPose();
    const top = viewPose(config, "top", ASPECT);
    expect(rig.run({ type: "view", view: "top" })).toEqual({ limitReached: false });
    expect(rig.transitioning).toBe(true);
    advance(120); // 25 %: an in-out curve has covered much less than 25 %
    const quarter = rig.endPose();
    const covered = (quarter.polar - from.polar) / (top.polar - from.polar);
    expect(covered).toBeGreaterThan(0);
    expect(covered).toBeLessThan(0.15);
    advance(120);
    advance(120);
    advance(120);
    expect(rig.transitioning).toBe(false);
    expect(posesEqual(rig.endPose(), top, 1e-6)).toBe(true);
    expect(invalidate).toHaveBeenCalled();
  });

  it("jumps to the view without animation under prefers-reduced-motion", () => {
    const { rig, camera } = makeRig(true);
    rig.run({ type: "view", view: "front" });
    expect(rig.transitioning).toBe(false);
    rig.frame(0.016);
    const front = positionOf(viewPose(config, "front", ASPECT));
    expect(camera.position.distanceTo(new Vector3(...front))).toBeLessThan(1e-6);
  });

  it("Reset view returns exactly to the default view after limits were reached", () => {
    const { rig, settle } = makeRig(true);
    for (let i = 0; i < 30; i++) rig.run({ type: "zoom", direction: "in" });
    for (let i = 0; i < 30; i++) rig.run({ type: "turn", direction: "left" });
    for (let i = 0; i < 30; i++) rig.run({ type: "move", direction: "right" });
    settle();
    rig.run({ type: "view", view: "reset" });
    settle();
    expect(posesEqual(rig.endPose(), viewPose(config, "reset", ASPECT), 1e-6)).toBe(true);
  });

  it("a user action interrupts the transition where it is (no jump)", () => {
    const { rig, advance, onPointerViewChange } = makeRig();
    rig.run({ type: "view", view: "top" });
    advance(200);
    const midway = rig.endPose();
    rig.controls.dispatchEvent({ type: "control" }); // wheel / drag
    expect(rig.transitioning).toBe(false);
    expect(onPointerViewChange).toHaveBeenCalledOnce();
    expect(posesEqual(rig.endPose(), midway, 1e-9)).toBe(true);
  });

  it("a keyboard step during a transition interrupts it", () => {
    const { rig, advance } = makeRig();
    rig.run({ type: "view", view: "front" });
    advance(100);
    rig.run({ type: "zoom", direction: "out" });
    expect(rig.transitioning).toBe(false);
  });

  it("shows the move / grabbing cursor while dragging", () => {
    const { rig, element } = makeRig();
    rig.controls.dispatchEvent({ type: "controlstart" });
    expect(element.style.cursor).toBe("grabbing");
    rig.controls.dispatchEvent({ type: "controlend" });
    expect(element.style.cursor).toBe("grab");
  });

  it("reports the zoom limit and never goes under 0.9 m nor into the desk", () => {
    const { rig, camera, settle } = makeRig();
    const limits = cameraLimits(config);
    let reached = false;
    for (let i = 0; i < 40; i++) {
      reached = rig.run({ type: "zoom", direction: "in" }).limitReached || reached;
      for (let j = 0; j < 3; j++) rig.run({ type: "turn", direction: "down" });
      rig.frame(0.016);
      expect(camera.position.y).toBeGreaterThanOrEqual(limits.minCameraY - 1e-6);
      expect(isInside(camera.position.toArray(), limits.keepOut)).toBe(false);
    }
    settle();
    expect(reached).toBe(true);
    expect(rig.endPose().radius).toBeCloseTo(limits.minDistance);
    expect(camera.position.y).toBeGreaterThanOrEqual(limits.minCameraY - 1e-6);
  });

  it("lowers the allowed tilt when a zoom brings the camera too low", () => {
    const { rig, camera, settle } = makeRig(true);
    rig.run({ type: "view", view: "front" });
    rig.controls.maxPolarAngle = Math.PI / 2;
    void rig.controls.rotatePolarTo(88 * DEG2RAD, false);
    void rig.controls.dollyTo(0.8, false); // as a wheel would do
    rig.frame(0.016);
    settle();
    expect(camera.position.y).toBeGreaterThanOrEqual(0.9 - 1e-6);
  });

  it("raises the zoom-out limit to a framing narrower than the reference windows", () => {
    const narrow: ScreenZone = { top: 53, left: 560, right: 560, width: 1366, height: 768 };
    const { rig } = makeRig(true, () => narrow);
    const deskLimit = cameraLimits(config).maxDistance;
    expect(rig.limits.maxDistance).toBeGreaterThan(deskLimit);
    expect(rig.endPose().radius).toBeGreaterThan(deskLimit);
    expect(rig.endPose().radius).toBeLessThanOrEqual(rig.limits.maxDistance + 1e-9);
  });

  it("releases the element on dispose", () => {
    const { rig, element } = makeRig();
    rig.dispose();
    expect(element.style.cursor).toBe("");
    rigs.splice(rigs.indexOf(rig), 1);
  });
});

/** 1366 × 768 Studio window: toolbar 53, sidebar 248, inspector 312 (UX-8). */
const STUDIO: ScreenZone = { top: 53, left: 248, right: 312, width: 1366, height: 768 };
const CLOSED: ScreenZone = { ...STUDIO, left: 0, right: 0 };

/** Desk corners on screen, in CSS px of the 1366 × 768 view, as rendered by the camera. */
function deskRect(camera: PerspectiveCamera) {
  camera.updateMatrixWorld();
  const { min, max } = (() => {
    const w = config.desk.widthMm / 2000;
    const d = config.desk.depthMm / 2000;
    return { min: [-w, 0, -d], max: [w, config.desk.heightMm / 1000, d] };
  })();
  const rect = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  const point = new Vector3();
  for (const x of [min[0]!, max[0]!]) {
    for (const y of [min[1]!, max[1]!]) {
      for (const z of [min[2]!, max[2]!]) {
        point.set(x, y, z).project(camera);
        const px = ((point.x + 1) / 2) * STUDIO.width;
        const py = ((1 - point.y) / 2) * STUDIO.height;
        rect.left = Math.min(rect.left, px);
        rect.right = Math.max(rect.right, px);
        rect.top = Math.min(rect.top, py);
        rect.bottom = Math.max(rect.bottom, py);
      }
    }
  }
  return rect;
}

function expectInside(camera: PerspectiveCamera, zone: ScreenZone) {
  const rect = deskRect(camera);
  expect(rect.left).toBeGreaterThanOrEqual(zone.left + 24);
  expect(rect.right).toBeLessThanOrEqual(zone.width - zone.right - 24);
  expect(rect.top).toBeGreaterThanOrEqual(zone.top + 24);
}

describe("ViewRig in the free zone (US-005 UX-8)", () => {
  it("starts framed between the panels, with a margin of at least 24 px", () => {
    const { rig, camera } = makeRig(true, () => STUDIO);
    expect(posesEqual(rig.endPose(), viewPose(config, "reset", ASPECT, rig.limits, STUDIO))).toBe(
      true,
    );
    expectInside(camera, STUDIO);
    // The target is drawn at the centre of the free zone (left of the window centre here).
    const target = rig.controls.getTarget(new Vector3()).project(camera);
    expect(((target.x + 1) / 2) * 1366).toBeCloseTo((248 + 1366 - 312) / 2);
  });

  it.each(["top", "front", "reset"] as const)("%s frames the desk in the free zone", (view) => {
    const { rig, camera } = makeRig(true, () => STUDIO);
    rig.run({ type: "view", view });
    rig.frame(0.016);
    expectInside(camera, STUDIO);
  });

  it("collapsing a panel never moves the camera; the next view command uses the new zone", () => {
    let zone = STUDIO;
    const { rig, camera, invalidate } = makeRig(true, () => zone);
    const before = deskRect(camera);
    const pose = rig.endPose();
    invalidate.mockClear();
    zone = CLOSED;
    rig.freeZoneChanged();
    rig.frame(0.016);
    expect(deskRect(camera)).toEqual(before);
    expect(posesEqual(rig.endPose(), pose, 1e-12)).toBe(true);
    expect(invalidate).not.toHaveBeenCalled();
    rig.run({ type: "view", view: "reset" });
    rig.frame(0.016);
    expectInside(camera, CLOSED);
    // Centred in the window now (the free zone was left of its centre).
    const after = deskRect(camera);
    expect(after.right - after.left).toBeGreaterThanOrEqual(before.right - before.left - 1e-6);
    expect((after.left + after.right) / 2).toBeGreaterThan((before.left + before.right) / 2);
  });

  it("frames the start view again when the zone arrives late, until the view is touched", () => {
    let zone: ScreenZone | null = null;
    const { rig, camera } = makeRig(true, () => zone);
    zone = STUDIO;
    rig.freeZoneChanged();
    rig.frame(0.016);
    expectInside(camera, STUDIO);
    // Once framed in a zone, later changes wait for the next command.
    zone = CLOSED;
    rig.freeZoneChanged();
    rig.frame(0.016);
    expectInside(camera, STUDIO);
  });

  it("never reframes a view the user has already moved", () => {
    let zone: ScreenZone | null = null;
    const { rig } = makeRig(true, () => zone);
    rig.run({ type: "turn", direction: "left" });
    const turned = rig.endPose();
    zone = STUDIO;
    rig.freeZoneChanged();
    expect(posesEqual(rig.endPose(), turned, 1e-12)).toBe(true);
  });

  it("the lens glides with the transition to the new zone (no jump at its start)", () => {
    let zone = STUDIO;
    const { rig, camera, advance } = makeRig(false, () => zone);
    const centreX = () => {
      camera.updateMatrixWorld();
      return rig.controls.getTarget(new Vector3()).project(camera).x;
    };
    const start = centreX();
    zone = CLOSED;
    rig.run({ type: "view", view: "reset" });
    advance(0);
    expect(centreX()).toBeCloseTo(start, 6);
    advance(240);
    expect(centreX()).toBeGreaterThan(start);
    expect(centreX()).toBeLessThan(0);
    for (let i = 0; i < 4; i++) advance(120);
    expect(centreX()).toBeCloseTo(0, 6);
  });
});
