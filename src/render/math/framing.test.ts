import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { testCatalog } from "../../../tests/unit/helpers/fixtures";
import { toStudioConfig, type ViewName } from "../../core";
import { cameraLimits, deskBox, screenAxes, viewPose, type Pose } from "./camera";
import {
  blendLensInto,
  createLens,
  FRAMING_BOTTOM_INSET,
  FREE_ZONE_MARGIN_PX,
  framingFor,
  isUsableZone,
  lensInto,
  lensShiftFor,
  lensY,
  type ScreenZone,
} from "./framing";
import { DEG2RAD } from "./units";

const config = toStudioConfig(testCatalog().studio);
const limits = cameraLimits(config);
/** 1366 × 768, toolbar 53 px, sidebar 248 px, inspector 312 px: free zone of 806 px (UX-8). */
const STUDIO: ScreenZone = { top: 53, left: 248, right: 312, width: 1366, height: 768 };
const VIEWS: readonly ViewName[] = ["reset", "top", "front"];

/**
 * Screen rectangle (CSS px from the top-left corner of the view) of the desk seen from `pose`,
 * the target drawn at the framing centre: the same projection as the three.js camera with
 * `setViewOffset` (perspective, vertical FOV).
 */
function deskOnScreen(pose: Pose, zone: ScreenZone) {
  const { right, up, back } = screenAxes(pose);
  const framing = framingFor(pose.polar, zone);
  const tan = Math.tan((config.camera.fovDeg * DEG2RAD) / 2);
  const aspect = zone.width / zone.height;
  const box = deskBox(config);
  const rect = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  for (const x of [box.min[0], box.max[0]]) {
    for (const y of [box.min[1], box.max[1]]) {
      for (const z of [box.min[2], box.max[2]]) {
        const rel = [x - pose.target[0], y - pose.target[1], z - pose.target[2]] as const;
        const dot = (axis: readonly number[]) =>
          rel[0] * axis[0]! + rel[1] * axis[1]! + rel[2] * axis[2]!;
        const depth = pose.radius - dot(back);
        const ndcX = dot(right) / (depth * tan * aspect) + framing.centerX;
        const ndcY = dot(up) / (depth * tan) + framing.centerY;
        const px = ((ndcX + 1) / 2) * zone.width;
        const py = ((1 - ndcY) / 2) * zone.height;
        rect.left = Math.min(rect.left, px);
        rect.right = Math.max(rect.right, px);
        rect.top = Math.min(rect.top, py);
        rect.bottom = Math.max(rect.bottom, py);
      }
    }
  }
  return rect;
}

const UX8_MARGIN_PX = 24;

function expectInFreeZone(pose: Pose, zone: ScreenZone) {
  const rect = deskOnScreen(pose, zone);
  expect(rect.left).toBeGreaterThanOrEqual(zone.left + UX8_MARGIN_PX);
  expect(rect.right).toBeLessThanOrEqual(zone.width - zone.right - UX8_MARGIN_PX);
  expect(rect.top).toBeGreaterThanOrEqual(zone.top + UX8_MARGIN_PX);
  // Above the view bar reserve (UX-14 of US-004).
  expect(rect.bottom).toBeLessThanOrEqual(zone.height * (1 - FRAMING_BOTTOM_INSET));
}

describe("isUsableZone", () => {
  it("uses only a measured zone that leaves room for the desk", () => {
    expect(isUsableZone(STUDIO)).toBe(true);
    expect(isUsableZone(null)).toBe(false);
    expect(isUsableZone({ top: 0, left: 0, right: 0, width: 0, height: 0 })).toBe(false);
    expect(isUsableZone({ ...STUDIO, left: Number.NaN })).toBe(false);
    expect(isUsableZone({ ...STUDIO, right: -1 })).toBe(false);
    // Panels covering the whole width, or a toolbar covering the whole height.
    expect(isUsableZone({ ...STUDIO, left: 700, right: 666 })).toBe(false);
    expect(isUsableZone({ ...STUDIO, top: 700 })).toBe(false);
  });
});

