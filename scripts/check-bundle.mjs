// Guard: no E2E/perf test hooks in the production bundle (ADR-OPS-03).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = ["__p152test", "__p152perf", "VITE_E2E"];
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const hits = walk("dist")
  .filter((f) => /\.(js|html|css)$/.test(f))
  .filter((f) => FORBIDDEN.some((s) => readFileSync(f, "utf8").includes(s)));
if (hits.length > 0) {
  console.error("Test hooks found in production bundle:\n" + hits.join("\n"));
  process.exit(1);
}
console.log("check-bundle: OK");
