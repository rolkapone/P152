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
