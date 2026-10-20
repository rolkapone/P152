import type { JsonPath } from "./guard";

const SAFE_SEGMENT = /^[A-Za-z0-9_]{1,32}$/;
const MAX_PATH_LENGTH = 120;

/**
 * Formats a JSON path for error messages, e.g. `objects[3].params.width`.
 * Untrusted keys are never echoed: a segment that is not a short identifier becomes `?`,
 * and the result is truncated. Errors must not reflect the file content (ADR-APP-03).
 */
export function formatJsonPath(path: readonly PropertyKey[]): string {
  let out = "";
  for (const segment of path) {
    if (typeof segment === "number") out += `[${String(segment)}]`;
    else {
      const name = typeof segment === "string" && SAFE_SEGMENT.test(segment) ? segment : "?";
      out += out === "" ? name : `.${name}`;
    }
  }
  return out.length > MAX_PATH_LENGTH ? `${out.slice(0, MAX_PATH_LENGTH - 1)}…` : out;
}

export type { JsonPath };
