/**
 * Seamless studio cyclorama (docs/design/3d/US-004-scene.md): one strip, floor curving into
 * the back wall, profile in (z, y). Returns raw buffers; render/scene/Studio.tsx wraps them
 * in a BufferGeometry. Pure, tested in Node.
 */
export interface CycloramaParams {
  readonly floorEndZ: number;
  readonly curveStartZ: number;
  readonly radius: number;
  readonly wallHeight: number;
  readonly halfWidthX: number;
  readonly segments: number;
}

export interface MeshBuffers {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint16Array;
}

/** Profile points (z, y): floor front edge, curve start, quarter circle, wall top. */
export function cycloramaProfile(p: CycloramaParams): [number, number][] {
  const points: [number, number][] = [
    [p.floorEndZ, 0],
    [p.curveStartZ, 0],
  ];
  for (let i = 1; i <= p.segments; i++) {
    const t = ((i / p.segments) * Math.PI) / 2;
    points.push([p.curveStartZ - p.radius * Math.sin(t), p.radius - p.radius * Math.cos(t)]);
  }
  points.push([p.curveStartZ - p.radius, p.wallHeight]);
  return points;
}

export function cycloramaBuffers(p: CycloramaParams): MeshBuffers {
  const profile = cycloramaProfile(p);
  const positions = new Float32Array(profile.length * 2 * 3);
  const normals = new Float32Array(profile.length * 2 * 3);
  profile.forEach(([z, y], i) => {
    const a = profile[Math.max(i - 1, 0)]!;
    const b = profile[Math.min(i + 1, profile.length - 1)]!;
    let tz = b[0] - a[0];
    let ty = b[1] - a[1];
    const length = Math.hypot(tz, ty);
    tz /= length;
    ty /= length;
    // The profile runs from +Z (front) to the wall: the inner normal is (y, z) = (-tz, ty).
    for (const [side, x] of [-p.halfWidthX, p.halfWidthX].entries()) {
      const k = (i * 2 + side) * 3;
      positions.set([x, y, z], k);
      normals.set([0, -tz, ty], k);
    }
  });
  const indices = new Uint16Array((profile.length - 1) * 6);
  for (let i = 0; i < profile.length - 1; i++) {
    const a = i * 2;
    indices.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6);
  }
  return { positions, normals, indices };
}

export function triangleCount(buffers: MeshBuffers): number {
  return buffers.indices.length / 3;
}
