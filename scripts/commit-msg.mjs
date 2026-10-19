// Conventional Commits check (lightweight; CI is the real gate).
import { readFileSync } from "node:fs";

const msg = readFileSync(process.argv[2] ?? ".git/COMMIT_EDITMSG", "utf8").split("\n")[0] ?? "";
const re = /^(feat|fix|test|ci|docs|chore|sec|asset|refactor|perf)(\([\w./-]+\))?!?: .+/;
if (!re.test(msg) && !/^Merge /.test(msg)) {
  console.error(`Invalid commit message (Conventional Commits expected): "${msg}"`);
  process.exit(1);
}
