import { describe, expect, it } from "vitest";
import {
  EMBEDDED_CATALOG_FILES,
  embeddedCatalogSource,
  loadEmbeddedCatalog,
} from "./embeddedCatalogSource";

describe("embedded catalog (CatalogSource adapter)", () => {
  it("is valid as embedded in the bundle, with every file picked up", () => {
    const result = loadEmbeddedCatalog();
    expect(result.ok ? [] : result.error).toEqual([]);
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
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.objectTypes.get("desk.rect"))).toBe(true);
  });
});
