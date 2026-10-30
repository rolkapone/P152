import { describe, expect, it } from "vitest";
import { createShellLayoutStore } from "./shellLayoutStore";

describe("shell layout store", () => {
  it("opens both panels on load", () => {
    const { leftOpen, rightOpen } = createShellLayoutStore().getState();
    expect([leftOpen, rightOpen]).toEqual([true, true]);
  });

  it("toggles each panel independently", () => {
    const store = createShellLayoutStore();
    store.getState().togglePanel("left");
    expect([store.getState().leftOpen, store.getState().rightOpen]).toEqual([false, true]);
    store.getState().togglePanel("right");
    store.getState().togglePanel("left");
    expect([store.getState().leftOpen, store.getState().rightOpen]).toEqual([true, false]);
  });

  it("opens a panel without closing an open one", () => {
    const store = createShellLayoutStore();
    store.getState().togglePanel("right");
    store.getState().openPanel("right");
    store.getState().openPanel("right");
    expect(store.getState().rightOpen).toBe(true);
    expect(store.getState().leftOpen).toBe(true);
  });
});
