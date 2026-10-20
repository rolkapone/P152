/**
 * Catalog materials (assets/catalog/materials, ADR-3D-05) to three.js PBR materials. The
 * physical material is used only when a physical feature is declared (clearcoat, sheen).
 */
import { MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import type { Material } from "../../core";

export function createMaterial(material: Material): MeshStandardMaterial {
  const physical = material.clearcoat !== undefined || material.sheen !== undefined;
  const out = physical ? new MeshPhysicalMaterial() : new MeshStandardMaterial();
  out.name = material.id;
  out.color.set(material.baseColor);
  out.metalness = material.metalness;
  out.roughness = material.roughness;
  if (material.opacity !== undefined && material.opacity < 1) {
    out.transparent = true;
    out.opacity = material.opacity;
  }
  if (material.emissive !== undefined) {
    out.emissive.set(material.emissive);
    out.emissiveIntensity = material.emissiveIntensity ?? 1;
  }
  if (out instanceof MeshPhysicalMaterial) {
    out.clearcoat = material.clearcoat ?? 0;
    out.clearcoatRoughness = material.clearcoatRoughness ?? 0;
    out.sheen = material.sheen ?? 0;
    out.sheenRoughness = material.sheenRoughness ?? 1;
    if (material.sheenColor !== undefined) out.sheenColor.set(material.sheenColor);
  }
  return out;
}
