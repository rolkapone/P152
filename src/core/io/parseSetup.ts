/**
 * Single trust pipeline for setup documents (ADR-APP-03, threat model SR-01):
 * local storage, imported files, other tabs and, later, share links all go through
 * `parseSetup`. It never throws on any input; it returns a `Result`.
 *
 * 1. size (declared size before reading, then UTF-8 length) <= 1 MiB
 * 2. JSON.parse (no reviver)
 * 3. structure guard: no `__proto__` / `constructor` / `prototype` key, bounded depth
 * 4. envelope: format and integer schemaVersion (newer / unsupported versions refused)
 * 5. migrations to the current version
 * 6. strict schema (<= 50 objects, bounded numbers and strings)
 * 7. semantic checks against the catalog (ids, bounds, enums, materials, mounts, style)
 * 8. normalisation (missing params filled with catalog defaults, canonical key order)
 */
import type { Catalog } from "../catalog/validate";
import { DESK_TYPE } from "../catalog/validate";
import { isValidParamValue } from "../catalog/params";
import type { ObjectType } from "../catalog/schema";
import { deepFreeze } from "../json/freeze";
import { inspectJsonTree, isPlainRecord } from "../json/guard";
import { formatJsonPath } from "../json/path";
import { err, ok, type Result } from "../result";
import {
  CURRENT_SCHEMA_VERSION,
  MAX_JSON_DEPTH,
  MAX_OBJECTS,
  MAX_SETUP_BYTES,
  MIN_SUPPORTED_SCHEMA_VERSION,
  SETUP_FORMAT,
} from "../schema/limits";
import { migrate } from "../schema/migrations";
import { SetupV1Schema, type ParamValue, type SetupV1 } from "../schema/setupV1";
import { importError, type ImportError } from "./errors";
import { utf8ByteLength } from "./utf8";

export interface ParseSetupOptions {
  /** Size announced by the source (e.g. `File.size`), checked before anything else. */
  readonly declaredBytes?: number;
}

/** To call on `File.size` before reading the file at all. */
export function checkDeclaredSize(bytes: number): ImportError | null {
  return Number.isFinite(bytes) && bytes >= 0 && bytes <= MAX_SETUP_BYTES
    ? null
    : importError("tooLarge");
}

type Path = readonly (string | number)[];

function checkParams(
  params: Readonly<Record<string, ParamValue>>,
  entry: ObjectType,
  base: Path,
): ImportError | null {
  for (const [key, value] of Object.entries(params)) {
    const def = Object.hasOwn(entry.params, key) ? entry.params[key] : undefined;
    const path = formatJsonPath([...base, "params", key]);
    if (def === undefined) return importError("unknownParam", path);
    if (!isValidParamValue(def, value)) return importError("invalidParam", path);
  }
  return null;
}

function checkMaterials(
  materials: Readonly<Record<string, string>>,
  entry: ObjectType,
  catalog: Catalog,
  base: Path,
): ImportError | null {
  for (const [slot, materialId] of Object.entries(materials)) {
    if (!entry.slots.some((s) => s.id === slot) || !catalog.materials.has(materialId)) {
      return importError("invalidMaterial", formatJsonPath([...base, "materials", slot]));
    }
  }
  return null;
}

function checkEntry(
  item: {
    readonly catalogId: string;
    readonly catalogVersion: number;
    readonly params: Readonly<Record<string, ParamValue>>;
    readonly materials: Readonly<Record<string, string>>;
  },
  expectedType: string | null,
  catalog: Catalog,
  base: Path,
): ImportError | null {
  const entry = catalog.objectTypes.get(item.catalogId);
  if (entry === undefined) {
    return importError("unknownCatalogItem", formatJsonPath([...base, "catalogId"]));
  }
  const isDesk = entry.type === DESK_TYPE;
  const typeOk = expectedType === null ? isDesk : !isDesk && entry.type === expectedType;
  if (!typeOk) return importError("typeMismatch", formatJsonPath([...base, "catalogId"]));
  if (entry.version !== item.catalogVersion) {
    return importError("catalogVersionMismatch", formatJsonPath([...base, "catalogVersion"]));
  }
  return (
    checkParams(item.params, entry, base) ?? checkMaterials(item.materials, entry, catalog, base)
  );
}

