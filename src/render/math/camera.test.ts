import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { testCatalog } from "../../../tests/unit/helpers/fixtures";
import { toStudioConfig, type Vec3 } from "../../core";
import {
  boxVolume,
  cameraLimits,
  clampCameraPosition,
  clampPose,
  clampPoseInto,
  createPose,
  deskBox,
  fitRadius,
  interpolatePose,
  interpolatePoseInto,
  intersectBoxes,
  isInside,
  lensShiftFor,
  maxPolarForHeight,
  poseFromLookAt,
  positionOf,
  posesEqual,
  reframePose,
  safeCameraY,
  screenAxes,
  stepPose,
  viewPose,
  type Pose,
} from "./camera";
import { DEG2RAD } from "./units";

const config = toStudioConfig(testCatalog().studio);
const limits = cameraLimits(config);
const DESKTOP = 1366 / 768;
const PORTRAIT = 390 / 844;

const close = (actual: readonly number[], expected: readonly number[], digits = 6) =>
  actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i]!, digits));

describe("cameraLimits (studio.json -> radians, metres)", () => {
  it("converts the catalog limits", () => {
    expect(limits.minDistance).toBe(0.8);
    expect(limits.maxDistance).toBe(7);
    expect(limits.maxPolar).toBeCloseTo(89 * DEG2RAD);
    expect(limits.minAzimuth).toBeCloseTo(-109 * DEG2RAD);
    expect(limits.minCameraY).toBe(0.9);
    // catalog pan box (x +-1, y 0.5-1.1, z +-0.8) intersected with the desk
    expect(limits.pan).toEqual({ min: [-0.7, 0.5, -0.35], max: [0.7, 0.74, 0.35] });
  });

  it("inflates the desk box by the margin (mm -> m)", () => {
    close(limits.keepOut.min, [-0.8, 0, -0.45]);
    close(limits.keepOut.max, [0.8, 0.84, 0.45]);
    expect(deskBox(config)).toEqual({ min: [-0.7, 0, -0.35], max: [0.7, 0.74, 0.35] });
  });
});

describe("poses", () => {
  it("round-trips position and target", () => {
    const pose = poseFromLookAt([1.75, 1.5, 2.7], [0, 0.72, 0]);
    close(positionOf(pose), [1.75, 1.5, 2.7]);
    expect(pose.azimuth).toBeCloseTo(Math.atan2(1.75, 2.7));
  });

  it("handles a camera on the target", () => {
    expect(poseFromLookAt([0, 1, 0], [0, 1, 0])).toMatchObject({ radius: 0, polar: 0 });
  });

  it("gives screen axes that stay stable when looking straight down", () => {
    const { right, up } = screenAxes({ target: [0, 0.74, 0], radius: 2, polar: 0, azimuth: 0 });
    close(right, [1, 0, 0]);
    close(up, [0, 0, -1]); // back edge of the desk at the top of the screen
  });
});

describe("maxPolarForHeight", () => {
  it("allows any tilt when the target is high enough", () => {
    expect(maxPolarForHeight(1.0, 1, 0.9, 1.5)).toBeCloseTo(1.5);
    expect(maxPolarForHeight(3, 1, 0.9, 2.5)).toBe(2.5); // even looking up from below
  });
  it("limits the tilt so that the camera stays above minY", () => {
    const polar = maxPolarForHeight(0.72, 0.8, 0.9, 89 * DEG2RAD);
    expect(0.72 + 0.8 * Math.cos(polar)).toBeCloseTo(0.9);
  });
  it("forces a view from above when the distance cannot reach minY otherwise", () => {
    expect(maxPolarForHeight(0, 0.5, 0.9, 1.5)).toBe(0);
  });
  it("ignores a null distance", () => {
    expect(maxPolarForHeight(0, 0, 0.9, 1.2)).toBe(1.2);
  });
});

