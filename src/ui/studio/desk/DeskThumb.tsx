/**
 * Top plan of a desk for its line of the list (UX US-006 UX-9, design-system.md §16): drawn
 * in SVG by the UI from the real outline of the desk (`deskOutline`, millimetres), at a scale
 * common to every line (a 180 looks larger than a 120), decorative (`aria-hidden`). Fill and
 * contour in `currentColor` (DeskPanel.module.css): the L of a corner desk reads without
 * colour.
 */
import { deskOutline, type DeskSpec } from "../../../core";
import { cx } from "../../components/cx";
import styles from "./DeskPanel.module.css";

/** Drawing box in SVG units, the CSS size of the thumbnail (`--thumb-w` x `--thumb-h`). */
export const THUMB_BOX = { width: 56, height: 44 } as const;
/** Room kept for the contour (stroke width of DeskPanel.module.css): never clipped. */
const CONTOUR = 1.4;

/** SVG units per millimetre so that the largest desk of the list fills the box. */
export function thumbScale(desks: readonly DeskSpec[]): number {
  const width = Math.max(...desks.map((desk) => desk.widthMm));
  const depth = Math.max(...desks.map((desk) => desk.depthMm));
  if (!(width > 0 && depth > 0)) return 0;
  return Math.min((THUMB_BOX.width - CONTOUR) / width, (THUMB_BOX.height - CONTOUR) / depth);
}

/** Outline points of the desk in the box, centred, +z (towards the user) downwards. */
export function thumbPoints(desk: DeskSpec, scale: number): string {
  const cx0 = THUMB_BOX.width / 2;
  const cy0 = THUMB_BOX.height / 2;
  const round = (value: number) => Math.round(value * 100) / 100;
  return deskOutline(desk)
    .map(([x, z]) => `${String(round(cx0 + x * scale))},${String(round(cy0 + z * scale))}`)
    .join(" ");
}

export interface DeskThumbProps {
  readonly desk: DeskSpec;
  readonly scale: number;
}

export function DeskThumb({ desk, scale }: DeskThumbProps) {
  return (
    <svg
      className={cx(styles.thumb)}
      viewBox={`0 0 ${String(THUMB_BOX.width)} ${String(THUMB_BOX.height)}`}
      aria-hidden="true"
      focusable="false"
      data-shape={desk.shape}
    >
      <polygon className={cx(styles.plan)} points={thumbPoints(desk, scale)} />
    </svg>
  );
}
