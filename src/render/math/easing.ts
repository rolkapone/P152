/**
 * CSS-like cubic Bézier easing, so that view transitions use the same curve as the design
 * token `--ease-in-out` (docs/design/ui/tokens.css). Pure, no three.js import.
 */
export type Easing = (t: number) => number;

/** `cubic-bezier(x1, y1, x2, y2)` with x1, x2 in [0, 1], as in CSS. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;

  /**
   * Parameter s such that x(s) = x, by bisection: x(s) is monotonic for x1, x2 in [0, 1], and
   * 30 halvings (precision 1e-9) once per frame cost nothing.
   */
  function solve(x: number): number {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (sampleX(mid) < x) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return sampleY(solve(t));
  };
}

/** `--ease-in-out` of the design system: cubic-bezier(0.65, 0, 0.35, 1). */
export const EASE_IN_OUT: Easing = cubicBezier(0.65, 0, 0.35, 1);
