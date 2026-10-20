import type { Page } from "@playwright/test";

/** Contract of window.__p152perf (E2E build only, ADR-APP-08), see src/render/scene/PerfProbe.tsx. */
export interface P152Perf {
  /** Worst frame since page load or the last measure(), shadow pass included. */
  drawCalls: number;
  triangles: number;
}

export interface PerfMeasure extends P152Perf {
  fps: number;
  frames: number;
  avgFrameMs: number;
  maxFrameMs: number;
}

/**
 * Deterministic budgets checked in CI (frame rates are not: SwiftShader, ADR-OPS-05).
 * - ADR-3D-08, desktop "high" tier, reference scene (desk + 20 objects): 150 draw calls, 300 k triangles.
 * - Base studio scene of US-004 (empty desk), assets/catalog/scene/studio.json `perf.budget`.
 */
export const PERF_BUDGET = { drawCalls: 150, triangles: 300_000 } as const;
export const STUDIO_BUDGET = { drawCalls: 20, triangles: 8_000 } as const;

/**
 * Waits for the 3D view to be ready, then for the hook. No own delay: the wait is bounded by
 * the test timeout (playwright.config.ts), so a slow cold start does not fail a test that
 * still has time left (the suite is also warmed up by global-setup.ts).
 */
export async function waitForScene(page: Page): Promise<void> {
  await page.locator('[data-scene-status="ready"]').waitFor({ timeout: 0 });
  await page.waitForFunction(
    () => ((window as unknown as { __p152perf?: { frames: number } }).__p152perf?.frames ?? 0) > 0,
  );
}

/** Reads the render counters (worst frame so far). */
export async function readPerf(page: Page): Promise<P152Perf> {
  await waitForScene(page);
  const perf = await page.evaluate(() => {
    const p = (window as unknown as { __p152perf?: Partial<P152Perf> }).__p152perf;
    return p ? { drawCalls: p.drawCalls, triangles: p.triangles } : undefined;
  });
  if (typeof perf?.drawCalls !== "number" || typeof perf.triangles !== "number") {
    throw new Error("window.__p152perf absent ou sans drawCalls/triangles numériques");
  }
  return { drawCalls: perf.drawCalls, triangles: perf.triangles };
}

/** Renders continuously for `ms` and returns frame rate + worst counters. */
export async function measurePerf(page: Page, ms = 2000): Promise<PerfMeasure> {
  await waitForScene(page);
  return page.evaluate(
    (duration) =>
      (
        window as unknown as { __p152perf: { measure(ms: number): Promise<PerfMeasure> } }
      ).__p152perf.measure(duration),
    ms,
  );
}
