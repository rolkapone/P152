/**
 * Caps applied to catalog data so that a wrong or malicious catalog file cannot ask the
 * GPU for unbounded work (threat model M-04, M-27). Generators (US-004+) import these too.
 */

/** Per object, ADR-3D-03. */
export const MAX_TRIS_PER_OBJECT = 10_000;
export const MAX_DRAW_CALLS_PER_OBJECT = 8;
/** Curve tessellation of the studio cyclorama. */
export const MAX_CYCLORAMA_SEGMENTS = 64;
export const ALLOWED_SHADOW_MAP_SIZES = [256, 512, 1024, 2048, 4096] as const;
export const MAX_SHADOW_BLUR_SAMPLES = 32;
export const MAX_SHADOW_RADIUS = 32;
export const MAX_DPR = 3;
/** Scene budgets, ADR-3D-08 (desktop, high tier). */
export const MAX_SCENE_DRAW_CALLS = 150;
export const MAX_SCENE_TRIANGLES = 300_000;
export const MAX_EMISSIVE_INTENSITY = 10;
export const MAX_LIGHT_INTENSITY = 10;
/** Studio scene (US-004): coordinates in metres, footprints in mm, procedural softboxes. */
export const MAX_SCENE_EXTENT_M = 100;
export const MAX_FOOTPRINT_MM = 5000;
export const MAX_SOFTBOXES = 8;
export const MAX_TRANSITION_MS = 5000;
