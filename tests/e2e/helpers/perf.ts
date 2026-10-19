import type { Page } from "@playwright/test";

/** Contrat attendu de window.__p152perf (build E2E uniquement, ADR-APP-08). À aligner sur l'implémentation. */
export interface P152Perf {
  drawCalls: number;
  triangles: number;
}

/** Budgets déterministes vérifiés en CI (les FPS ne le sont pas : SwiftShader, ADR-OPS-05). */
export const PERF_BUDGET = { drawCalls: 100, triangles: 500_000 } as const; // TODO (graphics-engineer): valeurs de docs/architecture.md

/** Attend que le hook soit exposé puis lit les compteurs de rendu. */
export async function readPerf(page: Page): Promise<P152Perf> {
  await page.waitForFunction(() => "__p152perf" in window);
  const perf = await page.evaluate(() => {
    const p = (window as unknown as { __p152perf?: Partial<P152Perf> }).__p152perf;
    return p ? { drawCalls: p.drawCalls, triangles: p.triangles } : undefined;
  });
  if (typeof perf?.drawCalls !== "number" || typeof perf.triangles !== "number") {
    throw new Error("window.__p152perf absent ou sans drawCalls/triangles numériques");
  }
  return { drawCalls: perf.drawCalls, triangles: perf.triangles };
}
