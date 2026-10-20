/**
 * Schema migrations (ADR-3D-02): pure functions `vN -> vN+1`, applied in chain on read.
 * Key N holds the migration from version N to N+1. Empty while only v1 exists.
 * A migration receives an untrusted plain object (already free of prototype keys) and
 * returns a new object; the result is validated by the target schema afterwards.
 */
import { err, ok, type Result } from "../result";
import { CURRENT_SCHEMA_VERSION } from "./limits";

export type Migration = (doc: Readonly<Record<string, unknown>>) => Record<string, unknown>;

export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export function migrate(
  doc: Readonly<Record<string, unknown>>,
  fromVersion: number,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  targetVersion: number = CURRENT_SCHEMA_VERSION,
): Result<Record<string, unknown>, { readonly fromVersion: number }> {
  let current: Record<string, unknown> = { ...doc };
  for (let version = fromVersion; version < targetVersion; version++) {
    const step = Object.hasOwn(migrations, version) ? migrations[version] : undefined;
    if (step === undefined) return err({ fromVersion: version });
    try {
      current = { ...step(current), schemaVersion: version + 1 };
    } catch {
      return err({ fromVersion: version });
    }
  }
  return ok(current);
}
