// Fails if a tracked file > 1 MiB is not stored through Git LFS (ADR-OPS-04).
// Per-asset budgets (assets/catalog/budgets.json, technical-artist) are added with the first assets.
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";

const LIMIT = 1024 * 1024;
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const lfs = new Set(
  execFileSync("git", ["lfs", "ls-files", "-n"], { encoding: "utf8" }).split("\n").filter(Boolean),
);
const bad = files.filter((f) => {
  try {
    return statSync(f).size > LIMIT && !lfs.has(f);
  } catch {
    return false;
  }
});
if (bad.length > 0) {
  console.error("Files > 1 MiB tracked outside Git LFS:\n" + bad.join("\n"));
  process.exit(1);
}
console.log(`check-assets: OK (${files.length} tracked files)`);
