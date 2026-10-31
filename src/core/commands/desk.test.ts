import { describe, expect, it } from "vitest";
import { fixture, testCatalog } from "../../../tests/unit/helpers/fixtures";
import { deskFootprint, type RectMm } from "../geometry/deskFootprint";
import { parseSetup } from "../io/parseSetup";
import { createSetup } from "../schema/createSetup";
import type { SetupV1 } from "../schema/setupV1";
import {
  defaultDesk,
  deskChoiceIdOf,
  deskForChoice,
  deskSpecOf,
  sameSetupDesk,
  setDesk,
} from "./desk";

const catalog = testCatalog();
const NOW = "2026-10-31T10:00:00.000Z";
const LATER = "2026-10-31T10:05:00.000Z";

function newSetup(): SetupV1 {
  return createSetup(catalog, {
    id: "00000000-0000-4000-8000-000000000001",
    name: "My desk setup",
    now: NOW,
  })!;
}

function fullSetup(): SetupV1 {
  const result = parseSetup(fixture("valid", "full"), catalog);
  if (!result.ok) throw new Error("fixture full.json invalid");
  return result.value;
}

const desk = (choiceId: string) => deskForChoice(catalog, choiceId)!;
const inside = (rects: readonly RectMm[], x: number, z: number) =>
  rects.some((r) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ);

describe("desk of the setup (US-006)", () => {
  it("turns a line of the list into a setup desk with every parameter", () => {
    expect(desk("desk.corner/large")).toEqual({
      catalogId: "desk.corner",
      catalogVersion: 1,
      params: {
        width: 1800,
        depth: 1600,
        height: 740,
        thickness: 25,
        armDepth: 700,
        wingWidth: 700,
        orientation: "right",
        legStyle: "post",
      },
      materials: {},
    });
    expect(deskForChoice(catalog, "desk.rect/unknown")).toBeNull();
    expect(deskForChoice(catalog, "monitor.generic/standard")).toBeNull();
  });

  it("starts on the desk of the studio, the 140 x 70 line (UX-3)", () => {
    expect(defaultDesk(catalog)).toEqual(desk("desk.rect/standard"));
    expect(defaultDesk(catalog)).toEqual(newSetup().desk);
  });

  it("finds the line and the scene desk of a setup desk", () => {
    const setup = newSetup();
    expect(deskChoiceIdOf(catalog, setup.desk)).toBe("desk.rect/standard");
    expect(deskSpecOf(catalog, setup.desk)).toMatchObject({ widthMm: 1400, depthMm: 700 });
    // Custom size (US-007): no line; another version or unknown entry: no desk at all.
    const custom = { ...setup.desk, params: { ...setup.desk.params, width: 1450 } };
    expect(deskChoiceIdOf(catalog, custom)).toBeNull();
    expect(deskSpecOf(catalog, custom)).toMatchObject({ widthMm: 1450, presetId: null });
    expect(deskSpecOf(catalog, { ...setup.desk, catalogVersion: 2 })).toBeNull();
    expect(deskChoiceIdOf(catalog, { ...setup.desk, catalogId: "desk.none" })).toBeNull();
  });

  it("compares setup desks by value", () => {
    const a = desk("desk.rect/standard");
    expect(sameSetupDesk(a, { ...a, params: { ...a.params } })).toBe(true);
    expect(sameSetupDesk(a, desk("desk.rect/large"))).toBe(false);
    expect(sameSetupDesk(a, { ...a, materials: { top: "mat.oak" } })).toBe(false);
    expect(sameSetupDesk(a, { ...a, catalogVersion: 2 })).toBe(false);
    expect(sameSetupDesk(a, desk("desk.corner/standard"))).toBe(false);
  });
});

describe("setDesk command (US-006, ADR-APP-02)", () => {
  it("replaces the desk and touches the update time only", () => {
    const setup = newSetup();
    const result = setDesk(setup, desk("desk.rect/gaming"), catalog, LATER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.desk).toEqual(desk("desk.rect/gaming"));
    expect(result.value).toEqual({ ...setup, desk: result.value.desk, updatedAt: LATER });
    expect(setup.desk.params.width).toBe(1400); // the previous setup is not changed
  });

  it("returns the same setup for the same desk: nothing to recompute (UX-4)", () => {
    const setup = newSetup();
    const result = setDesk(setup, desk("desk.rect/standard"), catalog, LATER);
    expect(result).toEqual({ ok: true, value: setup });
    expect(result.ok && result.value).toBe(setup);
  });

  it("refuses a desk the catalog cannot draw", () => {
    const setup = newSetup();
    const huge = { ...desk("desk.rect/standard"), params: { width: 9000 } };
    expect(setDesk(setup, huge, catalog, LATER)).toEqual({ ok: false, error: "unknownDesk" });
  });

  it("keeps every object where it is, relative to the centre of the desk (UX-16)", () => {
    const setup = fullSetup();
    expect(setup.objects.length).toBeGreaterThan(0);
    const result = setDesk(setup, desk("desk.rect/compact"), catalog, LATER);
    if (!result.ok) throw new Error("setDesk failed");
    // Same objects, same transforms: none removed, moved nor asked about.
    expect(result.value.objects).toBe(setup.objects);
    expect(result.value.objects.map((object) => object.transform)).toEqual(
      setup.objects.map((object) => object.transform),
    );
  });

  it("leaves an object off a smaller desk where it is: the alert rules will report it", () => {
    // Overflow alerts arrive with US-014 to US-016; the command only keeps the position, on
    // the real footprint of the new desk (the inner corner of an L is not desk).
    const setup = newSetup();
    const onLarge = setDesk(setup, desk("desk.rect/gaming"), catalog, NOW);
    if (!onLarge.ok) throw new Error("setDesk failed");
    const speakers = { x: 800, z: -200 };
    expect(inside(deskFootprint(deskSpecOf(catalog, onLarge.value.desk)!), 800, -200)).toBe(true);
    const onCompact = setDesk(onLarge.value, desk("desk.rect/compact"), catalog, LATER);
    if (!onCompact.ok) throw new Error("setDesk failed");
    const compact = deskFootprint(deskSpecOf(catalog, onCompact.value.desk)!);
    expect(inside(compact, speakers.x, speakers.z)).toBe(false);
    const corner = deskFootprint(deskSpecOf(catalog, desk("desk.corner/standard"))!);
    expect(inside(corner, -400, 500)).toBe(false);
  });
});
