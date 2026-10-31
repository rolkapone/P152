// Vitest setup file: every fast-check property runs with the same seed, so unit tests and CI
// are reproducible (no real-time randomness). Explore locally with another seed:
// FC_SEED=123456 pnpm test (any 32-bit integer). A test may still pin its own `seed`.
import fc from "fast-check";

/** Default seed of every property run, unless FC_SEED overrides it. */
export const DEFAULT_FC_SEED = 20261031;

/** Reads FC_SEED: unset or empty -> default seed; otherwise a 32-bit integer, else an error. */
export function resolveFcSeed(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return DEFAULT_FC_SEED;
  const seed = Number(raw);
  if (!Number.isSafeInteger(seed) || seed < -(2 ** 31) || seed >= 2 ** 32) {
    throw new Error(`FC_SEED must be a 32-bit integer, got "${raw}"`);
  }
  return seed;
}

fc.configureGlobal({ ...fc.readConfigureGlobal(), seed: resolveFcSeed(process.env["FC_SEED"]) });
