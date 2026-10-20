import { describe, expect, it } from "vitest";
import { fixture, testCatalog } from "../../../tests/unit/helpers/fixtures";
import { parseSetup } from "../io/parseSetup";
import { createSetup } from "./createSetup";
import { SetupV1Schema } from "./setupV1";

const valid = () =>
  JSON.parse(fixture("valid", "full")) as Record<string, unknown> & {
    objects: Record<string, unknown>[];
  };

function firstIssuePath(doc: unknown): string | null {
  const result = SetupV1Schema.safeParse(doc);
  return result.success ? null : (result.error.issues[0]?.path.join(".") ?? "");
}

describe("SetupV1Schema", () => {
  it("accepts the reference fixture", () => {
    expect(firstIssuePath(valid())).toBeNull();
  });

  it.each<[string, (doc: ReturnType<typeof valid>) => void, string]>([
    [
      "rotation above 360°",
      (d) => void (d.objects[0]!["transform"] = { x: 0, z: 0, rotationY: 361 }),
      "objects.0.transform.rotationY",
    ],
    [
      "coordinate beyond 10 m",
      (d) => void (d.objects[0]!["transform"] = { x: 10_001, z: 0, rotationY: 0 }),
      "objects.0.transform.x",
    ],
    [
      "transform with y (height is derived)",
      (d) => void (d.objects[0]!["transform"] = { x: 0, z: 0, rotationY: 0, y: 1 }),
      "objects.0.transform",
    ],
    ["unknown units", (d) => void (d["units"] = "in"), "units"],
    [
      "lighting not yet available",
      (d) => void (d["environment"] = { stylePreset: null, lighting: "evening", room: null }),
      "environment.lighting",
    ],
    [
      "room reserved",
      (d) => void (d["environment"] = { stylePreset: null, lighting: "neutral", room: {} }),
      "environment.room",
    ],
    ["empty label", (d) => void (d.objects[0]!["label"] = ""), "objects.0.label"],
    ["bad date", (d) => void (d["createdAt"] = "yesterday"), "createdAt"],
    [
      "occupancy above 100 %",
      (d) =>
        void (d["alertSettings"] = { occupancyMax: 2, depthMarginMm: 0, keyboardClearanceMm: 0 }),
      "alertSettings.occupancyMax",
    ],
    [
      "too many params",
      (d) =>
        void (d.objects[0]!["params"] = Object.fromEntries(
          Array.from({ length: 25 }, (_, i) => [`p${String(i)}`, 1]),
        )),
      "objects.0.params",
    ],
    [
      "too many material overrides",
      (d) =>
        void (d.objects[0]!["materials"] = Object.fromEntries(
          Array.from({ length: 9 }, (_, i) => [`s${String(i)}`, "mat.oak"]),
        )),
      "objects.0.materials",
    ],
    [
      "too many extension keys",
      (d) =>
        void (d["extensions"] = Object.fromEntries(
          Array.from({ length: 33 }, (_, i) => [`k${String(i)}`, 1]),
        )),
      "extensions",
    ],
    [
      "param string too long",
      (d) => void (d.objects[0]!["params"] = { format: "x".repeat(33) }),
      "objects.0.params.format",
    ],
    [
      "NaN-like param",
      (d) => void (d.objects[0]!["params"] = { width: null }),
      "objects.0.params.width",
    ],
  ])("rejects %s", (_name, mutate, path) => {
    const doc = valid();
    mutate(doc);
    expect(firstIssuePath(doc)).toBe(path);
  });
});

describe("createSetup", () => {
  const catalog = testCatalog();
  const input = {
    id: "00000000-0000-4000-8000-000000000001",
    name: "New setup",
    now: "2026-10-20T08:00:00.000Z",
  };

  it("creates an empty setup with the default desk, valid end to end", () => {
    const setup = createSetup(catalog, input);
    expect(setup?.desk).toEqual({
      catalogId: "desk.rect",
      catalogVersion: 1,
      params: { width: 1400, depth: 700, height: 740, thickness: 25, legStyle: "post" },
      materials: {},
    });
    expect(setup?.objects).toEqual([]);
    expect(parseSetup(JSON.stringify(setup), catalog)).toEqual({ ok: true, value: setup });
  });

  it("returns null for an unknown or non-desk catalog entry", () => {
    expect(createSetup(catalog, { ...input, deskCatalogId: "desk.corner" })).toBeNull();
    expect(createSetup(catalog, { ...input, deskCatalogId: "mouse.generic" })).toBeNull();
    expect(createSetup(catalog, { ...input, deskCatalogId: "desk.rect" })?.desk.catalogId).toBe(
      "desk.rect",
    );
  });
});