describe("views (Reset, Top, Front)", () => {
  it("Reset view looks from the catalog direction, moved back to frame the whole desk", () => {
    const catalog = poseFromLookAt([1.75, 1.5, 2.7], [0, 0.72, 0]);
    for (const aspect of [DESKTOP, 1920 / 1080]) {
      const reset = viewPose(config, "reset", aspect);
      close(reset.target, [0, 0.72, 0]);
      expect(reset.azimuth).toBeCloseTo(catalog.azimuth);
      expect(reset.polar).toBeCloseTo(catalog.polar);
      // never closer than the catalog distance, further only if the desk would not fit
      const fit = fitRadius(deskBox(config), reset.target, reset.polar, reset.azimuth, 32, aspect);
      expect(reset.radius).toBeCloseTo(Math.max(catalog.radius, fit));
      expect(reset.radius).toBeLessThan(limits.maxDistance);
    }
  });

  it("is deterministic (Reset always returns exactly the same pose)", () => {
    expect(viewPose(config, "reset", DESKTOP)).toEqual(viewPose(config, "reset", DESKTOP));
  });

  it("Top looks straight down, back edge at the top, whole desk framed", () => {
    const top = viewPose(config, "top", DESKTOP);
    expect(top.polar).toBeLessThan(0.1 * DEG2RAD);
    expect(top.azimuth).toBeCloseTo(0);
    close(screenAxes(top).up, [0, 0, -1], 3);
    const fit = fitRadius(deskBox(config), top.target, top.polar, top.azimuth, 32, DESKTOP);
    expect(top.radius).toBeGreaterThanOrEqual(fit);
  });

  it("Front looks at the desk from the user side, whole desk framed", () => {
    const front = viewPose(config, "front", DESKTOP);
    expect(front.azimuth).toBeCloseTo(0);
    expect(positionOf(front)[2]).toBeGreaterThan(0.35);
    const fit = fitRadius(deskBox(config), front.target, front.polar, front.azimuth, 32, DESKTOP);
    expect(front.radius).toBeGreaterThanOrEqual(fit);
  });

  it.each(["reset", "top", "front"] as const)(
    "%s respects every limit, at desktop and portrait aspect ratios",
    (view) => {
      for (const aspect of [DESKTOP, PORTRAIT, 4]) {
        const pose = viewPose(config, view, aspect);
        expect(posesEqual(pose, clampPose(pose, limits))).toBe(true);
        const position = positionOf(pose);
        expect(position[1]).toBeGreaterThanOrEqual(limits.minCameraY - 1e-9);
        expect(isInside(position, limits.keepOut)).toBe(false);
      }
    },
  );

  it("moves back on a narrow (portrait) screen to keep the desk framed", () => {
    const desktop = viewPose(config, "top", DESKTOP);
    const portrait = viewPose(config, "top", PORTRAIT);
    expect(portrait.radius).toBeGreaterThan(desktop.radius);
    expect(portrait.radius).toBeLessThanOrEqual(limits.maxDistance);
  });
});

describe("fitRadius", () => {
  it("matches the analytic distance for a box seen from the front", () => {
    const box = { min: [-1, -0.5, 0] as Vec3, max: [1, 0.5, 0] as Vec3 };
    const tan = Math.tan((32 * DEG2RAD) / 2);
    // Height-bound at aspect 1 (width / aspect > height): 1 / tan
    const plain = { left: -1, right: 1, bottom: -1, top: 1, centerX: 0, centerY: 0 };
    expect(fitRadius(box, [0, 0, 0], Math.PI / 2, 0, 32, 1, plain)).toBeCloseTo(1 / tan);
    expect(fitRadius(box, [0, 0, 0], Math.PI / 2, 0, 32, 4, plain)).toBeCloseTo(0.5 / tan);
  });

  it("keeps the bottom inset free (view bar) and accounts for the lens shift", () => {
    const below = { min: [-0.1, -0.5, 0] as Vec3, max: [0.1, 0, 0] as Vec3 };
    const above = { min: [-0.1, 0, 0] as Vec3, max: [0.1, 0.5, 0] as Vec3 };
    const tan = Math.tan((32 * DEG2RAD) / 2);
    // Bottom inset 0.1 of the height (NDC -0.8), target drawn at NDC 0.3.
    const framing = { left: -1, right: 1, bottom: -0.8, top: 1, centerX: 0, centerY: 0.3 };
    expect(fitRadius(below, [0, 0, 0], Math.PI / 2, 0, 32, 4, framing)).toBeCloseTo(
      0.5 / (tan * 1.1),
    );
    expect(fitRadius(above, [0, 0, 0], Math.PI / 2, 0, 32, 4, framing)).toBeCloseTo(
      0.5 / (tan * 0.7),
    );
  });

  it("fits a box on each side of a target drawn off-centre (free zone between panels)", () => {
    const leftOf = { min: [-1, 0, 0] as Vec3, max: [0, 0, 0] as Vec3 };
    const rightOf = { min: [0, 0, 0] as Vec3, max: [1, 0, 0] as Vec3 };
    const tan = Math.tan((32 * DEG2RAD) / 2);
    const framing = { left: -0.5, right: 0.9, bottom: -1, top: 1, centerX: 0.1, centerY: 0 };
    expect(fitRadius(leftOf, [0, 0, 0], Math.PI / 2, 0, 32, 1, framing)).toBeCloseTo(
      1 / (tan * 0.6),
    );
    expect(fitRadius(rightOf, [0, 0, 0], Math.PI / 2, 0, 32, 1, framing)).toBeCloseTo(
      1 / (tan * 0.8),
    );
  });
});

