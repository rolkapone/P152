/**
 * Display preferences of this browser (ADR-APP-02 session family): loaded once from the
 * `PreferencesRepository` chosen by app/, saved on change. Without a repository (tests,
 * storage-less contexts) the values live for the session only.
 */
import { create } from "zustand";
import type { PreferencesRepository, UiPreferences } from "../../core";

export interface PreferencesState extends UiPreferences {
  /** app/ only: loads the stored values and saves the next changes there. */
  connect(repository: PreferencesRepository): void;
  /** "Got it" / "Hide tip" of the 3D view tip: hidden for good (PO decision 2026-10-19). */
  dismissSceneTip(): void;
  /** Collapse state of a side panel on a wide screen (the shell layout calls it, UX-6). */
  setPanelCollapsed(panel: "sidebarCollapsed" | "inspectorCollapsed", collapsed: boolean): void;
}

const values = (state: UiPreferences): UiPreferences => ({
  sceneTipDismissed: state.sceneTipDismissed,
  sidebarCollapsed: state.sidebarCollapsed,
  inspectorCollapsed: state.inspectorCollapsed,
});

export function createPreferencesStore() {
  let repository: PreferencesRepository | null = null;
  return create<PreferencesState>()((set, get) => {
    const update = (change: Partial<UiPreferences>) => {
      set(change);
      repository?.save(values(get()));
    };
    return {
      sceneTipDismissed: false,
      sidebarCollapsed: false,
      inspectorCollapsed: false,

      connect(next) {
        repository = next;
        const loaded = next.load();
        set({
          sceneTipDismissed: loaded.sceneTipDismissed === true,
          sidebarCollapsed: loaded.sidebarCollapsed === true,
          inspectorCollapsed: loaded.inspectorCollapsed === true,
        });
      },
      dismissSceneTip() {
        if (get().sceneTipDismissed) return;
        update({ sceneTipDismissed: true });
      },
      setPanelCollapsed(panel, collapsed) {
        if (get()[panel] === collapsed) return;
        update({ [panel]: collapsed });
      },
    };
  });
}

/** The application instance. */
export const usePreferences = createPreferencesStore();
