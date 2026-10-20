import type { SetupV1 } from "../schema/setupV1";

/** Canonical text form of a setup (export file and local storage share this format). */
export function serializeSetup(setup: SetupV1): string {
  return `${JSON.stringify(setup, null, 2)}\n`;
}
