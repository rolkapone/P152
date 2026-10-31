import { Box3, MeshPhysicalMaterial, MeshStandardMaterial, type BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import materialsFile from "../../../assets/catalog/materials/materials.json";
import studio from "../../../assets/catalog/scene/studio.json";
import deskCorner from "../../../assets/catalog/object-types/desk-corner.json";
import deskRect from "../../../assets/catalog/object-types/desk.json";
import {
  deskSpec,
  MaterialsFileSchema,
  ObjectTypeSchema,
  StudioSceneSchema,
  toStudioConfig,
  type DeskSpec,
} from "../../core";
import { deskLayout } from "../math/deskLayout";
import { buildDeskGeometries } from "./deskGeometry";
import { createMaterial } from "./materials";

const config = toStudioConfig(StudioSceneSchema.parse(studio));
const materials = MaterialsFileSchema.parse(materialsFile).materials;

const triangles = (geometry: BufferGeometry) =>
  (geometry.index?.count ?? geometry.getAttribute("position").count) / 3;

const types = [ObjectTypeSchema.parse(deskRect), ObjectTypeSchema.parse(deskCorner)];
/** The 7 desks of the catalog list (every preset of both desk entries) and the left L. */
const DESKS: [string, DeskSpec, number, number][] = types.flatMap((type) => [
  ...(type.presets ?? []).map((preset): [string, DeskSpec, number, number] => [
    `${type.id}/${preset.id}`,
    deskSpec(type, preset.params)!,
    type.budget.tris,
    type.budget.drawCalls,
  ]),
  ...(type.id === "desk.corner"
    ? [
        [
          "desk.corner/standard left",
          deskSpec(type, { orientation: "left" })!,
          type.budget.tris,
          type.budget.drawCalls,
        ] as [string, DeskSpec, number, number],
      ]
    : []),
]);

describe.each(DESKS)("desk geometry %s", (_, desk, tris, drawCalls) => {
  const { top, legs } = buildDeskGeometries(deskLayout(desk, config.desk.edgeRadiusMm));

  it("stays within the catalog budget (triangles, one draw call per material slot)", () => {
    expect(triangles(top) + triangles(legs)).toBeLessThanOrEqual(tris);
    expect(Object.keys(desk.materials)).toHaveLength(drawCalls);
  });

  it("matches the real dimensions within 1 mm (metres, origin on the floor)", () => {
    const box = new Box3().setFromBufferAttribute(top.getAttribute("position") as never);
    box.union(new Box3().setFromBufferAttribute(legs.getAttribute("position") as never));
    const w = desk.widthMm / 2000;
    const d = desk.depthMm / 2000;
    expect(Math.abs(box.min.x + w)).toBeLessThanOrEqual(0.001);
    expect(Math.abs(box.max.x - w)).toBeLessThanOrEqual(0.001);
    expect(Math.abs(box.min.z + d)).toBeLessThanOrEqual(0.001);
    expect(Math.abs(box.max.z - d)).toBeLessThanOrEqual(0.001);
    expect(Math.abs(box.min.y)).toBeLessThanOrEqual(0.001);
    expect(Math.abs(box.max.y - desk.heightMm / 1000)).toBeLessThanOrEqual(0.001);
  });

  it("leaves the inner corner of an L empty (beyond its 12 mm fillet)", () => {
    if (desk.shape !== "corner") return;
    const position = top.getAttribute("position");
    const side = desk.orientation === "right" ? -1 : 1;
    const notchX = (-side * (desk.widthMm / 2 - desk.wingWidthMm)) / 1000;
    const notchZ = (-desk.depthMm / 2 + desk.armDepthMm) / 1000;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const fillet = 0.013;
      const inNotch = side < 0 ? x < notchX - fillet : x > notchX + fillet;
      expect(inNotch && z > notchZ + fillet).toBe(false);
    }
  });
});

describe("createMaterial (catalog -> PBR)", () => {
  const byId = (id: string) => {
    const material = materials.find((entry) => entry.id === id);
    if (material === undefined) throw new Error(id);
    return material;
  };

  it("maps the desk materials to standard PBR materials", () => {
    const birch = createMaterial(byId("mat.birch"));
    expect(birch).toBeInstanceOf(MeshStandardMaterial);
    expect(birch).not.toBeInstanceOf(MeshPhysicalMaterial);
    expect(birch.color.getHexString()).toBe("e4cfa6");
    expect(birch.roughness).toBe(byId("mat.birch").roughness);
    expect(birch.transparent).toBe(false);
  });

  it("uses the physical material only for sheen / clearcoat, and keeps opacity and emission", () => {
    for (const material of materials) {
      const out = createMaterial(material);
      const physical = material.sheen !== undefined || material.clearcoat !== undefined;
      expect(out instanceof MeshPhysicalMaterial).toBe(physical);
      expect(out.transparent).toBe((material.opacity ?? 1) < 1);
      if (material.emissive !== undefined) expect(out.emissiveIntensity).toBeGreaterThan(0);
      out.dispose();
    }
  });
});
