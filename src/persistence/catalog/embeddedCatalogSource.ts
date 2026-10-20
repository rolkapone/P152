/**
 * Catalog embedded in the bundle (ADR-APP-09 `CatalogSource`, MVP adapter): the
 * technical-artist JSON files of assets/catalog, picked up at build time by Vite. A new
 * object type is added by dropping a file in assets/catalog/object-types/, no code change.
 * Lives in persistence/ because it depends on the bundler (`import.meta.glob`); the pure
 * validation stays in core/catalog (ADR-APP-10).
 */
import materials from "../../../assets/catalog/materials/materials.json";
import studio from "../../../assets/catalog/scene/studio.json";
import styles from "../../../assets/catalog/styles/styles.json";
import {
  validateCatalog,
  type Catalog,
  type CatalogFiles,
  type CatalogIssue,
  type CatalogSource,
  type Result,
} from "../../core";

const objectTypeModules: Record<string, unknown> = import.meta.glob(
  "../../../assets/catalog/object-types/*.json",
  { eager: true, import: "default" },
);

function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

export const EMBEDDED_CATALOG_FILES: CatalogFiles = {
  objectTypes: Object.fromEntries(
    Object.entries(objectTypeModules).map(([path, raw]) => [fileName(path), raw]),
  ),
  materials,
  styles,
  studio,
};

let cached: Result<Catalog, readonly CatalogIssue[]> | null = null;

/** Validates the embedded catalog once and memoises the result. */
export function loadEmbeddedCatalog(): Result<Catalog, readonly CatalogIssue[]> {
  cached ??= validateCatalog(EMBEDDED_CATALOG_FILES);
  return cached;
}

export const embeddedCatalogSource: CatalogSource = {
  load: () => Promise.resolve(loadEmbeddedCatalog()),
};
