/**
 * Where a view frames the desk on screen (US-004 UX-14, US-005 UX-8, ADR-3D-10). Pure, no
 * three.js; NDC = normalised device coordinates of the 3D view (-1 left / bottom, +1 right / top).
 *
 * - Without a measured free zone: the whole view, 5 % margin, 10 % of the height kept free at
 *   the bottom for the floating view bar (US-004).
 * - With the free zone published by the Studio shell (CSS px: toolbar at the top, docked
 *   panels on the sides): the desk fits between the panels and under the toolbar, with a
 *   margin of `FREE_ZONE_MARGIN_PX` on every side, above the same view bar reserve.
 *
 * The orbit target is drawn at (`centerX`, `centerY`) by a lens shift
 * (`PerspectiveCamera.setViewOffset`): horizontally at the centre of the free zone, vertically
 * above its centre from the side (the desk hangs below the target) and at its centre from
 * above. The orbit itself does not change.
 */
import { clamp } from "./units";

/** Free zone of the 3D view, in CSS px (same shape as `FreeZone` of `state/shell`). */
export interface ScreenZone {
  /** Insets of the free zone inside the view. */
  readonly top: number;
  readonly left: number;
  readonly right: number;
  /** Size of the whole view. */
  readonly width: number;
  readonly height: number;
}

/** NDC rectangle the framed box must fit in, and NDC point where the orbit target is drawn. */
export interface ViewFraming {
  readonly left: number;
  readonly right: number;
  readonly bottom: number;
  readonly top: number;
  readonly centerX: number;
  readonly centerY: number;
}

/** Whole-view framing: 5 % of the field around the desk. */
export const FRAMING_MARGIN = 1.05;
/** Fraction of the view height kept free at the bottom for the floating view bar (UX-14). */
export const FRAMING_BOTTOM_INSET = 0.1;
const SIDE_LENS_SHIFT = 0.3;
/**
 * Margin around the desk inside the free zone, CSS px. UX-8 asks for at least 24 px; 8 px more
 * absorb the damping of the controls and the rounding of the measured zone.
 */
export const FREE_ZONE_MARGIN_PX = 32;

/** Lens shift of the whole view for a tilt: bottom inset from above, 0.3 from the side. */
export function lensShiftFor(polar: number): number {
  const side = Math.sin(clamp(polar, 0, Math.PI / 2));
  return FRAMING_BOTTOM_INSET + (SIDE_LENS_SHIFT - FRAMING_BOTTOM_INSET) * side;
}

/**
 * Position of the target in the free height, from its centre (0) to its top (1): the same
 * proportion as the whole-view lens shift (0 from above, 0.22 from the side).
 */
function relativeShift(polar: number): number {
  return (lensShiftFor(polar) - FRAMING_BOTTOM_INSET) / (1 - FRAMING_BOTTOM_INSET);
}

const ndcX = (px: number, zone: ScreenZone) => (2 * px) / zone.width - 1;
const ndcY = (pxFromTop: number, zone: ScreenZone) => 1 - (2 * pxFromTop) / zone.height;

/** NDC bounds of the free zone minus the margin. */
function zoneLeft(zone: ScreenZone): number {
  return ndcX(zone.left + FREE_ZONE_MARGIN_PX, zone);
}
function zoneRight(zone: ScreenZone): number {
  return ndcX(zone.width - zone.right - FREE_ZONE_MARGIN_PX, zone);
}
function zoneTop(zone: ScreenZone): number {
  return ndcY(zone.top + FREE_ZONE_MARGIN_PX, zone);
}
function zoneBottom(zone: ScreenZone): number {
  return ndcY(zone.height * (1 - FRAMING_BOTTOM_INSET) - FREE_ZONE_MARGIN_PX, zone);
}

/**
 * A zone is used only when it is measured (positive size, finite insets) and leaves room for
 * the desk once the margins are taken; otherwise the whole view is framed.
 */
export function isUsableZone(zone: ScreenZone | null | undefined): zone is ScreenZone {
  if (!zone) return false;
  const { top, left, right, width, height } = zone;
  if (![top, left, right, width, height].every(Number.isFinite)) return false;
  if (width <= 0 || height <= 0 || top < 0 || left < 0 || right < 0) return false;
  return zoneRight(zone) > zoneLeft(zone) && zoneTop(zone) > zoneBottom(zone);
}

/**
 * Lens shift of a framing, as numbers (no allocation in the render loop): the target is drawn
 * at NDC x = `x`, y = `midY + halfY * k(tilt)`, k going from 0 (from above) to 0.22 (from the
 * side). Linear in its fields, so two lenses can be blended during a view transition.
 */
export interface Lens {
  x: number;
  midY: number;
  halfY: number;
}

export function createLens(): Lens {
  return { x: 0, midY: FRAMING_BOTTOM_INSET, halfY: 1 - FRAMING_BOTTOM_INSET };
}

/** Lens of a zone (whole view when it is not usable), written into `out`. */
export function lensInto(out: Lens, zone: ScreenZone | null): Lens {
  if (!isUsableZone(zone)) {
    out.x = 0;
    out.midY = FRAMING_BOTTOM_INSET;
    out.halfY = 1 - FRAMING_BOTTOM_INSET;
    return out;
  }
  const top = zoneTop(zone);
  const bottom = zoneBottom(zone);
  out.x = (zoneLeft(zone) + zoneRight(zone)) / 2;
  out.midY = (top + bottom) / 2;
  out.halfY = (top - bottom) / 2;
  return out;
}

/** `from` + (`to` - `from`) * t, written into `out`. */
export function blendLensInto(out: Lens, from: Lens, to: Lens, t: number): Lens {
  out.x = from.x + (to.x - from.x) * t;
  out.midY = from.midY + (to.midY - from.midY) * t;
  out.halfY = from.halfY + (to.halfY - from.halfY) * t;
  return out;
}

export function copyLensInto(out: Lens, from: Lens): Lens {
  return blendLensInto(out, from, from, 0);
}

/** NDC y where the target is drawn at this tilt. */
export function lensY(lens: Lens, polar: number): number {
  return lens.midY + lens.halfY * relativeShift(polar);
}

/** Framing of a view at this tilt, in the free zone when one is usable. */
export function framingFor(polar: number, zone: ScreenZone | null = null): ViewFraming {
  if (!isUsableZone(zone)) {
    const shift = lensShiftFor(polar);
    const m = FRAMING_MARGIN;
    return {
      left: -1 / m,
      right: 1 / m,
      bottom: shift - (1 + shift - 2 * FRAMING_BOTTOM_INSET) / m,
      top: shift + (1 - shift) / m,
      centerX: 0,
      centerY: shift,
    };
  }
  const lens = lensInto(createLens(), zone);
  return {
    left: zoneLeft(zone),
    right: zoneRight(zone),
    bottom: zoneBottom(zone),
    top: zoneTop(zone),
    centerX: lens.x,
    centerY: lensY(lens, polar),
  };
}
