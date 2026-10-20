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
import { DEG2RAD } from "../math/units";
import { stepFor, ViewRig } from "./viewRig";

// jsdom project: the studio file is imported directly (the disk helpers are Node-only).
const config = toStudioConfig(StudioSceneSchema.parse(studio));
const ASPECT = 1366 / 768;

const rigs: ViewRig[] = [];
afterEach(() => {
  for (const rig of rigs.splice(0)) rig.dispose();
});

function makeRig(reducedMotion = false) {
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

  it("releases the element on dispose", () => {
    const { rig, element } = makeRig();
    rig.dispose();
    expect(element.style.cursor).toBe("");
    rigs.splice(rigs.indexOf(rig), 1);
  });
});
