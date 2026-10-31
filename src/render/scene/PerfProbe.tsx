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
 *   now, for the framing test in the free zone (US-005 UX-8).
 */
import { addAfterEffect, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Box3, Vector3 } from "three";
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
    const stop = addAfterEffect(() => {
      frames += 1;
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
    const deskRect = (): ScreenRect | null => {
      // The desk itself (top and legs), not its soft contact shadow.
      const parts = ["desk-top", "desk-legs"].map((name) => scene.getObjectByName(name));
      if (parts.some((part) => part === undefined)) return null;
      camera.updateMatrixWorld();
      const box = new Box3();
      for (const part of parts) if (part) box.expandByObject(part);
      const { clientWidth: width, clientHeight: height } = gl.domElement;
      const rect = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      const point = new Vector3();
      for (const x of [box.min.x, box.max.x]) {
        for (const y of [box.min.y, box.max.y]) {
          for (const z of [box.min.z, box.max.z]) {
            point.set(x, y, z).project(camera);
            const px = ((point.x + 1) / 2) * width;
            const py = ((1 - point.y) / 2) * height;
            rect.left = Math.min(rect.left, px);
            rect.right = Math.max(rect.right, px);
            rect.top = Math.min(rect.top, py);
            rect.bottom = Math.max(rect.bottom, py);
          }
        }
      }
      return rect;
    };

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
        return gl.info.memory.geometries;
      },
      get textures() {
        return gl.info.memory.textures;
      },
      get dpr() {
        return gl.getPixelRatio();
      },
      measure,
      deskRect,
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
