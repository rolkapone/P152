/**
 * Loads and validates the technical-artist catalog (assets/catalog) into an immutable
 * `Catalog`. Checks, in order: JSON structure guard (prototype keys, depth), Zod schemas
 * (strict, bounded, tessellation caps), then semantic rules:
 * `min <= default <= max`, enum defaults, presets within bounds, unique ids, and every
 * material / type / preset reference resolved. Threat model M-04, M-27.
 */
import { deepFreeze } from "../json/freeze";
import { inspectJsonTree } from "../json/guard";
import { formatJsonPath } from "../json/path";
import { err, ok, type Result } from "../result";
import { isValidParamValue } from "./params";
import {
  isEnumParam,
  MaterialsFileSchema,
  ObjectTypeSchema,
  StudioSceneSchema,
  StylesFileSchema,
  type Material,
  type ObjectType,
  type Style,
  type StudioScene,
} from "./schema";

/** Max nesting of catalog files (studio.json is the deepest at 6). */
export const MAX_CATALOG_DEPTH = 12;

export interface CatalogFiles {
  /** Raw object-type documents keyed by their source name (file name). */
  readonly objectTypes: Readonly<Record<string, unknown>>;
  readonly materials: unknown;
  readonly styles: unknown;
  readonly studio: unknown;
}

export type CatalogIssueCode =
  | "forbiddenKey"
  | "tooDeep"
  | "notPlainObject"
  | "schema"
  | "duplicateId"
  | "bounds"
  | "enumDefault"
  | "duplicateEnumValue"
  | "invalidPreset"
  | "invalidFormats"
  | "unknownMaterial"
  | "unknownType"
  | "missingDesk"
  | "invalidStudioDesk";

/** Developer-facing issue (catalog files are project data, not user input). */
export interface CatalogIssue {
  readonly source: string;
  readonly path: string;
  readonly code: CatalogIssueCode;
  readonly detail: string;
}

export interface Catalog {
  readonly objectTypes: ReadonlyMap<string, ObjectType>;
  readonly materials: ReadonlyMap<string, Material>;
  readonly styles: ReadonlyMap<string, Style>;
  readonly studio: StudioScene;
}

/** Desk entries are the only types allowed in `setup.desk`, and never in `setup.objects`. */
export const DESK_TYPE = "desk";

interface SchemaLike<T> {
  safeParse(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: readonly { path: PropertyKey[]; message: string }[] } };
}

function parseFile<T>(
  source: string,
  raw: unknown,
  schema: SchemaLike<T>,
  issues: CatalogIssue[],
): T | null {
  const guard = inspectJsonTree(raw, MAX_CATALOG_DEPTH);
  if (guard !== null) {
    issues.push({
      source,
      path: formatJsonPath(guard.path),
      code: guard.code,
      detail: "rejected by the JSON structure guard",
    });
    return null;
  }
  const parsed = schema.safeParse(raw);
  if (parsed.success) return deepFreeze(parsed.data);
  for (const issue of parsed.error.issues) {
    issues.push({
      source,
      path: formatJsonPath(issue.path),
      code: "schema",
      detail: issue.message,
    });
  }
  return null;
}

