/**
 * `window.__p152perf` (ADR-3D-08, ADR-APP-08): render counters for the E2E perf test.
 * Loaded ONLY in the E2E build (VITE_E2E === "true", see SceneCanvas.tsx); absent from the
 * production bundle (checked by scripts/check-bundle.mjs).
 *
 * - `drawCalls`, `triangles`: worst frame since the last `measure()` / page load, shadow
 *   pass included (renderer.info, reset at each frame);
 * - `measure(ms)`: renders continuously for `ms` (shadow pass included once) and returns the
 *   frame rate and the worst counters, because the scene is otherwise rendered on demand.
 */
import { addAfterEffect, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { requestShadowUpdate } from "./imperative";

export interface PerfMeasure {
  readonly fps: number;
  readonly frames: number;
  readonly avgFrameMs: number;
  readonly maxFrameMs: number;
  readonly drawCalls: number;
  readonly triangles: number;
}

export interface P152Perf {
  readonly drawCalls: number;
  readonly triangles: number;
  readonly frames: number;
  readonly geometries: number;
  readonly textures: number;
  readonly dpr: number;
  measure(durationMs?: number): Promise<PerfMeasure>;
}

declare global {
  interface Window {
    __p152perf?: P152Perf;
  }
}

export default function PerfProbe() {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);

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
    };
    // The probe arrives after the first frames: render one full frame (shadow pass included).
    requestShadowUpdate(gl);
    invalidate();
    return () => {
      stop();
      delete window.__p152perf;
    };
  }, [gl, invalidate]);

  return null;
}
