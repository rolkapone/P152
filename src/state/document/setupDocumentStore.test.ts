import { describe, expect, it, vi } from "vitest";
import { bundledCatalog } from "../../../tests/unit/helpers/bundledCatalog";
import { createSetup, type SetupV1 } from "../../core";
import { connectSceneDesk } from "../desk/connectSceneDesk";
import { createSceneDeskStore } from "../desk/sceneDeskStore";
import { createSetupDocumentStore } from "./setupDocumentStore";

const catalog = bundledCatalog();
const NOW = "2026-10-31T10:00:00.000Z";
const LATER = "2026-10-31T10:05:00.000Z";

function newSetup(): SetupV1 {
  return createSetup(catalog, {
    id: "00000000-0000-4000-8000-000000000001",
    name: "My desk setup",
    now: NOW,
  })!;
}

function openStore() {
  const store = createSetupDocumentStore({ now: () => LATER });
  store.getState().open(catalog, newSetup());
  return store;
}

describe("setupDocumentStore (US-006)", () => {
  it("starts empty, then holds the catalog and the setup of the session", () => {
    const store = createSetupDocumentStore();
    expect(store.getState()).toMatchObject({ catalog: null, setup: null, failed: false });
    expect(store.getState().chooseDesk("desk.rect/large")).toBe(false);
    const setup = newSetup();
    store.getState().open(catalog, setup);
    expect(store.getState()).toMatchObject({ catalog, setup, failed: false });
    // A second open (React mounting twice) keeps the first document.
    store.getState().open(catalog, { ...setup, name: "Other" });
    expect(store.getState().setup).toBe(setup);
  });

  it("applies a desk once per change; the active desk again changes nothing (UX-4)", () => {
    const store = openStore();
    const changes = vi.fn();
    store.subscribe((state, previous) => {
      if (state.setup !== previous.setup) changes(state.setup);
    });
    expect(store.getState().chooseDesk("desk.corner/large")).toBe(true);
    expect(store.getState().setup?.desk.params).toMatchObject({ width: 1800, depth: 1600 });
    expect(store.getState().setup?.updatedAt).toBe(LATER);
    expect(store.getState().chooseDesk("desk.corner/large")).toBe(false);
    expect(store.getState().chooseDesk("desk.rect/none")).toBe(false);
    // One new setup reference per change: the alerts are recomputed once (UX-16).
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it("keeps the objects of the setup when the desk changes (UX-16)", () => {
    const store = openStore();
    const objects = store.getState().setup!.objects;
    store.getState().chooseDesk("desk.rect/compact");
    expect(store.getState().setup!.objects).toBe(objects);
  });

  it("reports a catalog that could not load", () => {
    const store = openStore();
    store.getState().fail();
    expect(store.getState()).toMatchObject({ catalog: null, setup: null, failed: true });
    expect(store.getState().chooseDesk("desk.rect/large")).toBe(false);
  });

  it("dates a change with the current time by default", () => {
    const store = createSetupDocumentStore();
    store.getState().open(catalog, newSetup());
    store.getState().chooseDesk("desk.rect/large");
    expect(Date.parse(store.getState().setup!.updatedAt)).not.toBeNaN();
  });
});

describe("connectSceneDesk (the 3D view follows setup.desk)", () => {
  it("applies the desk of the setup, then each new desk, until disconnected", () => {
    const document = createSetupDocumentStore({ now: () => LATER });
    const scene = createSceneDeskStore();
    const disconnect = connectSceneDesk(document, scene);
    expect(scene.getState().desk).toBeNull(); // no setup yet: the studio desk
    document.getState().open(catalog, newSetup());
    expect(scene.getState().desk).toMatchObject({ presetId: "standard", widthMm: 1400 });
    document.getState().chooseDesk("desk.corner/standard");
    expect(scene.getState().desk).toMatchObject({ shape: "corner", widthMm: 1600 });
    expect(scene.getState().revision).toBe(2);
    disconnect();
    document.getState().chooseDesk("desk.rect/compact");
    expect(scene.getState().desk).toMatchObject({ shape: "corner" });
  });

  it("applies at once a setup already open, and ignores a desk it cannot draw", () => {
    const document = openStore();
    const scene = createSceneDeskStore();
    connectSceneDesk(document, scene);
    expect(scene.getState().desk).toMatchObject({ widthMm: 1400 });
    const setup = document.getState().setup!;
    document.setState({ setup: { ...setup, desk: { ...setup.desk, catalogVersion: 9 } } });
    expect(scene.getState().desk).toMatchObject({ widthMm: 1400 });
    expect(scene.getState().revision).toBe(1);
  });

  it("uses the application stores by default", async () => {
    const { useSceneDesk } = await import("../desk/sceneDeskStore");
    const { useSetupDocument } = await import("./setupDocumentStore");
    const disconnect = connectSceneDesk();
    useSetupDocument.getState().open(catalog, newSetup());
    expect(useSceneDesk.getState().desk).toMatchObject({ widthMm: 1400 });
    disconnect();
  });
});
