import { describe, expect, it, vi } from "vitest";
import type { PreferencesRepository } from "../../core";
import { createPreferencesStore } from "./preferencesStore";

function repository(sceneTipDismissed: boolean): PreferencesRepository {
  return { load: vi.fn(() => ({ sceneTipDismissed })), save: vi.fn() };
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
    expect(repo.save).toHaveBeenCalledWith({ sceneTipDismissed: true });
  });
});