function checkMounts(setup: SetupV1): ImportError | null {
  const parents = new Map<string, string | null>();
  for (const [index, object] of setup.objects.entries()) {
    if (parents.has(object.id)) {
      return importError("duplicateId", formatJsonPath(["objects", index, "id"]));
    }
    parents.set(object.id, object.mount?.parentId ?? null);
  }
  for (const [index, object] of setup.objects.entries()) {
    if (object.mount === null) continue;
    const path = formatJsonPath(["objects", index, "mount", "parentId"]);
    // Walk up the chain: more steps than objects means a cycle.
    let current: string | null = object.id;
    for (let steps = 0; current !== null; steps++) {
      const parent: string | null | undefined = parents.get(current);
      if (parent === undefined || steps > setup.objects.length) {
        return importError("invalidMount", path);
      }
      current = parent;
    }
  }
  return null;
}

function checkAgainstCatalog(setup: SetupV1, catalog: Catalog): ImportError | null {
  const deskError = checkEntry(setup.desk, null, catalog, ["desk"]);
  if (deskError !== null) return deskError;
  for (const [index, object] of setup.objects.entries()) {
    const objectError = checkEntry(object, object.type, catalog, ["objects", index]);
    if (objectError !== null) return objectError;
  }
  const mountError = checkMounts(setup);
  if (mountError !== null) return mountError;
  const style = setup.environment.stylePreset;
  if (style !== null && !catalog.styles.has(style)) {
    return importError("unknownStyle", "environment.stylePreset");
  }
  return null;
}

function withDefaults(
  params: Readonly<Record<string, ParamValue>>,
  catalogId: string,
  catalog: Catalog,
): Record<string, ParamValue> {
  const entry = catalog.objectTypes.get(catalogId);
  if (entry === undefined) return { ...params };
  const out: Record<string, ParamValue> = {};
  for (const [key, def] of Object.entries(entry.params)) {
    const given = Object.hasOwn(params, key) ? params[key] : undefined;
    out[key] = given ?? def.default;
  }
  return out;
}

function normalize(setup: SetupV1, catalog: Catalog): SetupV1 {
  return {
    ...setup,
    desk: { ...setup.desk, params: withDefaults(setup.desk.params, setup.desk.catalogId, catalog) },
    objects: setup.objects.map((object) => ({
      ...object,
      params: withDefaults(object.params, object.catalogId, catalog),
    })),
  };
}

function parseDocument(raw: unknown, catalog: Catalog): Result<SetupV1, ImportError> {
  const guard = inspectJsonTree(raw, MAX_JSON_DEPTH);
  if (guard !== null) {
    const code = guard.code === "tooDeep" ? "tooDeep" : "forbiddenKey";
    return err(importError(code, formatJsonPath(guard.path)));
  }
  if (!isPlainRecord(raw) || raw["format"] !== SETUP_FORMAT) {
    return err(importError("notSetup"));
  }
  const version = raw["schemaVersion"];
  if (typeof version !== "number" || !Number.isInteger(version)) {
    return err(importError("notSetup", "schemaVersion"));
  }
  if (version > CURRENT_SCHEMA_VERSION) return err(importError("newerVersion", "schemaVersion"));
  if (version < MIN_SUPPORTED_SCHEMA_VERSION) {
    return err(importError("unsupportedVersion", "schemaVersion"));
  }

  const migrated = migrate(raw, version);
  if (!migrated.ok) return err(importError("migrationFailed", "schemaVersion"));
  const doc = migrated.value;

  const objects = doc["objects"];
  if (Array.isArray(objects) && objects.length > MAX_OBJECTS) {
    return err(importError("tooManyObjects", "objects"));
  }

  const parsed = SetupV1Schema.safeParse(doc);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return err(importError("invalid", issue === undefined ? "" : formatJsonPath(issue.path)));
  }

  const semanticError = checkAgainstCatalog(parsed.data, catalog);
  if (semanticError !== null) return err(semanticError);

  return ok(deepFreeze(normalize(parsed.data, catalog)));
}

export function parseSetup(
  input: string,
  catalog: Catalog,
  options: ParseSetupOptions = {},
): Result<SetupV1, ImportError> {
  if (options.declaredBytes !== undefined) {
    const sizeError = checkDeclaredSize(options.declaredBytes);
    if (sizeError !== null) return err(sizeError);
  }
  if (typeof input !== "string") return err(importError("notJson"));
  if (input.length > MAX_SETUP_BYTES || utf8ByteLength(input, MAX_SETUP_BYTES) > MAX_SETUP_BYTES) {
    return err(importError("tooLarge"));
  }
  let raw: unknown;
  try {
    raw = JSON.parse(input);
  } catch {
    return err(importError("notJson"));
  }
  return parseDocument(raw, catalog);
}
