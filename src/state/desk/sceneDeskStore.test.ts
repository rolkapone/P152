import { describe, expect, it } from "vitest";
import deskCorner from "../../../assets/catalog/object-types/desk-corner.json";
import deskRect from "../../../assets/catalog/object-types/desk.json";
import { deskSpec, ObjectTypeSchema } from "../../core";
import { createSceneDeskStore } from "./sceneDeskStore";

const rect = ObjectTypeSchema.parse(deskRect);
const corner = ObjectTypeSchema.parse(deskCorner);

describe("sceneDeskStore (desk shown by the 3D view)", () => {
  it("starts without a desk: the view draws the studio desk", () => {
    const store = createSceneDeskStore();
    expect(store.getState()).toMatchObject({ desk: null, revision: 0 });
  });

  it("applies a new desk once, and ignores the same desk applied again (UX-4)", () => {
    const store = createSceneDeskStore();
    const standard = deskSpec(rect)!;
    expect(store.getState().setDesk(standard)).toBe(true);
    expect(store.getState()).toMatchObject({ desk: standard, revision: 1 });
    // An equal desk built again (another object) is the same desk.
    expect(store.getState().setDesk(deskSpec(rect, { width: 1400, depth: 700 })!)).toBe(false);
    expect(store.getState().revision).toBe(1);
    const large = deskSpec(corner, { width: 1800, depth: 1600, armDepth: 700, wingWidth: 700 })!;
    expect(store.getState().setDesk(large)).toBe(true);
    expect(store.getState()).toMatchObject({ desk: large, revision: 2 });
  });

  it("counts every change of a burst (one reframing each)", () => {
    const store = createSceneDeskStore();
    const sizes = [1000, 1200, 1400, 1600, 1800];
    for (const width of sizes) store.getState().setDesk(deskSpec(rect, { width })!);
    expect(store.getState().revision).toBe(sizes.length);
  });
});
