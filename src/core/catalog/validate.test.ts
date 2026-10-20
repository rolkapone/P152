import { describe, expect, it } from "vitest";
import { readCatalogFiles } from "../../../tests/unit/helpers/fixtures";
import { embeddedCatalogSource, EMBEDDED_CATALOG_FILES, loadEmbeddedCatalog } from "./embedded";
import { MAX_CYCLORAMA_SEGMENTS, MAX_TRIS_PER_OBJECT } from "./limits";
import { defaultParams, isValidParamValue } from "./params";
import { validateCatalog, type CatalogFiles, type CatalogIssueCode } from "./validate";

type Json = Record<string, unknown>;

/** Deep copy of the catalog read from disk, mutated by `mutate`, then validated. */
function validateMutated(mutate: (files: { [K in keyof CatalogFiles]: Json }) => void) {
  const files = structuredClone(readCatalogFiles()) as unknown as {
    [K in keyof CatalogFiles]: Json;
  };
  mutate(files);
  return validateCatalog(files as unknown as CatalogFiles);
}

function issueCodes(result: ReturnType<typeof validateCatalog>): CatalogIssueCode[] {
  return result.ok ? [] : result.error.map((issue) => issue.code);
}

const types = (files: { objectTypes: Json }) => files.objectTypes as Record<string, Json>;
const params = (files: { objectTypes: Json }, file: string) =>
  types(files)[file]?.["params"] as Record<string, Json>;

describe("catalog in assets/catalog", () => {
  it("is valid as read from disk (JSON.parse keeps own prototype keys visible)", () => {
    const result = validateCatalog(readCatalogFiles());
    expect(result.ok ? [] : result.error).toEqual([]);
  });

  it("is valid as embedded in the bundle, with every file picked up", () => {
    const result = loadEmbeddedCatalog();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(EMBEDDED_CATALOG_FILES.objectTypes)).toHaveLength(10);
    expect([...result.value.objectTypes.keys()]).toContain("desk.rect");
    expect(result.value.objectTypes.size).toBe(10);
    expect(result.value.materials.size).toBeGreaterThanOrEqual(30);
    expect(result.value.styles.size).toBeGreaterThanOrEqual(4);
    expect(loadEmbeddedCatalog()).toBe(result);
  });

  it("is exposed through the CatalogSource port", async () => {
    await expect(embeddedCatalogSource.load()).resolves.toBe(loadEmbeddedCatalog());
  });

  it("is immutable", () => {
    const result = loadEmbeddedCatalog();
    if (!result.ok) throw new Error("catalog invalid");
    const desk = result.value.objectTypes.get("desk.rect");
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(desk)).toBe(true);
    expect(Object.isFrozen(desk?.params["width"])).toBe(true);
  });

  it("respects min <= default <= max for every numeric param of every type", () => {
    const result = loadEmbeddedCatalog();
    if (!result.ok) throw new Error("catalog invalid");
    for (const type of result.value.objectTypes.values()) {
      for (const def of Object.values(type.params)) {
        expect(isValidParamValue(def, def.default)).toBe(true);
      }
      expect(Object.keys(defaultParams(type.params))).toEqual(Object.keys(type.params));
      expect(type.budget.tris).toBeLessThanOrEqual(MAX_TRIS_PER_OBJECT);
    }
  });
});

