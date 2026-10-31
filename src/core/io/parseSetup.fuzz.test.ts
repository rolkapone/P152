// Property-based fuzzing of the untrusted-input pipeline (ADR-APP-08, threat model M-01..M-04).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { fixture, testCatalog } from "../../../tests/unit/helpers/fixtures";
import { isEnumParam, type ObjectType, type ParamDef } from "../catalog/schema";
import { DESK_TYPE } from "../catalog/validate";
import { FORBIDDEN_KEYS } from "../json/guard";
import { MAX_OBJECTS } from "../schema/limits";
import type { SetupV1 } from "../schema/setupV1";
import { IMPORT_ERROR_CODES } from "./errors";
import { parseSetup } from "./parseSetup";
import { serializeSetup } from "./serializeSetup";

const catalog = testCatalog();
const types = [...catalog.objectTypes.values()];
const objectTypes = types.filter((type) => type.type !== DESK_TYPE);
const desks = types.filter((type) => type.type === DESK_TYPE);
const materialIds = [...catalog.materials.keys()];
const styleIds = [...catalog.styles.keys()];
const RUNS = { numRuns: 300 };

/** Never throws, always a well-formed Result. */
function assertResult(input: string): void {
  const result = parseSetup(input, catalog);
  if (result.ok) expect(typeof result.value.id).toBe("string");
  else {
    expect(IMPORT_ERROR_CODES).toContain(result.error.code);
    expect(typeof result.error.path).toBe("string");
  }
}

// eslint-disable-next-line no-control-regex -- mirrors the schema rule on control characters
const noControl = (text: string) => !/[\u0000-\u001f\u007f]/.test(text);
const displayText = fc.string({ unit: "binary", minLength: 1, maxLength: 80 }).filter(noControl);
const finite = (min: number, max: number) =>
  fc.double({ min, max, noNaN: true, noDefaultInfinity: true }).map((v) => v + 0);
const isoDate = fc
  .date({
    min: new Date("2000-01-01T00:00:00Z"),
    max: new Date("2100-01-01T00:00:00Z"),
    noInvalidDate: true,
  })
  .map((d) => d.toISOString());

function paramValue(def: ParamDef) {
  return isEnumParam(def) ? fc.constantFrom(...def.enum) : finite(def.min, def.max);
}

/** Any subset of the type's params, each within its catalog definition. */
function params(type: ObjectType) {
  const entries = Object.entries(type.params).map(([key, def]) => [key, paramValue(def)] as const);
  return fc.record(Object.fromEntries(entries), { requiredKeys: [] });
}

function materials(type: ObjectType) {
  return fc.dictionary(
    fc.constantFrom(...type.slots.map((slot) => slot.id)),
    fc.constantFrom(...materialIds),
    { maxKeys: type.slots.length },
  );
}

const setupObject = fc.constantFrom(...objectTypes).chain((type) =>
  fc.record({
    id: fc.uuid({ version: 4 }),
    type: fc.constant(type.type),
    catalogId: fc.constant(type.id),
    catalogVersion: fc.constant(type.version),
    params: params(type),
    transform: fc.record({
      x: finite(-10_000, 10_000),
      z: finite(-10_000, 10_000),
      rotationY: finite(-360, 360),
    }),
    mount: fc.constant(null),
    materials: materials(type),
    product: fc.constant(null),
    label: fc.option(displayText, { nil: null }),
  }),
);

/** True if a forbidden key appears at any depth of a JSON tree (own keys, `__proto__` included). */
function hasForbiddenKey(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return value.some(hasForbiddenKey);
  return Object.keys(value).some(
    (key) => FORBIDDEN_KEYS.has(key) || hasForbiddenKey((value as Record<string, unknown>)[key]),
  );
}

/** Extensions free of forbidden keys at every depth (fast-check biases keys towards them). */
const safeExtensions = fc
  .dictionary(fc.string({ maxLength: 16 }), fc.jsonValue({ maxDepth: 3 }), { maxKeys: 4 })
  .filter((extensions) => !hasForbiddenKey(extensions));

/** Valid setups generated from the catalog (unique ids, no mounts). */
const validSetup = fc.constantFrom(...desks).chain((desk) =>
  fc.record({
    format: fc.constant("p152.setup"),
    schemaVersion: fc.constant(1),
    id: fc.uuid({ version: 4 }),
    name: displayText,
    createdAt: isoDate,
    updatedAt: isoDate,
    units: fc.constant("mm"),
    desk: fc.record({
      catalogId: fc.constant(desk.id),
      catalogVersion: fc.constant(desk.version),
      params: params(desk),
      materials: materials(desk),
    }),
    objects: fc.uniqueArray(setupObject, {
      maxLength: MAX_OBJECTS,
      size: "max",
      selector: (o) => o.id,
    }),
    environment: fc.record({
      stylePreset: fc.option(fc.constantFrom(...styleIds), { nil: null }),
      lighting: fc.constant("neutral"),
      room: fc.constant(null),
    }),
    alertSettings: fc.record({
      occupancyMax: finite(0.1, 1),
      depthMarginMm: finite(0, 500),
      keyboardClearanceMm: finite(0, 500),
    }),
    extensions: safeExtensions,
  }),
);

