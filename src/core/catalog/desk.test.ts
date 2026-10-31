import { describe, expect, it } from "vitest";
import { testCatalog } from "../../../tests/unit/helpers/fixtures";
import {
  defaultDeskChoiceId,
  deskChoices,
  deskSpec,
  sameDesk,
  studioDeskSpec,
  type DeskSpec,
} from "./desk";
import type { ObjectType } from "./schema";
import { toStudioConfig } from "./studio";

const catalog = testCatalog();
const type = (id: string) => catalog.objectTypes.get(id)!;

describe("deskChoices (the desk list of US-006)", () => {
  const choices = deskChoices(catalog);

  it("lists the 7 desks of the catalog, rectangles first, in catalog order", () => {
    expect(choices.map((choice) => choice.id)).toEqual([
      "desk.rect/compact",
      "desk.rect/basic",
      "desk.rect/standard",
      "desk.rect/large",
      "desk.rect/gaming",
      "desk.corner/standard",
      "desk.corner/large",
    ]);
    expect(choices.map(({ spec }) => [spec.widthMm, spec.depthMm])).toEqual([
      [1000, 600],
      [1200, 600],
      [1400, 700],
      [1600, 800],
      [1800, 800],
      [1600, 1400],
      [1800, 1600],
    ]);
  });

  it("resolves each preset with the catalog defaults (740 mm high, catalog materials)", () => {
    for (const { spec, presetId } of choices) {
      expect(spec.presetId).toBe(presetId);
      expect(spec.heightMm).toBe(740);
      expect(spec.thicknessMm).toBe(25);
      expect(spec.materials).toEqual({ top: "mat.birch", legs: "mat.black-metal" });
      expect(Object.isFrozen(spec)).toBe(true);
    }
    // Names of the models (preset name of the catalog, technical-artist spec).
    expect(choices.map((choice) => choice.name)).toEqual([
      "Compact desk",
      "Basic desk",
      "Standard desk",
      "Large desk",
      "Gaming desk",
      "Corner desk",
      "Corner desk large",
    ]);
    const large = choices.at(-1)!.spec;
    expect(large).toMatchObject({
      shape: "corner",
      armDepthMm: 700,
      wingWidthMm: 700,
      orientation: "right",
    });
  });

  it("defaults to the studio desk, 140 x 70", () => {
    const id = defaultDeskChoiceId(catalog);
    expect(id).toBe("desk.rect/standard");
    expect(choices.find((choice) => choice.id === id)?.spec).toMatchObject({
      widthMm: 1400,
      depthMm: 700,
      heightMm: 740,
    });
  });

  it("skips desk entries without a generator and presets out of bounds", () => {
    const standing: ObjectType = { ...type("desk.rect"), id: "desk.standing" };
    const broken: ObjectType = {
      ...type("desk.rect"),
      presets: [{ id: "huge", params: { width: 9000 } }],
    };
    const objectTypes = new Map([
      ["desk.standing", standing],
      ["desk.rect", broken],
    ]);
    expect(deskChoices({ ...catalog, objectTypes })).toEqual([]);
  });

  it("names a preset without a name after its catalog entry", () => {
    const unnamed: ObjectType = {
      ...type("desk.rect"),
      presets: [{ id: "plain", params: { width: 1300 } }],
    };
    const objectTypes = new Map([["desk.rect", unnamed]]);
    expect(deskChoices({ ...catalog, objectTypes }).map((choice) => choice.name)).toEqual(["Desk"]);
  });
});

describe("deskSpec", () => {
  it("resolves setup params and material overrides, with the matching preset or none", () => {
    const spec = deskSpec(type("desk.rect"), { width: 1400, depth: 700 }, { top: "mat.oak" });
    expect(spec).toMatchObject({
      shape: "rect",
      catalogId: "desk.rect",
      catalogVersion: 1,
      presetId: "standard",
      materials: { top: "mat.oak", legs: "mat.black-metal" },
    });
    expect(deskSpec(type("desk.rect"), { width: 1410 })?.presetId).toBeNull();
    expect(deskSpec(type("desk.corner"), { orientation: "left" })).toMatchObject({
      presetId: "standard",
      orientation: "left",
    });
  });

  it("rejects unknown entries, non-desks, and values out of the catalog bounds", () => {
    expect(deskSpec(type("mouse.generic"))).toBeNull();
    expect(deskSpec({ ...type("desk.rect"), id: "desk.round" })).toBeNull();
    expect(deskSpec(type("desk.rect"), { width: 700 })).toBeNull();
    expect(deskSpec(type("desk.rect"), { legStyle: "trestle" })).toBeNull();
    expect(deskSpec(type("desk.corner"), { orientation: "up" })).toBeNull();
  });

  it("rejects a desk entry whose parameters do not describe the shape", () => {
    const rect = type("desk.rect");
    const params = { ...rect.params };
    delete (params as Record<string, unknown>)["thickness"];
    expect(deskSpec({ ...rect, params })).toBeNull();
    const corner = type("desk.corner");
    const noWing = { ...corner.params };
    delete (noWing as Record<string, unknown>)["wingWidth"];
    expect(deskSpec({ ...corner, params: noWing })).toBeNull();
    // An arm as deep as the desk is no longer an L (bounds widened on purpose).
    const deep = {
      ...corner,
      params: { ...corner.params, armDepth: { ...corner.params["armDepth"]!, max: 2000 } },
    } as ObjectType;
    expect(deskSpec(deep, { depth: 1000, armDepth: 1000 })).toBeNull();
  });
});

describe("studioDeskSpec and sameDesk", () => {
  const studio = studioDeskSpec(toStudioConfig(catalog.studio));
  const standard = deskSpec(type("desk.rect"), { width: 1400, depth: 700 })!;

  it("draws the studio desk before the app chose one, equal to the default line", () => {
    expect(sameDesk(studio, standard)).toBe(true);
  });

  it("tells desks apart by any value, materials included", () => {
    const other = (patch: Partial<DeskSpec>) => ({ ...standard, ...patch }) as DeskSpec;
    expect(sameDesk(standard, other({ widthMm: 1600 }))).toBe(false);
    expect(
      sameDesk(standard, other({ materials: { top: "mat.oak", legs: "mat.black-metal" } })),
    ).toBe(false);
    expect(sameDesk(standard, other({ materials: { top: "mat.birch" } }))).toBe(false);
    expect(sameDesk(standard, deskSpec(type("desk.corner"))!)).toBe(false);
  });
});
