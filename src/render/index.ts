/**
 * Public API of render/ (ADR-APP-07): the 3D view component and browser helpers. Everything
 * that imports three.js stays behind the lazy chunk of `Viewport`.
 */
export { Viewport, type ViewportProps } from "./Viewport";
export { detectWebGL2, usePrefersReducedMotion, useTheme } from "./environment";