function checkObjectType(
  source: string,
  type: ObjectType,
  materials: ReadonlyMap<string, Material>,
  issues: CatalogIssue[],
): void {
  const add = (path: string, code: CatalogIssueCode, detail: string) =>
    issues.push({ source, path, code, detail });

  for (const [key, def] of Object.entries(type.params)) {
    const path = `params.${key}`;
    if (isEnumParam(def)) {
      if (new Set(def.enum).size !== def.enum.length) {
        add(path, "duplicateEnumValue", "enum values must be unique");
      }
      if (!def.enum.includes(def.default)) add(path, "enumDefault", "default is not in enum");
    } else if (!(def.min <= def.default && def.default <= def.max)) {
      add(path, "bounds", "expected min <= default <= max");
    }
  }

  const presetIds = new Set<string>();
  for (const [index, preset] of (type.presets ?? []).entries()) {
    const path = `presets[${String(index)}]`;
    if (presetIds.has(preset.id)) add(path, "duplicateId", "duplicate preset id");
    presetIds.add(preset.id);
    for (const [key, value] of Object.entries(preset.params)) {
      const def = Object.hasOwn(type.params, key) ? type.params[key] : undefined;
      if (def === undefined) add(`${path}.params.${key}`, "invalidPreset", "unknown param");
      else if (!isValidParamValue(def, value)) {
        add(`${path}.params.${key}`, "invalidPreset", "value outside the param definition");
      }
    }
  }

  if (type.formats !== undefined) {
    const format = type.params["format"];
    const expected = format !== undefined && isEnumParam(format) ? format.enum.map(String) : [];
    const actual = Object.keys(type.formats);
    const same =
      expected.length === actual.length && expected.every((value) => actual.includes(value));
    if (!same) add("formats", "invalidFormats", "formats must match the enum of params.format");
  }

  const slotIds = new Set<string>();
  for (const [index, slot] of type.slots.entries()) {
    const path = `slots[${String(index)}]`;
    if (slotIds.has(slot.id)) add(path, "duplicateId", "duplicate slot id");
    slotIds.add(slot.id);
    if (!materials.has(slot.default)) add(`${path}.default`, "unknownMaterial", slot.default);
  }
}

function checkStyles(
  styles: readonly Style[],
  materials: ReadonlyMap<string, Material>,
  objectTypes: ReadonlyMap<string, ObjectType>,
  issues: CatalogIssue[],
): void {
  const knownTypes = new Set([...objectTypes.values()].map((type) => type.type));
  for (const [index, style] of styles.entries()) {
    const base = `styles[${String(index)}].rules`;
    for (const [role, materialId] of Object.entries(style.rules.byRole)) {
      if (!materials.has(materialId)) {
        issues.push({
          source: "styles",
          path: `${base}.byRole.${role}`,
          code: "unknownMaterial",
          detail: materialId,
        });
      }
    }
    for (const [typeName, rules] of Object.entries(style.rules.byType)) {
      if (!knownTypes.has(typeName)) {
        issues.push({
          source: "styles",
          path: `${base}.byType.${typeName}`,
          code: "unknownType",
          detail: typeName,
        });
      }
      for (const [role, materialId] of Object.entries(rules)) {
        if (!materials.has(materialId)) {
          issues.push({
            source: "styles",
            path: `${base}.byType.${typeName}.${role}`,
            code: "unknownMaterial",
            detail: materialId,
          });
        }
      }
    }
  }
}

function checkStudioDesk(
  studio: StudioScene,
  objectTypes: ReadonlyMap<string, ObjectType>,
  materials: ReadonlyMap<string, Material>,
  issues: CatalogIssue[],
): void {
  const add = (path: string, detail: string) =>
    issues.push({ source: "studio", path, code: "invalidStudioDesk", detail });
  const { desk } = studio;
  const type = objectTypes.get(desk.type);
  if (type?.type !== DESK_TYPE) {
    add("desk.type", "unknown desk type");
    return;
  }
  if (!(type.presets ?? []).some((preset) => preset.id === desk.preset)) {
    add("desk.preset", "unknown desk preset");
  }
  const values: Record<string, unknown> = {
    width: desk.widthMm,
    depth: desk.depthMm,
    height: desk.heightMm,
    thickness: desk.thicknessMm,
    legStyle: desk.legStyle,
  };
  for (const [key, value] of Object.entries(values)) {
    const def = Object.hasOwn(type.params, key) ? type.params[key] : undefined;
    if (def === undefined || !isValidParamValue(def, value)) add(`desk.${key}`, "out of bounds");
  }
  const slotIds = new Set(type.slots.map((slot) => slot.id));
  for (const [slot, materialId] of Object.entries(desk.materials)) {
    if (!slotIds.has(slot) || !materials.has(materialId)) add(`desk.materials.${slot}`, "unknown");
  }
}