/** Parses a generated valid setup, then checks that serialize -> parse gives the same result. */
function acceptsAndRoundTrips(doc: { readonly objects: readonly unknown[] }): void {
  const first = parseSetup(JSON.stringify(doc), catalog);
  expect(first.ok ? null : first.error).toBeNull();
  if (!first.ok) return;
  const again = parseSetup(serializeSetup(first.value), catalog);
  expect(again).toEqual(first);
  const value: SetupV1 = first.value;
  expect(value.objects).toHaveLength(doc.objects.length);
}

/** Replaces the value at a random path of a JSON tree. */
function mutateAt(root: unknown, choices: number[], value: unknown): unknown {
  if (typeof root !== "object" || root === null || choices.length === 0) return value;
  const keys = Object.keys(root);
  if (keys.length === 0) return value;
  const [head = 0, ...rest] = choices;
  const key = keys[head % keys.length] as string;
  const copy = (Array.isArray(root) ? [...root] : { ...root }) as Record<string, unknown>;
  copy[key] = mutateAt((root as Record<string, unknown>)[key], rest, value);
  return copy;
}

describe("parseSetup fuzzing", () => {
  it("never throws on arbitrary text", () => {
    fc.assert(fc.property(fc.string({ unit: "binary", maxLength: 2000 }), assertResult), RUNS);
  });

  it("never throws on arbitrary JSON", () => {
    fc.assert(fc.property(fc.json({ maxDepth: 6 }), assertResult), RUNS);
  });

  it("never throws on arbitrary documents with a valid envelope", () => {
    const doc = fc.dictionary(fc.string({ maxLength: 12 }), fc.jsonValue({ maxDepth: 4 }));
    fc.assert(
      fc.property(doc, (fields) => {
        assertResult(JSON.stringify({ ...fields, format: "p152.setup", schemaVersion: 1 }));
      }),
      RUNS,
    );
  });

  it("never throws when any field of a valid setup is replaced by any JSON value", () => {
    const base: unknown = JSON.parse(fixture("valid", "full"));
    fc.assert(
      fc.property(
        fc.array(fc.nat(), { minLength: 1, maxLength: 6 }),
        fc.jsonValue({ maxDepth: 3 }),
        (path, value) => assertResult(JSON.stringify(mutateAt(base, path, value))),
      ),
      RUNS,
    );
  });

  it("rejects a forbidden key injected anywhere in a valid setup", () => {
    const base: unknown = JSON.parse(fixture("valid", "full"));
    fc.assert(
      fc.property(
        fc.array(fc.nat(), { minLength: 1, maxLength: 6 }),
        fc.constantFrom(...FORBIDDEN_KEYS),
        (path, key) => {
          const marker = { "p152-marker": 1 };
          const text = JSON.stringify(mutateAt(base, path, marker)).replace(
            '"p152-marker"',
            JSON.stringify(key),
          );
          const result = parseSetup(text, catalog);
          expect(result.ok ? null : result.error.code).toBe("forbiddenKey");
          expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
        },
      ),
      RUNS,
    );
  });

  it("accepts every generated valid setup and round-trips serialize -> parse", () => {
    fc.assert(fc.property(validSetup, acceptsAndRoundTrips), { numRuns: 200 });
  });

  // Regression: this seed generated the extensions {"":{"":{"prototype":""}}}, rightly rejected
  // by parseSetup (forbiddenKey); the generator only filtered forbidden keys at the first level.
  it("generates no nested forbidden key with the seed of a past failure", () => {
    expect(hasForbiddenKey({ "": { "": { prototype: "" } } })).toBe(true);
    fc.assert(fc.property(validSetup, acceptsAndRoundTrips), { numRuns: 200, seed: 60940642 });
  });

  it("rejects a valid setup whose extensions hide a forbidden key at any depth", () => {
    fc.assert(
      fc.property(
        validSetup,
        fc.constantFrom(...FORBIDDEN_KEYS),
        fc.array(fc.string({ maxLength: 8 }), { minLength: 1, maxLength: 4 }),
        (doc, key, wrappers) => {
          const nested = wrappers.reduceRight<unknown>((inner, wrapper) => ({ [wrapper]: inner }), {
            "p152-marker": "",
          });
          const text = JSON.stringify({ ...doc, extensions: nested }).replace(
            '"p152-marker"',
            JSON.stringify(key),
          );
          const result = parseSetup(text, catalog);
          expect(result.ok ? null : result.error.code).toBe("forbiddenKey");
        },
      ),
      RUNS,
    );
  });
});
