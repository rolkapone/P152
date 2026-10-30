import { describe, expect, it, vi } from "vitest";
import type { PreferencesRepository, UiPreferences } from "../../core";
import { createPreferencesStore } from "./preferencesStore";

function repository(sceneTipDismissed: boolean): PreferencesRepository {
  return {
    load: vi.fn(() => ({ sceneTipDismissed, sidebarCollapsed: false, inspectorCollapsed: false })),
    save: vi.fn(),
  };
}

describe("preferences store", () => {
  it("shows the tip by default and keeps a dismissal for the session without a repository", () => {
    const store = createPreferencesStore();
    expect(store.getState().sceneTipDismissed).toBe(false);
    store.getState().dismissSceneTip();
    expect(store.getState().sceneTipDismissed).toBe(true);
  });

  it("loads the stored values when connected", () => {
    const store = createPreferencesStore();
    store.getState().connect(repository(true));
    expect(store.getState().sceneTipDismissed).toBe(true);
  });

  it("saves a dismissal once", () => {
    const store = createPreferencesStore();
    const repo = repository(false);
    store.getState().connect(repo);
    store.getState().dismissSceneTip();
    store.getState().dismissSceneTip();
    expect(store.getState().sceneTipDismissed).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith({
      sceneTipDismissed: true,
      sidebarCollapsed: false,
      inspectorCollapsed: false,
    });
  });

  it("remembers the collapsed panels, saving only real changes", () => {
    const store = createPreferencesStore();
    const repo = repository(false);
    store.getState().connect(repo);
    store.getState().setPanelCollapsed("sidebarCollapsed", false);
    expect(repo.save).not.toHaveBeenCalled();
    store.getState().setPanelCollapsed("inspectorCollapsed", true);
    expect(store.getState().inspectorCollapsed).toBe(true);
    expect(repo.save).toHaveBeenLastCalledWith({
      sceneTipDismissed: false,
      sidebarCollapsed: false,
      inspectorCollapsed: true,
    });
  });

  it("loads the collapsed panels, a missing value being open", () => {
    const store = createPreferencesStore();
    store.getState().connect({
      load: () => ({ sidebarCollapsed: true }) as unknown as UiPreferences,
      save: vi.fn(),
    });
    expect(store.getState().sidebarCollapsed).toBe(true);
    expect(store.getState().inspectorCollapsed).toBe(false);
    expect(store.getState().sceneTipDismissed).toBe(false);
  });
});
