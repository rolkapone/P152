/**
 * Ports (ADR-APP-09): interfaces implemented by adapters chosen in `app/services.ts`.
 * Only ports whose shape is already clear are declared; the others (ProductCatalog,
 * ShareService, AuthService, AssetStorage) stay reserved in the ADR table.
 */
import type { Catalog, CatalogIssue } from "../catalog/validate";
import type { ImportError } from "../io/errors";
import type { Result } from "../result";
import type { SetupV1 } from "../schema/setupV1";

/** Source of the object catalog (MVP: JSON embedded in the bundle). */
export interface CatalogSource {
  load(): Promise<Result<Catalog, readonly CatalogIssue[]>>;
}

export type PersistenceErrorCode = "quotaExceeded" | "unavailable";

/** Storage of the current setup (MVP adapter: localStorage, US-018). */
export interface SetupRepository {
  /** `null` when nothing is stored. Stored data always goes through `parseSetup`. */
  loadCurrent(): Promise<Result<SetupV1 | null, ImportError>>;
  saveCurrent(setup: SetupV1): Promise<Result<void, { readonly code: PersistenceErrorCode }>>;
  clear(): Promise<void>;
}

/** Display preferences of this browser: never in the setup, never in the history. */
export interface UiPreferences {
  /** The 3D view tip ("Drag to turn the view…") was dismissed (US-004, reopened by Help in US-025). */
  readonly sceneTipDismissed: boolean;
  /** The left panel (Desk and objects) was collapsed on a wide screen (US-005, UX-6). */
  readonly sidebarCollapsed: boolean;
  /** The right panel (Properties and alerts) was collapsed on a wide screen (US-005, UX-6). */
  readonly inspectorCollapsed: boolean;
}

/**
 * Storage of the display preferences (MVP adapter: localStorage). Synchronous on purpose:
 * read once at start-up, before the first render (no flash of the tip). Never throws: an
 * unavailable or full storage falls back to the defaults and the app keeps working.
 */
export interface PreferencesRepository {
  load(): UiPreferences;
  save(preferences: UiPreferences): void;
}
