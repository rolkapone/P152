import { expect, test } from "@playwright/test";
import { measurePerf, PERF_BUDGET, readPerf, STUDIO_BUDGET } from "./helpers/perf";

// US-004: base studio scene (desk only). The reference scene of ADR-3D-08 (desk + 20 objects)
// arrives with the objects (US-009+); the same budgets then apply to it.
test("base scene stays within draw call and triangle budgets", async ({ page }) => {
  await page.goto("/");
  const perf = await readPerf(page);
  expect(perf.drawCalls).toBeGreaterThan(0);
  expect(perf.drawCalls).toBeLessThanOrEqual(STUDIO_BUDGET.drawCalls);
  expect(perf.triangles).toBeLessThanOrEqual(STUDIO_BUDGET.triangles);
  expect(perf.drawCalls).toBeLessThanOrEqual(PERF_BUDGET.drawCalls);
  expect(perf.triangles).toBeLessThanOrEqual(PERF_BUDGET.triangles);
});

test("continuous rendering: counters within budget, frame rate reported", async ({ page }) => {
  await page.goto("/");
  const measure = await measurePerf(page, 2000);
  // Frame rate is informative only under SwiftShader (ADR-OPS-05): reported, not asserted.
  test.info().annotations.push({
    type: "perf",
    description: `fps=${measure.fps.toFixed(1)} avgFrameMs=${measure.avgFrameMs.toFixed(1)} maxFrameMs=${measure.maxFrameMs.toFixed(1)} drawCalls=${String(measure.drawCalls)} triangles=${String(measure.triangles)}`,
  });
  expect(measure.frames).toBeGreaterThan(0);
  expect(measure.drawCalls).toBeLessThanOrEqual(STUDIO_BUDGET.drawCalls);
  expect(measure.triangles).toBeLessThanOrEqual(STUDIO_BUDGET.triangles);
});
