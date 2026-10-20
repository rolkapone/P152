/**
 * Unit conversion at the render boundary (architecture.md, "Repère et unités"): data and
 * catalog are in millimetres, the three.js scene in metres. Pure, no three.js import.
 */
export const MM_PER_M = 1000;

/** Millimetres (catalog, setup) to metres (scene units). */
export function mmToM(mm: number): number {
  return mm / MM_PER_M;
}

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
