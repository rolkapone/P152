import { describe, expect, it, vi } from "vitest";
import type { UiPreferences } from "../../core";
import { createPreferencesStore } from "../preferences/preferencesStore";
import { createShellLayoutStore, EMPTY_FREE_ZONE } from "./shellLayoutStore";

function setup(stored: Partial<UiPreferences> = {}) {
  const preferences = createPreferencesStore();
  const save = vi.fn();
  preferences.getState().connect({
    load: () => ({
      sceneTipDismissed: false,
      sidebarCollapsed: false,
      inspectorCollapsed: false,
      ...stored,
    }),
    save,
  });
  const store = createShellLayoutStore(preferences);
  store.getState().setNarrow(false);
  return { store, preferences, save };
}

const open = (store: ReturnType<typeof setup>["store"]) => [
  store.getState().leftOpen,
  store.getState().rightOpen,
];

describe("shell layout store", () => {
  it("opens both panels by default (application instance included)", async () => {
    expect(open(setup().store)).toEqual([true, true]);
    const { useShellLayout } = await import("./shellLayoutStore");
    expect(useShellLayout.getState().narrow).toBe(false);
  });

  it("wide: toggles each panel independently and remembers the choice (UX-6)", () => {
    const { store, preferences, save } = setup();
    store.getState().togglePanel("left");
    expect(open(store)).toEqual([false, true]);
    expect(preferences.getState().sidebarCollapsed).toBe(true);
    store.getState().togglePanel("right");
    store.getState().togglePanel("left");
    expect(open(store)).toEqual([true, false]);
    expect(preferences.getState().inspectorCollapsed).toBe(true);
    expect(save).toHaveBeenCalledTimes(3);
  });

  it("wide: starts from the remembered panels", () => {
    expect(open(setup({ sidebarCollapsed: true }).store)).toEqual([false, true]);
    expect(open(setup({ inspectorCollapsed: true }).store)).toEqual([true, false]);
  });

  it("opens a panel without closing an open one, and does nothing twice", () => {
    const { store, save } = setup({ inspectorCollapsed: true });
    store.getState().openPanel("right");
    store.getState().openPanel("right");
    expect(open(store)).toEqual([true, true]);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("narrow: drawers closed on load, one at a time, never remembered (UX-9)", () => {
    const { store, save } = setup();
    store.getState().setNarrow(true);
    expect(open(store)).toEqual([false, false]);
    store.getState().openPanel("left");
    expect(open(store)).toEqual([true, false]);
    store.getState().togglePanel("right");
    expect(open(store)).toEqual([false, true]);
    store.getState().closePanel("right");
    expect(open(store)).toEqual([false, false]);
    expect(save).not.toHaveBeenCalled();
  });

  it("back to wide: the remembered panels come back", () => {
    const { store } = setup({ sidebarCollapsed: true });
    store.getState().setNarrow(true);
    store.getState().openPanel("left");
    store.getState().setNarrow(false);
    expect(open(store)).toEqual([false, true]);
    expect(store.getState().narrow).toBe(false);
  });

  it("keeps the measured free zone, replaced only when it changes", () => {
    const { store } = setup();
    expect(store.getState().freeZone).toEqual(EMPTY_FREE_ZONE);
    const zone = { top: 52, left: 248, right: 312, width: 1366, height: 768 };
    store.getState().setFreeZone(zone);
    const first = store.getState().freeZone;
    expect(first).toEqual(zone);
    expect(Object.isFrozen(first)).toBe(true);
    store.getState().setFreeZone({ ...zone });
    expect(store.getState().freeZone).toBe(first);
    store.getState().setFreeZone({ ...zone, left: 0 });
    expect(store.getState().freeZone.left).toBe(0);
  });
});
