// The catalog of assets/catalog for the jsdom tests (src/ui, src/state, src/app), where
// node:fs paths from import.meta.url are not available: the JSON files are imported through
// Vite, as the embedded catalog of the app does, then validated once.
import materials from "../../../assets/catalog/materials/materials.json";
import studio from "../../../assets/catalog/scene/studio.json";
import styles from "../../../assets/catalog/styles/styles.json";
import { validateCatalog, type Catalog } from "../../../src/core";

const objectTypes: Record<string, unknown> = import.meta.glob(
  "../../../assets/catalog/object-types/*.json",
  { eager: true, import: "default" },
);

let catalog: Catalog | null = null;

export function bundledCatalog(): Catalog {
  if (catalog === null) {
    const result = validateCatalog({
      objectTypes: Object.fromEntries(
        Object.entries(objectTypes).map(([path, raw]) => [
          path.slice(path.lastIndexOf("/") + 1),
          raw,
        ]),
      ),
      materials,
      studio,
      styles,
    });
    if (!result.ok) throw new Error(`catalog invalid: ${JSON.stringify(result.error)}`);
    catalog = result.value;
  }
  return catalog;
}
