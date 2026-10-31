// Guards of the production bundle (pnpm check, CI):
// - no E2E/perf test hooks (ADR-OPS-03);
// - size budget of the main and 3D chunks, the 3D chunk staying lazy (US-005 T7, ADR-APP-11).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { checkBudgets, gzipSize } from "../config/bundle-budget.mjs";

const FORBIDDEN = ["__p152test", "__p152perf", "VITE_E2E"];
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk("dist");
const hits = files
  .filter((f) => /\.(js|html|css)$/.test(f))
  .filter((f) => FORBIDDEN.some((s) => readFileSync(f, "utf8").includes(s)));
if (hits.length > 0) {
  console.error("Test hooks found in production bundle:\n" + hits.join("\n"));
  process.exit(1);
}

const chunks = files
  .filter((f) => f.endsWith(".js"))
  .map((f) => ({ name: basename(f), gzipBytes: gzipSize(readFileSync(f)) }));
const problems = checkBudgets(chunks, readFileSync(join("dist", "index.html"), "utf8"));
if (problems.length > 0) {
  console.error("Bundle size budget exceeded (ADR-APP-11):\n" + problems.join("\n"));
  process.exit(1);
}
const sizes = chunks.map((c) => `${c.name} ${(c.gzipBytes / 1000).toFixed(1)} kB gz`).join(", ");
console.log(`check-bundle: OK (${sizes})`);
