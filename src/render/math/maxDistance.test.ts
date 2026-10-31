// Maximum distance of the camera (US-005, technical decision of the orchestrator): far enough
// for the desk to fit at 1024 px with both panels open (UX-8), near enough for the camera to
// stay inside the studio (in front of the cyclorama wall, above its curved floor).
// 4.5 -> 7.0 m in US-005: the 140 x 70 desk needs 5.3 m at 1024 x 768. Beyond about 8 m the
// camera could reach the curved back wall at the side angles. The desks of US-006 (up to
// 180 x 160) need 8.2 m at 1024 x 768: a deeper studio or other limits will be needed then.
import { describe, expect, it } from "vitest";
import { testCatalog } from "../../../tests/unit/helpers/fixtures";
import { toStudioConfig, type ViewName } from "../../core";
import { cameraLimits, deskBox, fitRadius, poseFromLookAt, positionOf, viewPose } from "./camera";
import { framingFor, type ScreenZone } from "./framing";
import { DEG2RAD } from "./units";

const config = toStudioConfig(testCatalog().studio);
const limits = cameraLimits(config);
const VIEWS: readonly ViewName[] = ["reset", "top", "front"];
/** Smallest docked window: 1024 px, toolbar 53 px, sidebar 248 px, inspector 312 px. */
const zone = (height: number): ScreenZone => ({
  top: 53,
  left: 248,
  right: 312,
  width: 1024,
  height,
});

describe("camera maximum distance (studio.json camera.limits.maxDistance)", () => {
  it.each([768, 640, 900])(
    "fits the catalog desk at 1024 x %i with both panels open, 10 %% to spare",
    (height) => {
      for (const view of VIEWS) {
        const { position, target } = config.camera.views[view];
        const pose = poseFromLookAt(position, target);
        const needed = fitRadius(
          deskBox(config),
          pose.target,
          pose.polar,
          pose.azimuth,
          config.camera.fovDeg,
          1024 / height,
          framingFor(pose.polar, zone(height)),
        );
        expect(needed * 1.1).toBeLessThanOrEqual(limits.maxDistance);
        // The view itself is not cut by the limit (the framing of UX-8 holds).
        const framed = viewPose(config, view, 1024 / height, limits, zone(height));
        expect(framed.radius).toBeCloseTo(Math.max(pose.radius, needed), 9);
      }
    },
  );

  it("keeps the camera inside the studio at the maximum distance, whatever the angle and pan", () => {
    const { cyclorama } = config;
    const wallZ = cyclorama.curveStartZ - cyclorama.radius;
    /** Height of the curved floor at depth z (0 in front of the curve). */
    const floorAt = (z: number) => {
      const into = cyclorama.curveStartZ - z;
      if (into <= 0) return 0;
      return cyclorama.radius - Math.sqrt(Math.max(0, cyclorama.radius ** 2 - into ** 2));
    };
    const { pan } = limits;
    for (const polarDeg of [0, 30, 60, 89]) {
      for (const azimuthDeg of [-109, -60, 0, 60, 109]) {
        for (const x of [pan.min[0], pan.max[0]]) {
          for (const y of [pan.min[1], pan.max[1]]) {
            for (const z of [pan.min[2], pan.max[2]]) {
              const [cx, cy, cz] = positionOf({
                target: [x, y, z],
                radius: limits.maxDistance,
                polar: polarDeg * DEG2RAD,
                azimuth: azimuthDeg * DEG2RAD,
              });
              const camY = Math.max(cy, limits.minCameraY);
              expect(cz).toBeGreaterThan(wallZ + 0.2);
              expect(cz).toBeLessThan(cyclorama.floorEndZ);
              expect(Math.abs(cx)).toBeLessThan(cyclorama.halfWidthX);
              expect(camY - floorAt(cz)).toBeGreaterThanOrEqual(0.3);
              expect(camY).toBeLessThan(config.camera.far / 2);
            }
          }
        }
      }
    }
  });
});