describe("validateCatalog rejects", () => {
  it.each([
    ["__proto__", "forbiddenKey"],
    ["constructor", "forbiddenKey"],
    ["prototype", "forbiddenKey"],
  ])("a %s key anywhere in a file", (key, code) => {
    const result = validateMutated((files) => {
      const width = params(files, "desk.json")["width"] as Json;
      Object.defineProperty(width, key, { value: { polluted: true }, enumerable: true });
    });
    expect(issueCodes(result)).toContain(code);
    expect(({} as Json)["polluted"]).toBeUndefined();
  });

  it("an object literal whose prototype was replaced", () => {
    const result = validateCatalog({
      ...readCatalogFiles(),
      materials: { __proto__: { polluted: true }, format: "p152.materials" },
    });
    expect(issueCodes(result)).toContain("notPlainObject");
  });

  it("files nested too deeply", () => {
    let deep: unknown = 1;
    for (let i = 0; i < 20; i++) deep = [deep];
    const result = validateMutated((files) => {
      files.styles["notes"] = deep;
    });
    expect(issueCodes(result)).toContain("tooDeep");
  });

  it.each<[string, (p: Record<string, Json>) => void]>([
    ["default < min", (p) => void ((p["width"] as Json)["default"] = 700)],
    ["default > max", (p) => void ((p["width"] as Json)["default"] = 2500)],
    ["min > max", (p) => void ((p["width"] as Json)["min"] = 3000)],
  ])("bounds: %s", (_name, mutate) => {
    const result = validateMutated((files) => mutate(params(files, "desk.json")));
    expect(issueCodes(result)).toContain("bounds");
  });

  it("an enum default outside the enum, and duplicate enum values", () => {
    const result = validateMutated((files) => {
      (params(files, "desk.json")["legStyle"] as Json)["default"] = "hairpin";
      (params(files, "monitor.json")["ratio"] as Json)["enum"] = ["16:9", "16:9"];
    });
    expect(issueCodes(result)).toEqual(
      expect.arrayContaining(["enumDefault", "duplicateEnumValue"]),
    );
  });

  it("presets outside the param bounds, with unknown params or duplicate ids", () => {
    const result = validateMutated((files) => {
      types(files)["desk.json"]!["presets"] = [
        { id: "standard", params: { width: 1400 } },
        { id: "huge", params: { width: 9000 } },
        { id: "odd", params: { colour: "red" } },
        { id: "odd", params: {} },
      ];
    });
    expect(issueCodes(result)).toEqual(["invalidPreset", "invalidPreset", "duplicateId"]);
  });

  it("keyboard formats that do not match the format enum", () => {
    const result = validateMutated((files) => {
      delete (types(files)["keyboard.json"]!["formats"] as Json)["tkl"];
    });
    expect(issueCodes(result)).toEqual(["invalidFormats"]);
  });

  it("formats without a format enum param", () => {
    const result = validateMutated((files) => {
      types(files)["mouse.json"]!["formats"] = { small: { widthMm: 1, depthMm: 1, keys: 1 } };
    });
    expect(issueCodes(result)).toEqual(["invalidFormats"]);
  });

  it("slots with unknown materials or duplicate ids", () => {
    const result = validateMutated((files) => {
      types(files)["desk.json"]!["slots"] = [
        { id: "top", role: "top", default: "mat.unobtainium" },
        { id: "top", role: "legs", default: "mat.oak" },
      ];
    });
    expect(issueCodes(result)).toEqual(expect.arrayContaining(["unknownMaterial", "duplicateId"]));
  });

  it("duplicate type and material ids", () => {
    const result = validateMutated((files) => {
      types(files)["desk-copy.json"] = structuredClone(types(files)["desk.json"]!);
      const list = files.materials["materials"] as Json[];
      list.push(structuredClone(list[0]!));
    });
    expect(issueCodes(result).filter((code) => code === "duplicateId")).toHaveLength(2);
  });

  it("a catalog without any desk", () => {
    const result = validateMutated((files) => {
      delete types(files)["desk.json"];
    });
    expect(issueCodes(result)).toEqual(
      expect.arrayContaining(["missingDesk", "invalidStudioDesk"]),
    );
  });

  it("styles referencing unknown materials or object types", () => {
    const result = validateMutated((files) => {
      const style = (files.styles["styles"] as Json[])[0] as { rules: Json };
      style.rules = {
        byRole: { top: "mat.unobtainium" },
        byType: { hoverboard: { body: "mat.oak" }, lamp: { body: "mat.nope" } },
      };
    });
    expect(issueCodes(result)).toEqual(["unknownMaterial", "unknownType", "unknownMaterial"]);
  });

  it("a studio desk that does not match the desk catalog entry", () => {
    const result = validateMutated((files) => {
      const desk = files.studio["desk"] as Json;
      desk["widthMm"] = 5000;
      desk["preset"] = "gigantic";
      desk["materials"] = { top: "mat.unobtainium", wings: "mat.oak" };
    });
    const paths = result.ok ? [] : result.error.map((issue) => issue.path);
    expect(paths).toEqual([
      "desk.preset",
      "desk.width",
      "desk.materials.top",
      "desk.materials.wings",
    ]);
  });

  it("a studio desk of a non-desk type", () => {
    const result = validateMutated((files) => {
      (files.studio["desk"] as Json)["type"] = "monitor.generic";
    });
    expect(issueCodes(result)).toEqual(["invalidStudioDesk"]);
  });

  it.each<[string, (files: { [K in keyof CatalogFiles]: Json }) => void]>([
    [
      "cyclorama segments above the cap",
      (f) => void ((f.studio["cyclorama"] as Json)["segments"] = MAX_CYCLORAMA_SEGMENTS + 1),
    ],
    [
      "a shadow map size that is not allowed",
      (f) =>
        void ((((f.studio["shadow"] as Json)["tiers"] as Json)["high"] as Json)["mapSize"] = 8192),
    ],
    [
      "too many shadow blur samples",
      (f) =>
        void ((((f.studio["shadow"] as Json)["tiers"] as Json)["low"] as Json)["blurSamples"] = 64),
    ],
    [
      "an object budget above 10k triangles",
      (f) => void ((types(f)["monitor.json"]!["budget"] as Json)["tris"] = MAX_TRIS_PER_OBJECT + 1),
    ],
    [
      "a scene budget above ADR-3D-08",
      (f) => void (((f.studio["perf"] as Json)["budget"] as Json)["triangles"] = 1_000_000),
    ],
    ["an unknown key (strict schema)", (f) => void (types(f)["mouse.json"]!["script"] = "x")],
    [
      "a non-hex colour",
      (f) => void ((f.materials["materials"] as Json[])[0]!["baseColor"] = "red"),
    ],
    ["a negative step", (f) => void ((params(f, "desk.json")["width"] as Json)["step"] = -10)],
    [
      "an infinite bound",
      (f) => void ((params(f, "desk.json")["width"] as Json)["max"] = Infinity),
    ],
    ["a wrong file format", (f) => void (f.styles["format"] = "p152.materials")],
  ])("schema: %s", (_name, mutate) => {
    expect(issueCodes(validateMutated(mutate))).toContain("schema");
  });
});
