// Zoom-out limit and studio space of the camera (risk R11, ADR-3D-11).
// US-005 set the limit at 7 m: the 140 x 70 desk needs 5.3 m at 1024 x 768 with both panels
// open. The desks of US-006 (up to 180 x 160) need about 8.2 m there, and beyond about 8 m a
// fixed limit let the camera reach the curved back wall at the side angles. Now the limit
// follows the desk (`deskMaxDistance`) and the studio space bounds the camera for any pose
// (`maxRadiusInStudio`): no decor change, no framing cut.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { testCatalog } from "../../../tests/unit/helpers/fixtures";
import { DESK_TYPE, toStudioConfig, type ViewName } from "../../core";
import {
  boxVolume,
  cameraLimits,
  clampPose,
  deskMaxDistance,
  FIT_SPARE,
  fitRadius,
  maxRadiusInStudio,
  poseFromLookAt,
  positionOf,
  studioKeepIn,
  viewPose,
  withMaxDistance,
  type Box,
  type CameraLimits,
  type Pose,
} from "./camera";
import { framingFor, REFERENCE_ZONES } from "./framing";
import { DEG2RAD } from "./units";

const config = toStudioConfig(testCatalog().studio);
const VIEWS: readonly ViewName[] = ["reset", "top", "front"];

/** Bounding box of every desk preset of the catalog (metres, origin on the floor). */
const DESK_BOXES: readonly [string, Box][] = [...testCatalog().objectTypes.values()]
  .filter((type) => type.type === DESK_TYPE)
  .flatMap((type) =>
    (type.presets ?? []).map((preset): [string, Box] => {
      const param = (key: string) => Number(preset.params[key] ?? type.params[key]!.default);
      const w = param("width") / 2000;
      const d = param("depth") / 2000;
      return [`${type.id}/${preset.id}`, { min: [-w, 0, -d], max: [w, param("height") / 1000, d] }];
    }),
  );

const { cyclorama } = config;
const wallZ = cyclorama.curveStartZ - cyclorama.radius;
/** Height of the curved floor at depth z (0 in front of the curve). */
const floorAt = (z: number) => {
  const into = cyclorama.curveStartZ - z;
  if (into <= 0) return 0;
  return cyclorama.radius - Math.sqrt(Math.max(0, cyclorama.radius ** 2 - into ** 2));
};

/** The camera position of a pose is inside the studio, away from the decor. */
function expectInStudio(position: readonly number[], limits: CameraLimits) {
  const [cx, cy, cz] = position as [number, number, number];
  const camY = Math.max(cy, limits.minCameraY);
  expect(cz).toBeGreaterThan(wallZ + 0.2);
  expect(cz).toBeLessThan(cyclorama.floorEndZ);
  expect(Math.abs(cx)).toBeLessThan(cyclorama.halfWidthX);
  expect(camY - floorAt(cz)).toBeGreaterThanOrEqual(0.3 - 1e-9);
  expect(camY).toBeLessThan(config.camera.far / 2);
}

describe("zoom-out limit of a desk (deskMaxDistance)", () => {
  it("covers the 7 desks of the catalog", () => {
    expect(DESK_BOXES).toHaveLength(7);
  });

  it("keeps the catalog limit for the default desk, grows for larger desks", () => {
    const standard = DESK_BOXES.find(([id]) => id === "desk.rect/standard")![1];
    const large = DESK_BOXES.find(([id]) => id === "desk.corner/large")![1];
    expect(deskMaxDistance(config, boxVolume(standard))).toBe(config.camera.limits.maxDistance);
    const largest = deskMaxDistance(config, boxVolume(large));
    expect(largest).toBeGreaterThan(8.2);
    expect(largest).toBeLessThan(9.5);
  });

  it.each(DESK_BOXES)(
    "%s fits every view at 1024 px with both panels open, 10 %% to spare, never cut",
    (_, box) => {
      const desk = boxVolume(box);
      const limits = cameraLimits(config, desk);
      for (const view of VIEWS) {
        const { position, target } = config.camera.views[view];
        const pose = poseFromLookAt(position, target);
        for (const zone of REFERENCE_ZONES) {
          const aspect = zone.width / zone.height;
          const needed = fitRadius(
            box,
            pose.target,
            pose.polar,
            pose.azimuth,
            config.camera.fovDeg,
            aspect,
            framingFor(pose.polar, zone),
          );
          expect(needed * FIT_SPARE).toBeLessThanOrEqual(limits.maxDistance + 1e-9);
          // Neither the zoom limit nor the studio cuts the framing (UX-8 holds).
          const framed = viewPose(config, view, aspect, limits, zone, desk);
          expect(framed.radius).toBeCloseTo(Math.max(pose.radius, needed), 9);
          expectInStudio(positionOf(framed), limits);
        }
      }
    },
  );
});

