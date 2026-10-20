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
}

export function createPreferencesStore() {
  let repository: PreferencesRepository | null = null;
  return create<PreferencesState>()((set, get) => ({
    sceneTipDismissed: false,

    connect(next) {
      repository = next;
      const loaded = next.load();
      set({ sceneTipDismissed: loaded.sceneTipDismissed === true });
    },
    dismissSceneTip() {
      if (get().sceneTipDismissed) return;
      set({ sceneTipDismissed: true });
      repository?.save({ sceneTipDismissed: true });
    },
  }));
}

/** The application instance. */
export const usePreferences = createPreferencesStore();