const arbitraryPose = fc.record({
  target: fc.tuple(
    fc.double({ min: -5, max: 5, noNaN: true }),
    fc.double({ min: -2, max: 4, noNaN: true }),
    fc.double({ min: -5, max: 5, noNaN: true }),
  ),
  radius: fc.double({ min: 0, max: 20, noNaN: true }),
  polar: fc.double({ min: 0, max: Math.PI, noNaN: true }),
  azimuth: fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
}) as fc.Arbitrary<Pose>;

describe("clampPose (property-based)", () => {
  it("always yields a pose inside every limit: above 0.9 m, out of the desk, bounded", () => {
    fc.assert(
      fc.property(arbitraryPose, (pose) => {
        const safe = clampPose(pose, limits);
        const position = positionOf(safe);
        expect(position[1]).toBeGreaterThanOrEqual(limits.minCameraY - 1e-9);
        expect(isInside(position, limits.keepOut)).toBe(false);
        expect(safe.radius).toBeGreaterThanOrEqual(limits.minDistance);
        expect(safe.radius).toBeLessThanOrEqual(limits.maxDistance);
        expect(safe.azimuth).toBeGreaterThanOrEqual(limits.minAzimuth);
        expect(safe.azimuth).toBeLessThanOrEqual(limits.maxAzimuth);
        expect(isInside(safe.target, limits.pan) || posesEqual(safe, clampPose(safe, limits))).toBe(
          true,
        );
        // idempotent
        expect(posesEqual(clampPose(safe, limits), safe)).toBe(true);
      }),
    );
  });

  it("keeps the desk in view when the view is moved to its bounds (target inside the desk)", () => {
    fc.assert(
      fc.property(arbitraryPose, (pose) => {
        const { target } = clampPose(pose, limits);
        const desk = deskBox(config);
        target.forEach((value, axis) => {
          expect(value).toBeGreaterThanOrEqual(desk.min[axis]!);
          expect(value).toBeLessThanOrEqual(desk.max[axis]!);
        });
      }),
    );
  });
});

describe("lensShiftFor", () => {
  it("only clears the view bar from above, centres the hanging desk from the side", () => {
    expect(lensShiftFor(0)).toBeCloseTo(0.1);
    expect(lensShiftFor(Math.PI / 2)).toBeCloseTo(0.3);
    expect(lensShiftFor(Math.PI)).toBeCloseTo(0.3);
    expect(lensShiftFor(Math.PI / 4)).toBeGreaterThan(0.1);
  });
});

describe("intersectBoxes", () => {
  it("keeps the outer bounds on an axis without overlap", () => {
    const outer = { min: [0, 0, 0] as Vec3, max: [1, 1, 1] as Vec3 };
    const inner = { min: [0.5, 2, -1] as Vec3, max: [2, 3, 0.5] as Vec3 };
    expect(intersectBoxes(outer, inner)).toEqual({ min: [0.5, 0, 0], max: [1, 1, 0.5] });
  });
});

