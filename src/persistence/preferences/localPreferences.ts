/**
 * `PreferencesRepository` on `localStorage` (ADR-APP-04: the only layer that touches Storage).
 * One key per flag, value "1" when set: nothing is parsed, any other stored value is the
 * default. Every access is guarded: storage disabled (privacy mode, sandboxed iframe →
 * SecurityError), full (QuotaExceededError) or absent never breaks the app.
 */
import type { PreferencesRepository, UiPreferences } from "../../core";

export const PREFERENCE_KEYS = {
  sceneTipDismissed: "p152:v1:pref:sceneTipDismissed",
  sidebarCollapsed: "p152:v1:pref:sidebarCollapsed",
  inspectorCollapsed: "p152:v1:pref:inspectorCollapsed",
} as const satisfies Record<keyof UiPreferences, string>;

export const DEFAULT_PREFERENCES: UiPreferences = Object.freeze({
  sceneTipDismissed: false,
  sidebarCollapsed: false,
  inspectorCollapsed: false,
});

const FLAGS = Object.keys(PREFERENCE_KEYS) as (keyof UiPreferences)[];

/** Storage-like subset used here (tests pass an in-memory or failing stub). */
export type PreferenceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): PreferenceStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // throws when storage is blocked (or without a window)
  }
}

export function createLocalPreferences(
  getStorage: () => PreferenceStorage | null = browserStorage,
): PreferencesRepository {
  return {
    load() {
      try {
        const storage = getStorage();
        if (storage === null) return DEFAULT_PREFERENCES;
        const flag = (name: keyof UiPreferences) => storage.getItem(PREFERENCE_KEYS[name]) === "1";
        return {
          sceneTipDismissed: flag("sceneTipDismissed"),
          sidebarCollapsed: flag("sidebarCollapsed"),
          inspectorCollapsed: flag("inspectorCollapsed"),
        };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    },
    save(preferences) {
      for (const name of FLAGS) {
        try {
          const storage = getStorage();
          if (storage === null) return;
          if (preferences[name]) storage.setItem(PREFERENCE_KEYS[name], "1");
          else storage.removeItem(PREFERENCE_KEYS[name]);
        } catch {
          // Not stored: the preference lasts for this session only.
        }
      }
    },
  };
}