/** Ordered ranges of the studio scene (the schema checks each value alone). */
function checkStudioRanges(studio: StudioScene, issues: CatalogIssue[]): void {
  const { camera, cyclorama, shadow, backdrop } = studio;
  const { limits } = camera;
  const ranges: readonly (readonly [string, number, number])[] = [
    ["camera.near", camera.near, camera.far],
    ["camera.limits.minDistance", limits.minDistance, limits.maxDistance],
    ["camera.limits.minPolarDeg", limits.minPolarDeg, limits.maxPolarDeg],
    ["camera.limits.minAzimuthDeg", limits.minAzimuthDeg, limits.maxAzimuthDeg],
    ["camera.limits.pan.x", limits.pan.x[0], limits.pan.x[1]],
    ["camera.limits.pan.y", limits.pan.y[0], limits.pan.y[1]],
    ["camera.limits.pan.z", limits.pan.z[0], limits.pan.z[1]],
    ["cyclorama.curveStartZ", cyclorama.curveStartZ, cyclorama.floorEndZ],
    ["cyclorama.radius", cyclorama.radius, cyclorama.wallHeight],
    ["shadow.frustum.near", shadow.frustum.near, shadow.frustum.far],
    ["backdrop.light.fog.near", backdrop.light.fog.near, backdrop.light.fog.far],
    ["backdrop.dark.fog.near", backdrop.dark.fog.near, backdrop.dark.fog.far],
  ];
  for (const [path, min, max] of ranges) {
    if (!(min < max))
      issues.push({ source: "studio", path, code: "bounds", detail: "expected min < max" });
  }
}

function indexById<T extends { readonly id: string }>(
  source: string,
  entries: readonly (readonly [string, T])[],
  issues: CatalogIssue[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const [path, entry] of entries) {
    if (map.has(entry.id)) {
      issues.push({ source, path, code: "duplicateId", detail: entry.id });
    } else map.set(entry.id, entry);
  }
  return map;
}

/** Validates every catalog file; returns all issues found (not only the first). */
export function validateCatalog(files: CatalogFiles): Result<Catalog, readonly CatalogIssue[]> {
  const issues: CatalogIssue[] = [];

  const materialsFile = parseFile("materials", files.materials, MaterialsFileSchema, issues);
  const materials = indexById(
    "materials",
    (materialsFile?.materials ?? []).map((m, i) => [`materials[${String(i)}]`, m] as const),
    issues,
  );

  const parsedTypes: (readonly [string, ObjectType])[] = [];
  for (const [source, raw] of Object.entries(files.objectTypes)) {
    const type = parseFile(source, raw, ObjectTypeSchema, issues);
    if (type !== null) parsedTypes.push([source, type]);
  }
  const objectTypes = indexById("object-types", parsedTypes, issues);
  for (const [source, type] of parsedTypes) checkObjectType(source, type, materials, issues);
  if (![...objectTypes.values()].some((type) => type.type === DESK_TYPE)) {
    issues.push({ source: "object-types", path: "", code: "missingDesk", detail: "no desk type" });
  }

  const stylesFile = parseFile("styles", files.styles, StylesFileSchema, issues);
  const styleList = stylesFile?.styles ?? [];
  const styles = indexById(
    "styles",
    styleList.map((s, i) => [`styles[${String(i)}]`, s] as const),
    issues,
  );
  checkStyles(styleList, materials, objectTypes, issues);

  const studio = parseFile("studio", files.studio, StudioSceneSchema, issues);
  if (studio !== null) {
    checkStudioDesk(studio, objectTypes, materials, issues);
    checkStudioRanges(studio, issues);
  }

  if (issues.length > 0 || studio === null) return err(issues);
  return ok(Object.freeze({ objectTypes, materials, styles, studio }));
}
