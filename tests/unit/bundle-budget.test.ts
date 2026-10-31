// Size budget of the bundle (US-005 T7, ADR-APP-11): the checker used by `pnpm check:bundle`.
import { describe, expect, it } from "vitest";
import { BUDGETS, checkBudgets, gzipSize } from "../../config/bundle-budget.mjs";

const HTML = '<script type="module" src="/assets/index-AbC123.js"></script>';
const chunks = (main: number, scene: number) => [
  { name: "index-AbC123.js", gzipBytes: main },
  { name: "SceneCanvas-XyZ789.js", gzipBytes: scene },
  { name: "PerfProbe-Q1.js", gzipBytes: 999_999 }, // other chunks are free
];

describe("bundle size budget", () => {
  it("has ceilings about 10 % above the measured sizes (176.5 and 267.2 kB gz)", () => {
    expect(BUDGETS.main.maxGzipBytes).toBe(195_000);
    expect(BUDGETS.scene.maxGzipBytes).toBe(295_000);
    expect(BUDGETS.main.maxGzipBytes / 176_500).toBeGreaterThan(1.08);
    expect(BUDGETS.scene.maxGzipBytes / 267_200).toBeLessThan(1.12);
  });

  it("passes within budget, at the ceiling included", () => {
    expect(checkBudgets(chunks(176_500, 267_200), HTML)).toEqual([]);
    expect(checkBudgets(chunks(195_000, 295_000), HTML)).toEqual([]);
  });

  it("fails when the main chunk or the 3D chunk is over its ceiling", () => {
    expect(checkBudgets(chunks(195_001, 1), HTML)).toEqual([
      "main chunk index-AbC123.js: 195.0 kB gz > budget 195.0 kB gz",
    ]);
    const [problem] = checkBudgets(chunks(1, 300_000), HTML);
    expect(problem).toMatch(/^scene chunk SceneCanvas-XyZ789\.js: 300\.0 kB gz > budget 295\.0/);
  });

  it("fails when the 3D chunk is missing (no longer lazy) or loaded by index.html", () => {
    expect(checkBudgets([{ name: "index-AbC123.js", gzipBytes: 1 }], HTML)).toEqual([
      "scene chunk: expected one file matching /^SceneCanvas-[\\w-]+\\.js$/, found 0",
    ]);
    const eager = `${HTML}<link rel="modulepreload" href="/assets/SceneCanvas-XyZ789.js">`;
    expect(checkBudgets(chunks(1, 1), eager)).toEqual([
      "scene chunk SceneCanvas-XyZ789.js is loaded by index.html: it must stay lazy",
    ]);
  });

  it("measures gzip sizes", () => {
    expect(gzipSize("a".repeat(10_000))).toBeLessThan(100);
  });
});
