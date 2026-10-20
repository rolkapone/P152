/**
 * Single entry point to Zod inside `core/` (enforced by ESLint).
 * `jitless`: Zod never generates code with `new Function`, so validation works under a
 * CSP without `unsafe-eval` (ADR-APP-03, ADR-OPS-06). Imported first by every schema.
 */
import * as z from "zod";

z.config({ jitless: true });

export { z };
