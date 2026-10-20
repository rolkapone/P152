import { describe, expect, it } from "vitest";
import { fixture, fixtures, testCatalog } from "../../../tests/unit/helpers/fixtures";
import { MAX_OBJECTS, MAX_SETUP_BYTES } from "../schema/limits";
import type { SetupV1 } from "../schema/setupV1";
import type { ImportErrorCode } from "./errors";
import { checkDeclaredSize, parseSetup } from "./parseSetup";
import { serializeSetup } from "./serializeSetup";

const catalog = testCatalog();

function parsed(text: string): SetupV1 {
  const result = parseSetup(text, catalog);
  if (!result.ok) throw new Error(`unexpected error ${JSON.stringify(result.error)}`);
  return result.value;
}

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function withObjects(count: number): string {
  const doc = JSON.parse(fixture("valid", "minimal")) as Record<string, unknown>;
  doc["objects"] = Array.from({ length: count }, (_, i) => ({
    id: uuid(100 + i),
    type: "mouse",
    catalogId: "mouse.generic",
    catalogVersion: 1,
    params: {},
    transform: { x: i * 10, z: 0, rotationY: 0 },
    mount: null,
    materials: {},
    product: null,
    label: null,
  }));
  return JSON.stringify(doc);
}

describe("parseSetup: valid fixtures", () => {
  it.each(fixtures("valid"))("accepts %s", (_name, text) => {
    expect(parseSetup(text, catalog).ok).toBe(true);
  });

  it("fills missing params with catalog defaults, in catalog order", () => {
    const setup = parsed(fixture("valid", "minimal"));
    expect(setup.desk.params).toEqual({
      width: 1200,
      depth: 700,
      height: 740,
      thickness: 25,
      legStyle: "post",
    });
    const full = parsed(fixture("valid", "full"));
    expect(Object.keys(full.objects[1]?.params ?? {})).toEqual([
      "format",
      "height",
      "tilt",
      "caseMargin",
    ]);
  });

  it("keeps mounts, material overrides, style and extensions without interpreting them", () => {
    const setup = parsed(fixture("valid", "full"));
    expect(setup.objects.find((o) => o.type === "monitor")?.mount).toEqual({
      parentId: uuid(13),
      socket: "vesa",
    });
    expect(setup.desk.materials).toEqual({ top: "mat.oak" });
    expect(setup.environment.stylePreset).toBe("style.cosy");
    expect(setup.extensions).toEqual({ "x-note": { any: "value" } });
  });

  it("returns a frozen document", () => {
    const setup = parsed(fixture("valid", "full"));
    expect(Object.isFrozen(setup)).toBe(true);
    expect(Object.isFrozen(setup.objects[0]?.transform)).toBe(true);
  });

  it("round-trips through serializeSetup", () => {
    const setup = parsed(fixture("valid", "full"));
    const text = serializeSetup(setup);
    expect(text.endsWith("}\n")).toBe(true);
    expect(parsed(text)).toEqual(setup);
  });

  it("keeps markup in names as plain text (rendered escaped by React)", () => {
    const text = fixture("valid", "minimal").replace('"My setup"', '"<b>Desk</b> & co"');
    expect(parsed(text).name).toBe("<b>Desk</b> & co");
  });
});

describe("parseSetup: invalid fixtures", () => {
  const expected: Record<string, [ImportErrorCode, string]> = {
    "bad-uuid": ["invalid", "objects[0].id"],
    "catalog-version-mismatch": ["catalogVersionMismatch", "objects[0].catalogVersion"],
    "desk-as-object": ["typeMismatch", "objects[0].catalogId"],
    "duplicate-id": ["duplicateId", "objects[1].id"],
    "missing-desk": ["invalid", "desk"],
    "mount-cycle": ["invalidMount", "objects[0].mount.parentId"],
    "mount-missing-parent": ["invalidMount", "objects[0].mount.parentId"],
    "name-control-chars": ["invalid", "name"],
    "name-too-long": ["invalid", "name"],
    "newer-version": ["newerVersion", "schemaVersion"],
    "param-out-of-range": ["invalidParam", "desk.params.width"],
    "param-unknown": ["unknownParam", "objects[0].params.brightness"],
    "param-wrong-enum": ["invalidParam", "objects[0].params.ratio"],
    "product-reserved": ["invalid", "objects[0].product"],
    "type-mismatch": ["typeMismatch", "objects[0].catalogId"],
    "unknown-catalog-item": ["unknownCatalogItem", "objects[0].catalogId"],
    "unknown-key": ["invalid", ""],
    "unknown-material": ["invalidMaterial", "objects[0].materials.body"],
    "unknown-material-slot": ["invalidMaterial", "objects[0].materials.wings"],
    "unknown-style": ["unknownStyle", "environment.stylePreset"],
    "version-not-integer": ["notSetup", "schemaVersion"],
    "version-zero": ["unsupportedVersion", "schemaVersion"],
    "wrong-format": ["notSetup", ""],
  };

  it("has an expectation for every fixture", () => {
    expect(
      fixtures("invalid")
        .map(([name]) => name)
        .sort(),
    ).toEqual(Object.keys(expected).sort());
  });

  it.each(fixtures("invalid"))("rejects %s", (name, text) => {
    const [code, path] = expected[name] ?? ["?", "?"];
    expect(parseSetup(text, catalog)).toEqual({ ok: false, error: { code, path } });
  });

  it("rejects a desk entry that is not a desk, and an unknown desk", () => {
    const base = fixture("valid", "minimal");
    const notDesk = base.replace('"catalogId": "desk.rect"', '"catalogId": "mouse.generic"');
    const unknown = base.replace('"catalogId": "desk.rect"', '"catalogId": "desk.corner"');
    expect(parseSetup(notDesk, catalog)).toEqual({
      ok: false,
      error: { code: "typeMismatch", path: "desk.catalogId" },
    });
    expect(parseSetup(unknown, catalog)).toEqual({
      ok: false,
      error: { code: "unknownCatalogItem", path: "desk.catalogId" },
    });
  });

  it("rejects an object mounted on itself", () => {
    const doc = JSON.parse(withObjects(1)) as { objects: { mount: unknown }[] };
    doc.objects[0]!.mount = { parentId: uuid(100), socket: "vesa" };
    expect(parseSetup(JSON.stringify(doc), catalog)).toEqual({
      ok: false,
      error: { code: "invalidMount", path: "objects[0].mount.parentId" },
    });
  });
});