describe("taller windows (1024 x 900): the framing raises the zoom-out limit", () => {
  it.each(DESK_BOXES)("%s is framed without cut, inside the studio", (_, box) => {
    const desk = boxVolume(box);
    const free = withMaxDistance(cameraLimits(config, desk), Infinity);
    const zone = { ...REFERENCE_ZONES[0]!, height: 900 };
    for (const view of VIEWS) {
      const { position, target } = config.camera.views[view];
      const pose = poseFromLookAt(position, target);
      const needed = fitRadius(
        box,
        pose.target,
        pose.polar,
        pose.azimuth,
        config.camera.fovDeg,
        1024 / 900,
        framingFor(pose.polar, zone),
      );
      const framed = viewPose(config, view, 1024 / 900, free, zone, desk);
      expect(framed.radius).toBeCloseTo(Math.max(pose.radius, needed), 9);
      expectInStudio(positionOf(framed), free);
    }
  });
});

describe("studio space of the camera (studioKeepIn, maxRadiusInStudio)", () => {
  const keepIn = studioKeepIn(config);

  it("is derived from the cyclorama with a 0.3 m clearance", () => {
    // Back wall at z = -3.1; the curved floor reaches 0.6 m (minCameraY 0.9 - 0.3) at z = -2.8.
    expect(keepIn.minZ).toBeCloseTo(-2.8, 9);
    expect(keepIn.maxZ).toBeCloseTo(cyclorama.floorEndZ - 0.3, 9);
    expect(keepIn.maxAbsX).toBeCloseTo(cyclorama.halfWidthX - 0.3, 9);
  });

  it("does not limit a camera looking from above or from the front within the floor", () => {
    expect(maxRadiusInStudio(0, 0, 0, 0, keepIn)).toBe(Infinity);
    expect(maxRadiusInStudio(0, 0, Math.PI / 2, 0, keepIn)).toBeCloseTo(keepIn.maxZ, 9);
    expect(maxRadiusInStudio(0, 0, Math.PI / 2, Math.PI / 2, keepIn)).toBeCloseTo(
      keepIn.maxAbsX,
      9,
    );
  });

  it("brings the camera closer when it turns towards the back wall", () => {
    const side = maxRadiusInStudio(0, -0.8, Math.PI / 2, 109 * DEG2RAD, keepIn);
    expect(side).toBeCloseTo(2 / Math.cos((180 - 109) * DEG2RAD), 6);
  });

  it("follows the minimum height of the camera", () => {
    const at = (minCameraY: number) =>
      studioKeepIn({
        ...config,
        camera: { ...config.camera, limits: { ...config.camera.limits, minCameraY } },
      }).minZ;
    expect(at(0.3)).toBeCloseTo(cyclorama.curveStartZ, 9); // camera low: before the curve
    expect(at(0.2)).toBeCloseTo(cyclorama.curveStartZ, 9);
    expect(at(5)).toBeCloseTo(wallZ + 0.3, 9); // above the whole curve: the wall decides
  });

  it("keeps the camera inside the studio for any pose, with the largest desk", () => {
    const largest = DESK_BOXES.reduce((a, b) =>
      deskMaxDistance(config, boxVolume(b[1])) > deskMaxDistance(config, boxVolume(a[1])) ? b : a,
    )[1];
    const limits = cameraLimits(config, boxVolume(largest));
    const { pan } = limits;
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 30, noNaN: true }),
        fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
        fc.double({ min: -Math.PI, max: Math.PI, noNaN: true }),
        fc.tuple(
          fc.double({ min: -3, max: 3, noNaN: true }),
          fc.double({ min: -1, max: 3, noNaN: true }),
          fc.double({ min: -3, max: 3, noNaN: true }),
        ),
        (radius, polar, azimuth, target) => {
          const clamped = viewPoseLike(radius, polar, azimuth, target, limits);
          expectInStudio(positionOf(clamped), limits);
          return clamped.target.every(
            (v, axis) => v >= pan.min[axis]! - 1e-9 && v <= pan.max[axis]! + 1e-9,
          );
        },
      ),
      { seed: 20261031, numRuns: 2000 },
    );
  });
});

function viewPoseLike(
  radius: number,
  polar: number,
  azimuth: number,
  target: readonly [number, number, number],
  limits: CameraLimits,
): Pose {
  return clampPose({ target, radius, polar, azimuth }, limits);
}
