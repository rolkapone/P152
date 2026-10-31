import { describe, expect, it, vi } from "vitest";
import { VIEW_SHORTCUTS, viewCommandForKey, type KeyLike, type ViewCommand } from "./commands";
import { createSceneViewStore, type ViewController } from "./sceneViewStore";

const key = (value: string, modifiers: Partial<KeyLike> = {}): KeyLike => ({
  key: value,
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  ...modifiers,
});

describe("viewCommandForKey (3D view focused)", () => {
  it.each([
    ["ArrowLeft", { type: "turn", direction: "left" }],
    ["ArrowRight", { type: "turn", direction: "right" }],
    ["ArrowUp", { type: "turn", direction: "up" }],
    ["ArrowDown", { type: "turn", direction: "down" }],
    ["+", { type: "zoom", direction: "in" }],
    ["=", { type: "zoom", direction: "in" }],
    ["-", { type: "zoom", direction: "out" }],
    ["_", { type: "zoom", direction: "out" }],
    ["0", { type: "view", view: "reset" }],
    ["1", { type: "view", view: "top" }],
    ["2", { type: "view", view: "front" }],
  ])("%s", (value, command) => {
    expect(viewCommandForKey(key(value))).toEqual(command);
  });

  it("Shift + arrows move the view", () => {
    expect(viewCommandForKey(key("ArrowLeft", { shiftKey: true }))).toEqual({
      type: "move",
      direction: "left",
    });
    expect(viewCommandForKey(key("ArrowDown", { shiftKey: true }))).toEqual({
      type: "move",
      direction: "down",
    });
  });

  it("accepts Shift for digits and + (keyboard layouts that need it)", () => {
    expect(viewCommandForKey(key("1", { shiftKey: true }))).toEqual({ type: "view", view: "top" });
    expect(viewCommandForKey(key("+", { shiftKey: true }))).toEqual({
      type: "zoom",
      direction: "in",
    });
  });

  it.each([
    ["Tab", {}],
    ["Enter", {}],
    ["3", {}],
    ["a", {}],
    ["ArrowLeft", { altKey: true }],
    ["ArrowLeft", { ctrlKey: true }],
    ["+", { ctrlKey: true }], // browser zoom stays the browser's
    ["0", { metaKey: true }],
  ])("leaves %s %o to the browser", (value, modifiers) => {
    expect(viewCommandForKey(key(value, modifiers))).toBeNull();
  });

  it("does not read inherited keys of the shortcut table", () => {
    expect(viewCommandForKey(key("toString"))).toBeNull();
    expect(Object.keys(VIEW_SHORTCUTS)).toEqual(["0", "1", "2"]);
  });
});

function readyStore(result = { limitReached: false }) {
  const store = createSceneViewStore();
  const run = vi.fn<ViewController["run"]>(() => result);
  const detach = store.getState().attachController({ run });
  store.getState().setStatus("ready");
  return { store, run, detach };
}

describe("sceneViewStore", () => {
  it("counts consecutive failed starts, reset by a ready view only", () => {
    const store = createSceneViewStore();
    expect(store.getState().failures).toBe(0);
    store.getState().setStatus("failed");
    store.getState().setStatus("failed"); // same status: not a new failure
    expect(store.getState().failures).toBe(1);
    store.getState().retry();
    store.getState().setStatus("failed");
    expect(store.getState().failures).toBe(2);
    store.getState().retry();
    store.getState().setStatus("unsupported");
    expect(store.getState().failures).toBe(2);
    store.getState().setStatus("ready");
    expect(store.getState().failures).toBe(0);
  });

  it("starts loading, with no active view", () => {
    const state = createSceneViewStore().getState();
    expect(state).toMatchObject({ status: "loading", activeView: null, attempt: 0 });
    expect(state.lastEvent).toBeNull();
    expect(state.deskSizeMm).toBeNull();
  });

  it("ignores commands while the view is not ready or has no controller", () => {
    const store = createSceneViewStore();
    expect(store.getState().showView("top")).toBe(false);
    const run = vi.fn(() => ({ limitReached: false }));
    store.getState().attachController({ run });
    expect(store.getState().showView("top")).toBe(false); // still loading
    expect(run).not.toHaveBeenCalled();
    store.getState().setStatus("ready");
    store.getState().attachController({ run })();
    expect(store.getState().showView("top")).toBe(false); // detached
  });

  it("Top / Front become the active view, Reset view clears it", () => {
    const { store, run } = readyStore();
    expect(store.getState().showView("top")).toBe(true);
    expect(store.getState().activeView).toBe("top");
    store.getState().showView("front");
    expect(store.getState().activeView).toBe("front");
    store.getState().showView("reset");
    expect(store.getState().activeView).toBeNull();
    expect(run).toHaveBeenCalledTimes(3);
  });

  it.each<ViewCommand>([
    { type: "turn", direction: "left" },
    { type: "zoom", direction: "in" },
    { type: "move", direction: "up" },
  ])("a keyboard change of the view clears the active view (%o)", (command) => {
    const { store } = readyStore();
    store.getState().showView("top");
    store.getState().runViewCommand(command, "keyboard");
    expect(store.getState().activeView).toBeNull();
  });

  it("a drag or a wheel zoom clears the active view", () => {
    const { store } = readyStore();
    store.getState().showView("front");
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.getState().notifyPointerViewChange();
    expect(store.getState().activeView).toBeNull();
    store.getState().notifyPointerViewChange(); // no change, no notification
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("publishes one event per command, for the announcements", () => {
    const { store } = readyStore({ limitReached: true });
    store.getState().runViewCommand({ type: "zoom", direction: "in" }, "keyboard");
    const first = store.getState().lastEvent;
    expect(first).toMatchObject({
      command: { type: "zoom", direction: "in" },
      source: "keyboard",
      limitReached: true,
    });
    store.getState().showView("top");
    expect(store.getState().lastEvent?.seq).toBe((first?.seq ?? 0) + 1);
    expect(store.getState().lastEvent?.source).toBe("toolbar");
  });

  it("retry() remounts the view: new attempt, loading, controller dropped", () => {
    const { store, run } = readyStore();
    store.getState().showView("top");
    store.getState().setStatus("contextLost");
    store.getState().retry();
    expect(store.getState()).toMatchObject({ status: "loading", attempt: 1, activeView: null });
    store.getState().setStatus("ready");
    expect(store.getState().showView("front")).toBe(false);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("a stale controller cannot detach its successor", () => {
    const { store, detach } = readyStore();
    const run = vi.fn(() => ({ limitReached: false }));
    store.getState().attachController({ run });
    detach();
    expect(store.getState().showView("top")).toBe(true);
    expect(run).toHaveBeenCalledOnce();
  });

  it("stores the desk size and status only when they change", () => {
    const store = createSceneViewStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().setDeskSize({ width: 1400, depth: 700 });
    store.getState().setDeskSize({ width: 1400, depth: 700 });
    store.getState().setStatus("loading");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getState().deskSizeMm).toEqual({ width: 1400, depth: 700 });
    store.getState().setDeskSize({ width: 1600, depth: 700 });
    expect(store.getState().deskSizeMm?.width).toBe(1600);
  });
});
