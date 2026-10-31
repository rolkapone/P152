/**
 * `window.__p152perf` (ADR-3D-08, ADR-APP-08): render counters for the E2E perf test.
 * Loaded ONLY in the E2E build (VITE_E2E === "true", see SceneCanvas.tsx); absent from the
 * production bundle (checked by scripts/check-bundle.mjs).
 *
 * - `drawCalls`, `triangles`: worst frame since the last `measure()` / page load, shadow
 *   pass included (renderer.info, reset at each frame);
 * - `measure(ms)`: renders continuously for `ms` (shadow pass included once) and returns the
 *   frame rate and the worst counters, because the scene is otherwise rendered on demand;
 * - `deskRect()`: screen rectangle of the desk (CSS px of the canvas) as the camera draws it
 *   now, for the framing test in the free zone (US-005 UX-8), from the vertices of the desk
 *   (an L-shaped desk is not its bounding box);
 * - `geometries`, `textures`: GPU memory counted after the last rendered frame;
 * - `deskSize()`: size of the desk drawn (mm, bounding box of top and legs, US-006 UX-10);
 * - `viewDirection()`: unit direction of the camera (orientation kept after a change of desk).
 * The desk is changed through the Desk panel in the E2E tests (US-006), never through here.
 */
import { addAfterEffect, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Box3, Vector3, type Mesh } from "three";
import { requestShadowUpdate } from "./imperative";

export interface PerfMeasure {
  readonly fps: number;
  readonly frames: number;
  readonly avgFrameMs: number;
  readonly maxFrameMs: number;
  readonly drawCalls: number;
  readonly triangles: number;
}

export interface ScreenRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface P152Perf {
  readonly drawCalls: number;
  readonly triangles: number;
  readonly frames: number;
  readonly geometries: number;
  readonly textures: number;
  readonly dpr: number;
  measure(durationMs?: number): Promise<PerfMeasure>;
  deskRect(): ScreenRect | null;
  deskSize(): { width: number; depth: number; height: number } | null;
  viewDirection(): [number, number, number];
}

declare global {
  interface Window {
    __p152perf?: P152Perf;
  }
}

export default function PerfProbe() {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    let frames = 0;
    let drawCalls = 0;
    let triangles = 0;
    // GPU memory after the last rendered frame: between a change and the next frame the
    // disposed geometries are gone but the new ones are not uploaded yet.
    let geometries = 0;
    let textures = 0;
    const stop = addAfterEffect(() => {
      frames += 1;
      geometries = gl.info.memory.geometries;
      textures = gl.info.memory.textures;
      drawCalls = Math.max(drawCalls, gl.info.render.calls);
      triangles = Math.max(triangles, gl.info.render.triangles);
    });

    const measure = (durationMs = 2000): Promise<PerfMeasure> =>
      new Promise((resolve) => {
        drawCalls = 0;
        triangles = 0;
        requestShadowUpdate(gl);
        const startFrames = frames;
        const start = performance.now();
        let last = start;
        let maxFrameMs = 0;
        const tick = (now: number) => {
          maxFrameMs = Math.max(maxFrameMs, now - last);
          last = now;
          if (now - start < durationMs) {
            invalidate();
            requestAnimationFrame(tick);
            return;
          }
          const count = frames - startFrames;
          const seconds = (now - start) / 1000;
          resolve({
            fps: count / seconds,
            frames: count,
            avgFrameMs: (seconds * 1000) / Math.max(count, 1),
            maxFrameMs,
            drawCalls,
            triangles,
          });
        };
        invalidate();
        requestAnimationFrame(tick);
      });

    // Called by the test only (allocations are fine here, never in the render loop).
    const deskParts = (): Mesh[] | null => {
      // The desk itself (top and legs), not its soft contact shadow.
      const parts = ["desk-top", "desk-legs"].map((name) => scene.getObjectByName(name));
      return parts.every((part) => part !== undefined) ? (parts as Mesh[]) : null;
    };

    const deskRect = (): ScreenRect | null => {
      const parts = deskParts();
      if (parts === null) return null;
      camera.updateMatrixWorld();
      const { clientWidth: width, clientHeight: height } = gl.domElement;
      const rect = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      const point = new Vector3();
      for (const part of parts) {
        part.updateMatrixWorld();
        const position = part.geometry.getAttribute("position");
        for (let i = 0; i < position.count; i++) {
          point.fromBufferAttribute(position, i).applyMatrix4(part.matrixWorld).project(camera);
          const px = ((point.x + 1) / 2) * width;
          const py = ((1 - point.y) / 2) * height;
          rect.left = Math.min(rect.left, px);
          rect.right = Math.max(rect.right, px);
          rect.top = Math.min(rect.top, py);
          rect.bottom = Math.max(rect.bottom, py);
        }
      }
      return rect;
    };

    const deskSize = () => {
      const parts = deskParts();
      if (parts === null) return null;
      const box = new Box3();
      for (const part of parts) box.expandByObject(part, true);
      const size = box.getSize(new Vector3()).multiplyScalar(1000);
      return { width: size.x, depth: size.z, height: size.y };
    };

    const viewDirection = (): [number, number, number] =>
      camera.getWorldDirection(new Vector3()).toArray();

    window.__p152perf = {
      get drawCalls() {
        return drawCalls;
      },
      get triangles() {
        return triangles;
      },
      get frames() {
        return frames;
      },
      get geometries() {
        return geometries;
      },
      get textures() {
        return textures;
      },
      get dpr() {
        return gl.getPixelRatio();
      },
      measure,
      deskRect,
      deskSize,
      viewDirection,
    };
    // The probe arrives after the first frames: render one full frame (shadow pass included).
    requestShadowUpdate(gl);
    invalidate();
    return () => {
      stop();
      delete window.__p152perf;
    };
  }, [gl, invalidate, camera, scene]);

  return null;
}
