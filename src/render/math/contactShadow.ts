/**
 * Soft contact shadow texture (docs/design/3d/US-004-scene.md): a rounded-rectangle alpha
 * gradient, generated once in code and shared by every contact plane. The gradient core
 * covers `CONTACT_CORE` of the plane, so a plane is 1 / CONTACT_CORE larger than the
 * footprint it darkens. Pure (RGBA bytes), tested in Node.
 */
export const CONTACT_CORE = 0.62;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** RGBA bytes (black, alpha = shadow) of a `size` x `size` texture. */
export function contactShadowPixels(size = 128): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  const r = 0.18;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const px = Math.abs(((i + 0.5) / size) * 2 - 1) - CONTACT_CORE;
      const py = Math.abs(((j + 0.5) / size) * 2 - 1) - CONTACT_CORE;
      const qx = px + r;
      const qy = py + r;
      const distance =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      const alpha = Math.pow(1 - smoothstep(-0.08, 0.38, distance), 1.6);
      data[(j * size + i) * 4 + 3] = Math.round(255 * alpha);
    }
  }
  return data;
}
