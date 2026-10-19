import { expect, test } from "@playwright/test";
import { PERF_BUDGET, readPerf } from "./helpers/perf";

// TODO (qa-tester): activer quand la scène de référence (bureau + 20 objets) et window.__p152perf existent.
test.fixme("reference scene stays within draw call and triangle budgets", async ({ page }) => {
  await page.goto("/");
  const perf = await readPerf(page);
  expect(perf.drawCalls).toBeLessThanOrEqual(PERF_BUDGET.drawCalls);
  expect(perf.triangles).toBeLessThanOrEqual(PERF_BUDGET.triangles);
});
