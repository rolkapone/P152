// Test helpers shared by core unit tests (Node environment).
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEmbeddedCatalog, type Catalog, type CatalogFiles } from "../../../src/core/catalog";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
export const SETUP_FIXTURES = join(ROOT, "tests/fixtures/setups/v1");
export const CATALOG_DIR = join(ROOT, "assets/catalog");

export function testCatalog(): Catalog {
  const result = loadEmbeddedCatalog();
  if (!result.ok) throw new Error(`embedded catalog invalid: ${JSON.stringify(result.error)}`);
  return result.value;
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

/** `[name, text]` of every fixture in a sub-folder (valid, invalid, malicious). */
export function fixtures(folder: "valid" | "invalid" | "malicious"): [string, string][] {
  const dir = join(SETUP_FIXTURES, folder);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => [basename(name, ".json"), readText(join(dir, name))]);
}

export function fixture(folder: "valid" | "invalid" | "malicious", name: string): string {
  return readText(join(SETUP_FIXTURES, folder, `${name}.json`));
}

/** Catalog files read from disk with JSON.parse (own `__proto__` keys stay visible). */
export function readCatalogFiles(): CatalogFiles {
  const typesDir = join(CATALOG_DIR, "object-types");
  const parse = (path: string): unknown => JSON.parse(readText(path));
  return {
    objectTypes: Object.fromEntries(
      readdirSync(typesDir)
        .filter((name) => name.endsWith(".json"))
        .map((name) => [name, parse(join(typesDir, name))]),
    ),
    materials: parse(join(CATALOG_DIR, "materials/materials.json")),
    styles: parse(join(CATALOG_DIR, "styles/styles.json")),
    studio: parse(join(CATALOG_DIR, "scene/studio.json")),
  };
}