describe("parseSetup: malicious inputs", () => {
  const expected: Record<string, [ImportErrorCode, string]> = {
    "constructor-in-params": ["forbiddenKey", "desk.params.constructor"],
    "html-unknown-key": ["invalid", ""],
    "huge-number": ["invalid", "desk.params.width"],
    "infinity-overflow": ["invalid", "desk.params.width"],
    "not-json": ["notJson", ""],
    "proto-in-extensions": ["forbiddenKey", "extensions.a.b.__proto__"],
    "proto-root": ["forbiddenKey", "__proto__"],
    "prototype-key": ["forbiddenKey", "desk.materials.prototype"],
  };

  it("has an expectation for every fixture", () => {
    expect(
      fixtures("malicious")
        .map(([name]) => name)
        .sort(),
    ).toEqual(Object.keys(expected).sort());
  });

  it.each(fixtures("malicious"))("rejects %s without polluting prototypes", (name, text) => {
    const [code, path] = expected[name] ?? ["?", "?"];
    expect(parseSetup(text, catalog)).toEqual({ ok: false, error: { code, path } });
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });

  it("never echoes the file content in the error", () => {
    const result = parseSetup(fixture("malicious", "html-unknown-key"), catalog);
    expect(JSON.stringify(result)).not.toMatch(/script|img|alert/);
  });

  it("rejects more than 50 objects, accepts exactly 50", () => {
    expect(parseSetup(withObjects(MAX_OBJECTS + 1), catalog)).toEqual({
      ok: false,
      error: { code: "tooManyObjects", path: "objects" },
    });
    expect(parseSetup(withObjects(MAX_OBJECTS), catalog).ok).toBe(true);
  });

  it("rejects deep nesting without overflowing the stack", () => {
    const deep = "[".repeat(200_000) + "]".repeat(200_000);
    const text = fixture("valid", "minimal").replace(
      '"extensions": {}',
      `"extensions": {"a":${deep}}`,
    );
    expect(parseSetup(text, catalog)).toEqual({
      ok: false,
      error: { code: "tooDeep", path: expect.stringMatching(/^extensions\.a/) as unknown },
    });
  });

  it("rejects a huge string", () => {
    const text = fixture("valid", "minimal").replace('"My setup"', `"${"x".repeat(900_000)}"`);
    expect(parseSetup(text, catalog)).toEqual({
      ok: false,
      error: { code: "invalid", path: "name" },
    });
  });
});

describe("parseSetup: size limit (1 MiB)", () => {
  const minimal = fixture("valid", "minimal");
  const padTo = (bytes: number) => minimal + " ".repeat(bytes - minimal.length);

  it("accepts exactly 1 MiB and rejects one byte more", () => {
    expect(parseSetup(padTo(MAX_SETUP_BYTES), catalog).ok).toBe(true);
    expect(parseSetup(padTo(MAX_SETUP_BYTES + 1), catalog)).toEqual({
      ok: false,
      error: { code: "tooLarge", path: "" },
    });
  });

  it("counts UTF-8 bytes, not characters", () => {
    const text = minimal.replace('"My setup"', '"Desk"') + " ".repeat(10) + "é".repeat(600_000);
    expect(text.length).toBeLessThan(MAX_SETUP_BYTES);
    expect(parseSetup(text, catalog)).toEqual({ ok: false, error: { code: "tooLarge", path: "" } });
  });

  it("checks the declared size before reading", () => {
    expect(parseSetup(minimal, catalog, { declaredBytes: MAX_SETUP_BYTES + 1 })).toEqual({
      ok: false,
      error: { code: "tooLarge", path: "" },
    });
    expect(parseSetup(minimal, catalog, { declaredBytes: minimal.length }).ok).toBe(true);
    expect(checkDeclaredSize(Number.NaN)?.code).toBe("tooLarge");
    expect(checkDeclaredSize(-1)?.code).toBe("tooLarge");
    expect(checkDeclaredSize(0)).toBeNull();
  });

  it("rejects non-string input defensively", () => {
    expect(parseSetup(42 as unknown as string, catalog)).toEqual({
      ok: false,
      error: { code: "notJson", path: "" },
    });
  });
});