describe("clampCameraPosition (last guard on the rendered camera)", () => {
  it("lifts a camera under minCameraY", () => {
    expect(clampCameraPosition([2, 0.3, 2], limits)).toEqual([2, 0.9, 2]);
  });
  it("leaves a valid position untouched", () => {
    expect(clampCameraPosition([2, 1.5, 2], limits)).toEqual([2, 1.5, 2]);
  });
  it("pushes a camera out of the desk box (when minCameraY is under the desk)", () => {
    const low = { ...limits, minCameraY: 0 };
    expect(clampCameraPosition([0, 0.5, 0], low)[1]).toBeCloseTo(0.84);
  });
});

describe("interpolatePose", () => {
  const a: Pose = { target: [0, 0.72, 0], radius: 3, polar: 1.2, azimuth: 0.5 };
  const b: Pose = { target: [0, 0.74, 0.05], radius: 2.66, polar: 0, azimuth: 0 };
  it("starts and ends on the given poses", () => {
    expect(posesEqual(interpolatePose(a, b, 0), a)).toBe(true);
    expect(posesEqual(interpolatePose(a, b, 1), b)).toBe(true);
  });
  it("stays within the azimuth limits along the way", () => {
    const left: Pose = { ...a, azimuth: limits.minAzimuth };
    const right: Pose = { ...a, azimuth: limits.maxAzimuth };
    for (let t = 0; t <= 1; t += 0.125) {
      const azimuth = interpolatePose(left, right, t).azimuth;
      expect(azimuth).toBeGreaterThanOrEqual(limits.minAzimuth);
      expect(azimuth).toBeLessThanOrEqual(limits.maxAzimuth);
    }
  });
});

describe("allocation-free variants of the render loop (…Into, safeCameraY)", () => {
  const arbitraryT = fc.double({ min: 0, max: 1, noNaN: true });
  const arbitraryPosition = fc.tuple(
    fc.double({ min: -3, max: 3, noNaN: true }),
    fc.double({ min: -1, max: 3, noNaN: true }),
    fc.double({ min: -3, max: 3, noNaN: true }),
  );

  it("clampPoseInto writes clampPose into the given object, even when it is the input", () => {
    const out = createPose();
    fc.assert(
      fc.property(arbitraryPose, (pose) => {
        const expected = clampPose(pose, limits);
        expect(clampPoseInto(out, pose, limits)).toBe(out);
        expect(out).toEqual(expected);
        const copy = { ...pose, target: [...pose.target] as [number, number, number] };
        expect(clampPoseInto(copy, copy, limits)).toEqual(expected);
      }),
    );
  });

  it("interpolatePoseInto writes interpolatePose into the given object", () => {
    const out = createPose();
    fc.assert(
      fc.property(arbitraryPose, arbitraryPose, arbitraryT, (from, to, t) => {
        expect(interpolatePoseInto(out, from, to, t)).toBe(out);
        expect(out).toEqual(interpolatePose(from, to, t));
      }),
    );
  });

  it("safeCameraY is the height of clampCameraPosition (lifted, then out of the desk)", () => {
    fc.assert(
      fc.property(arbitraryPosition, ([x, y, z]) => {
        const lifted = Math.max(y, limits.minCameraY);
        const expected = isInside([x, lifted, z], limits.keepOut) ? limits.keepOut.max[1] : lifted;
        expect(safeCameraY(x, y, z, limits)).toBe(expected);
        expect(clampCameraPosition([x, y, z], limits)).toEqual([x, expected, z]);
      }),
    );
    const low = { ...limits, minCameraY: 0 };
    expect(safeCameraY(0, 0.5, 0, low)).toBeCloseTo(0.84);
  });
});

