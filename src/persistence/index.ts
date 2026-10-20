/** Adapters of the core ports (ADR-APP-09); instantiated by app/ only. */
export {
  EMBEDDED_CATALOG_FILES,
  embeddedCatalogSource,
  loadEmbeddedCatalog,
} from "./catalog/embeddedCatalogSource";
export {
  createLocalPreferences,
  DEFAULT_PREFERENCES,
  PREFERENCE_KEYS,
  type PreferenceStorage,
} from "./preferences/localPreferences";
