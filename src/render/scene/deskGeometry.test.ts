import { Box3, MeshPhysicalMaterial, MeshStandardMaterial, type BufferGeometry } from "three";
import { describe, expect, it } from "vitest";
import materialsFile from "../../../assets/catalog/materials/materials.json";
import studio from "../../../assets/catalog/scene/studio.json";
import { MaterialsFileSchema, StudioSceneSchema, toStudioConfig } from "../../core";
import { deskLayout } from "../math/deskLayout";
import { buildDeskGeometries } from "./deskGeometry";
import { createMaterial } from "./materials";

const config = toStudioConfig(StudioSceneSchema.parse(studio));
const materials = MaterialsFileSchema.parse(materialsFile).materials;

const triangles = (geometry: BufferGeometry) =>
  (geometry.index?.count ?? geometry.getAttribute("position").count) / 3;

describe("desk geometry (desk.rect 140 x 70)", () => {
  const { top, legs } = buildDeskGeometries(deskLayout(config.desk));

  it("stays within the catalog budget (1500 triangles, 2 draw calls)", () => {
    expect(triangles(top) + triangles(legs)).toBeLessThanOrEqual(config.desk.budget.tris);
    // one geometry per material slot = one draw call each
    expect(Object.keys(config.desk.materials)).toHaveLength(config.desk.budget.drawCalls);
  });

  it("matches the real dimensions within 1 mm (metres, origin on the floor)", () => {
    const box = new Box3().setFromBufferAttribute(top.getAttribute("position") as never);
    box.union(new Box3().setFromBufferAttribute(legs.getAttribute("position") as never));
    expect(box.min.x).toBeCloseTo(-0.7, 3);
    expect(box.max.x).toBeCloseTo(0.7, 3);
    expect(box.min.z).toBeCloseTo(-0.35, 3);
    expect(box.max.z).toBeCloseTo(0.35, 3);
    expect(box.min.y).toBeCloseTo(0, 3);
    expect(box.max.y).toBeCloseTo(0.74, 3);
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
