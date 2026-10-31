// Size budget of the production bundle (US-005 T7, ADR-APP-11 "budget du shell", to be
// validated by the PO). Gzip sizes (zlib default level, as served by the host), in bytes
// (1 kB = 1000 B). Measured on 2026-10-31: main chunk 176.5 kB gz, 3D chunk 267.2 kB gz;
// ceilings about 10 % above. Used by scripts/check-bundle.mjs (pnpm check) and its test.
import { gzipSync } from "node:zlib";

export const BUDGETS = Object.freeze({
  /** Entry chunk: shell, React, React Aria, i18n, state (no three.js). */
  main: { pattern: /^index-[\w-]+\.js$/, maxGzipBytes: 195_000 },
  /** 3D chunk, loaded with lazy() after the shell: three.js, R3F, the scene. */
  scene: { pattern: /^SceneCanvas-[\w-]+\.js$/, maxGzipBytes: 295_000 },
});

export const gzipSize = (content) => gzipSync(content).length;

/**
 * Checks the chunks of dist/assets against the budgets.
 * @param {{ name: string, gzipBytes: number }[]} chunks
 * @param {string} indexHtml content of dist/index.html (the 3D chunk must stay lazy)
 * @returns {string[]} problems (empty when within budget)
 */
export function checkBudgets(chunks, indexHtml) {
  const problems = [];
  for (const [name, { pattern, maxGzipBytes }] of Object.entries(BUDGETS)) {
    const found = chunks.filter((chunk) => pattern.test(chunk.name));
    if (found.length !== 1) {
      problems.push(`${name} chunk: expected one file matching ${pattern}, found ${found.length}`);
      continue;
    }
    const [chunk] = found;
    if (chunk.gzipBytes > maxGzipBytes) {
      const kb = (bytes) => (bytes / 1000).toFixed(1);
      problems.push(
        `${name} chunk ${chunk.name}: ${kb(chunk.gzipBytes)} kB gz > budget ${kb(maxGzipBytes)} kB gz`,
      );
    }
    if (name === "scene" && indexHtml.includes(chunk.name)) {
      problems.push(`scene chunk ${chunk.name} is loaded by index.html: it must stay lazy`);
    }
  }
  return problems;
}