describe("stepPose (keyboard)", () => {
  const reset = viewPose(config, "reset", DESKTOP);

  it("turns by the step", () => {
    const { pose, limitReached } = stepPose(
      reset,
      { kind: "turn", azimuth: 15 * DEG2RAD, polar: 0 },
      limits,
    );
    expect(pose.azimuth - reset.azimuth).toBeCloseTo(15 * DEG2RAD);
    expect(limitReached).toBe(false);
  });

  it("reports the azimuth limit", () => {
    const edge = { ...reset, azimuth: limits.maxAzimuth };
    const result = stepPose(edge, { kind: "turn", azimuth: 15 * DEG2RAD, polar: 0 }, limits);
    expect(result.limitReached).toBe(true);
    expect(result.pose.azimuth).toBeCloseTo(limits.maxAzimuth);
  });

  it("zooms by 10 % and reports the zoom limit", () => {
    const zoomed = stepPose(reset, { kind: "zoom", factor: 0.9 }, limits);
    expect(zoomed.pose.radius).toBeCloseTo(reset.radius * 0.9);
    expect(zoomed.limitReached).toBe(false);
    const near = { ...reset, radius: limits.minDistance };
    expect(stepPose(near, { kind: "zoom", factor: 0.9 }, limits).limitReached).toBe(true);
    const far = { ...reset, radius: limits.maxDistance };
    expect(stepPose(far, { kind: "zoom", factor: 1 / 0.9 }, limits).limitReached).toBe(true);
  });

  it("does not call a tilt correction a zoom limit", () => {
    const low: Pose = { target: [0, 0.72, 0], radius: 1.2, polar: 80 * DEG2RAD, azimuth: 0 };
    const result = stepPose(clampPose(low, limits), { kind: "zoom", factor: 0.9 }, limits);
    expect(result.limitReached).toBe(false);
    expect(positionOf(result.pose)[1]).toBeGreaterThanOrEqual(0.9 - 1e-9);
  });

  it("moves the view along the screen axes and stops at the bounds", () => {
    const moved = stepPose(reset, { kind: "move", right: 0.07, up: 0 }, limits);
    const { right } = screenAxes(reset);
    close(moved.pose.target, [right[0] * 0.07, 0.72, right[2] * 0.07]);
    expect(moved.limitReached).toBe(false);
    const edge: Pose = { ...reset, target: [0.7, 0.72, 0], azimuth: 0 };
    expect(stepPose(edge, { kind: "move", right: 0.07, up: 0 }, limits).limitReached).toBe(true);
  });

  it("tilts within the angle limits", () => {
    const top = viewPose(config, "top", DESKTOP);
    const result = stepPose(top, { kind: "turn", azimuth: 0, polar: -10 * DEG2RAD }, limits);
    expect(result.limitReached).toBe(true);
    expect(result.pose.polar).toBeCloseTo(0);
  });
});

describe("reframePose (change of desk, US-006 UX-10)", () => {
  const large = boxVolume({ min: [-0.9, 0, -0.8], max: [0.9, 0.74, 0.8] });
  const largeLimits = cameraLimits(config, large);

  it("keeps the orientation, returns to the view target, frames the whole new desk", () => {
    const current: Pose = { target: [0.3, 0.6, 0.2], radius: 1.2, polar: 1.1, azimuth: -0.7 };
    const pose = reframePose(config, current, "reset", DESKTOP, largeLimits, null, large);
    expect(pose.polar).toBeCloseTo(current.polar, 9);
    expect(pose.azimuth).toBeCloseTo(current.azimuth, 9);
    expect(pose.target).toEqual(config.camera.views.reset.target);
    const fit = fitRadius(large.points, pose.target, pose.polar, pose.azimuth, 32, DESKTOP);
    expect(pose.radius).toBeCloseTo(fit, 9);
  });

  it("never comes closer than the catalog distance of the view", () => {
    const small = boxVolume({ min: [-0.1, 0, -0.1], max: [0.1, 0.74, 0.1] });
    const top = viewPose(config, "top", DESKTOP);
    const pose = reframePose(config, top, "top", DESKTOP, cameraLimits(config, small), null, small);
    const catalog = poseFromLookAt(
      config.camera.views.top.position,
      config.camera.views.top.target,
    );
    expect(pose.radius).toBeCloseTo(catalog.radius, 9);
  });
});
