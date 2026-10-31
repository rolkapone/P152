/**
 * The setup document of the session (ADR-APP-02 `documentStore`, first slice: US-006). The
 * setup is the only source of truth of the chosen desk: the 3D view follows it through
 * `connectSceneDesk`, the Desk panel and the announcements read it. History (US-019) and
 * persistence come later on top of the same `setup` reference.
 *
 * - `open(catalog, setup)`: the catalog and the setup of the session, once (a second call is
 *   ignored: React may mount the app twice in development).
 * - `fail()`: the catalog could not load; the Desk panel shows its error banner.
 * - `chooseDesk(choiceId)`: the `setDesk` command with a line of the desk list. Returns false
 *   and changes nothing for the active desk or an unknown line (UX-4). Objects are kept as
 *   they are (UX-16); the alerts, derived from the setup, are recomputed by whoever watches
 *   its reference, so exactly once per change.
 */
import { create } from "zustand";
import { deskForChoice, setDesk, type Catalog, type SetupV1 } from "../../core";

export interface SetupDocumentState {
  readonly catalog: Catalog | null;
  readonly setup: SetupV1 | null;
  /** The catalog could not load (no desk can be chosen). */
  readonly failed: boolean;
  open(catalog: Catalog, setup: SetupV1): void;
  fail(): void;
  chooseDesk(choiceId: string): boolean;
}

export interface SetupDocumentOptions {
  /** ISO 8601 time of a change (injected in tests). */
  readonly now?: () => string;
}

export function createSetupDocumentStore({
  now = () => new Date().toISOString(),
}: SetupDocumentOptions = {}) {
  return create<SetupDocumentState>()((set, get) => ({
    catalog: null,
    setup: null,
    failed: false,
    open(catalog, setup) {
      if (get().setup !== null) return;
      set({ catalog, setup, failed: false });
    },
    fail() {
      set({ catalog: null, setup: null, failed: true });
    },
    chooseDesk(choiceId) {
      const { catalog, setup } = get();
      if (catalog === null || setup === null) return false;
      const desk = deskForChoice(catalog, choiceId);
      if (desk === null) return false;
      const result = setDesk(setup, desk, catalog, now());
      if (!result.ok || result.value === setup) return false;
      set({ setup: result.value });
      return true;
    },
  }));
}

/** The application instance. */
export const useSetupDocument = createSetupDocumentStore();