describe("framingFor", () => {
  it("without a zone: the whole view, 5 % margin, view bar reserve (US-004 framing)", () => {
    for (const polar of [0, 0.6, Math.PI / 2]) {
      const shift = lensShiftFor(polar);
      const framing = framingFor(polar, null);
      expect(framing.centerX).toBe(0);
      expect(framing.centerY).toBeCloseTo(shift);
      expect(framing.right).toBeCloseTo(1 / 1.05);
      expect(framing.left).toBeCloseTo(-1 / 1.05);
      expect(framing.top - framing.centerY).toBeCloseTo((1 - shift) / 1.05);
      expect(framing.centerY - framing.bottom).toBeCloseTo((1 + shift - 0.2) / 1.05);
    }
  });

  it("in the free zone: between the panels, under the toolbar, with the margin", () => {
    const framing = framingFor(Math.PI / 2, STUDIO);
    const px = (ndc: number) => ((ndc + 1) / 2) * STUDIO.width;
    expect(px(framing.left)).toBeCloseTo(248 + FREE_ZONE_MARGIN_PX);
    expect(px(framing.right)).toBeCloseTo(1366 - 312 - FREE_ZONE_MARGIN_PX);
    expect(px(framing.centerX)).toBeCloseTo((248 + 1366 - 312) / 2);
    expect(((1 - framing.top) / 2) * 768).toBeCloseTo(53 + FREE_ZONE_MARGIN_PX);
    expect(framing.centerY).toBeLessThan(framing.top);
    expect(framing.centerY).toBeGreaterThan((framing.top + framing.bottom) / 2);
    // From above the target is at the centre of the free height.
    const above = framingFor(0, STUDIO);
    expect(above.centerY).toBeCloseTo((above.top + above.bottom) / 2);
  });
});

describe("lens", () => {
  it("gives the whole-view lens shift without a zone", () => {
    const lens = lensInto(createLens(), null);
    for (const polar of [0, 0.4, 1, Math.PI / 2]) {
      expect(lensY(lens, polar)).toBeCloseTo(lensShiftFor(polar));
    }
    expect(lens.x).toBe(0);
  });

  it("matches the framing centre and blends linearly between two zones", () => {
    const zone = lensInto(createLens(), STUDIO);
    expect(zone.x).toBeCloseTo(framingFor(1, STUDIO).centerX);
    expect(lensY(zone, 1)).toBeCloseTo(framingFor(1, STUDIO).centerY);
    const whole = lensInto(createLens(), null);
    const half = blendLensInto(createLens(), whole, zone, 0.5);
    expect(half.x).toBeCloseTo(zone.x / 2);
    expect(lensY(half, 1)).toBeCloseTo((lensY(whole, 1) + lensY(zone, 1)) / 2);
  });
});

describe("views in the free zone (UX-8)", () => {
  it.each(VIEWS)(
    "%s frames the whole desk between the panels at 1366 x 768, margin >= 24 px",
    (view) => {
      const pose = viewPose(config, view, STUDIO.width / STUDIO.height, limits, STUDIO);
      expect(pose.radius).toBeLessThan(limits.maxDistance);
      expectInFreeZone(pose, STUDIO);
    },
  );

  it("panels closed: the whole width, still with the margin", () => {
    const closed = { ...STUDIO, left: 0, right: 0 };
    for (const view of VIEWS) {
      expectInFreeZone(
        viewPose(config, view, closed.width / closed.height, limits, closed),
        closed,
      );
    }
  });

  it("any usable zone: the desk is inside it unless the distance limit cuts the framing", () => {
    const zones = fc
      .record({
        width: fc.integer({ min: 320, max: 2560 }),
        height: fc.integer({ min: 300, max: 1440 }),
        top: fc.integer({ min: 0, max: 120 }),
        left: fc.integer({ min: 0, max: 420 }),
        right: fc.integer({ min: 0, max: 420 }),
      })
      .filter(isUsableZone);
    fc.assert(
      fc.property(zones, fc.constantFrom(...VIEWS), (zone, view) => {
        const pose = viewPose(config, view, zone.width / zone.height, limits, zone);
        fc.pre(pose.radius < limits.maxDistance - 1e-9);
        expectInFreeZone(pose, zone);
      }),
    );
  });
});
