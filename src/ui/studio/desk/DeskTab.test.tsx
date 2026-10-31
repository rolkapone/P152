import { act, cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bundledCatalog } from "../../../../tests/unit/helpers/bundledCatalog";
import { axeViolations, renderWithI18n } from "../../../../tests/unit/helpers/ui";
import { createSetup, defaultDesk } from "../../../core";
import { connectSceneDesk, useSceneDesk, useSceneView, useSetupDocument } from "../../../state";
import { SceneAnnouncer } from "../scene/SceneAnnouncer";
import { DESK_ANNOUNCE_DELAY_MS, describeDesk } from "../scene/deskAnnouncement";
import { DeskTab } from "./DeskTab";

const catalog = bundledCatalog();
const initialDocument = useSetupDocument.getState();
const initialSceneDesk = useSceneDesk.getState();
const initialView = useSceneView.getState();
let disconnect: () => void;

function openDocument() {
  const setup = createSetup(catalog, {
    id: "00000000-0000-4000-8000-000000000001",
    name: "My desk setup",
    now: "2026-10-31T10:00:00.000Z",
  })!;
  useSetupDocument.getState().open(catalog, { ...setup, desk: defaultDesk(catalog)! });
}

beforeEach(() => {
  vi.useFakeTimers();
  useSetupDocument.setState(initialDocument, true);
  useSceneDesk.setState(initialSceneDesk, true);
  useSceneView.setState(initialView, true);
  disconnect = connectSceneDesk();
});

afterEach(() => {
  cleanup();
  disconnect();
  vi.useRealTimers();
});

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
// Fake timers for the 400 ms announcement: fireEvent rather than user-event (which waits on
// real timers), as in SceneOverlay.test.tsx.
const click = (text: string) => act(() => void fireEvent.click(screen.getByText(text)));
const press = (key: string) => act(() => void fireEvent.keyDown(document.activeElement!, { key }));
const announced = () => screen.getByRole("status").textContent;

function renderTab() {
  const view = renderWithI18n(
    <>
      <DeskTab />
      <SceneAnnouncer />
    </>,
  );
  wait(0); // first status message of the live region ("Loading 3D scene…")
  return view;
}

const radio = (name: RegExp) => screen.getByRole("radio", { name });

describe("Desk tab wired to the setup (US-006)", () => {
  it("starts on the default desk of the catalog, in the panel and the 3D view (UX-3)", () => {
    openDocument();
    renderTab();
    expect((radio(/140 × 70 cm/) as HTMLInputElement).checked).toBe(true);
    expect(useSceneDesk.getState().desk).toMatchObject({ widthMm: 1400, depthMm: 700 });
    expect(screen.getByRole("region", { name: "Selected" }).textContent).toContain(
      "1400 × 700 × 740 mm",
    );
  });

  it("a click changes setup.desk and the 3D view at once, announced after 400 ms (UX-4, UX-7)", () => {
    openDocument();
    renderTab();
    const objects = useSetupDocument.getState().setup!.objects;
    click("Gaming desk");
    expect(useSetupDocument.getState().setup!.desk.params).toMatchObject({ width: 1800 });
    expect(useSetupDocument.getState().setup!.objects).toBe(objects);
    expect(useSceneDesk.getState().desk).toMatchObject({ widthMm: 1800, depthMm: 800 });
    wait(DESK_ANNOUNCE_DELAY_MS - 1);
    expect(announced()).toBe("Loading 3D scene…");
    wait(1);
    expect(announced()).toBe("Gaming desk selected. 180 by 80 cm.");
  });

  it("announces a burst of 5 arrows once, with the last desk (UX-7)", () => {
    openDocument();
    renderTab();
    act(() => radio(/140 × 70 cm/).focus());
    for (let i = 0; i < 5; i++) {
      press("ArrowDown");
      wait(DESK_ANNOUNCE_DELAY_MS - 100);
      expect(announced()).toBe("Loading 3D scene…");
    }
    // Every arrow applied its desk (5 changes in the 3D view), one announcement.
    expect(useSceneDesk.getState().revision).toBe(6);
    wait(100);
    expect(announced()).toBe("Compact desk selected. 100 by 60 cm.");
    expect(document.activeElement).toBe(radio(/100 × 60 cm/));
  });

  it("clicking the active desk changes and announces nothing (UX-4)", () => {
    openDocument();
    renderTab();
    const setup = useSetupDocument.getState().setup;
    click("Standard desk");
    wait(DESK_ANNOUNCE_DELAY_MS * 2);
    expect(useSetupDocument.getState().setup).toBe(setup);
    expect(useSceneDesk.getState().revision).toBe(1);
    expect(announced()).toBe("Loading 3D scene…");
  });

  it("stays usable while the 3D view has failed (UX-12)", () => {
    openDocument();
    renderTab();
    act(() => useSceneView.getState().setStatus("failed"));
    click("Corner desk");
    expect(useSceneDesk.getState().desk).toMatchObject({ shape: "corner" });
    wait(DESK_ANNOUNCE_DELAY_MS);
    expect(announced()).toBe("Corner desk selected. 160 by 140 cm.");
  });

  it("shows the error banner when the catalog could not load", async () => {
    useSetupDocument.getState().fail();
    const { container } = renderTab();
    expect(within(screen.getByRole("alert")).getByText("Desks couldn't load")).toBeTruthy();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    vi.useRealTimers();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("shows the title only before the setup is open", () => {
    renderTab();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Choose your desk");
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("describeDesk", () => {
  it("names a desk off the list after its catalog entry, and skips unknown desks", () => {
    const desk = defaultDesk(catalog)!;
    expect(describeDesk(catalog, desk)).toEqual({
      name: "Standard desk",
      widthMm: 1400,
      depthMm: 700,
    });
    const custom = { ...desk, params: { ...desk.params, width: 1450 } };
    expect(describeDesk(catalog, custom)).toEqual({ name: "Desk", widthMm: 1450, depthMm: 700 });
    expect(describeDesk(catalog, { ...desk, catalogId: "desk.none" })).toBeNull();
  });
});
