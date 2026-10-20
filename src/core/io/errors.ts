/**
 * Errors of the untrusted-input pipeline. Each code maps to the i18n key
 * `errors:import.<code>`; `path` is a sanitised, truncated JSON path. Neither ever
 * contains file content (ADR-APP-03).
 */
export const IMPORT_ERROR_CODES = [
  "tooLarge",
  "notJson",
  "forbiddenKey",
  "tooDeep",
  "notSetup",
  "newerVersion",
  "unsupportedVersion",
  "migrationFailed",
  "tooManyObjects",
  "invalid",
  "unknownCatalogItem",
  "catalogVersionMismatch",
  "typeMismatch",
  "unknownParam",
  "invalidParam",
  "duplicateId",
  "invalidMount",
  "invalidMaterial",
  "unknownStyle",
] as const;

export type ImportErrorCode = (typeof IMPORT_ERROR_CODES)[number];

export interface ImportError {
  readonly code: ImportErrorCode;
  /** e.g. `objects[3].params.width`; empty when the whole document is concerned. */
  readonly path: string;
}

export function importError(code: ImportErrorCode, path = ""): ImportError {
  return { code, path };
}
