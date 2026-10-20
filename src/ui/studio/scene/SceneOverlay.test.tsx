import { act, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axeViolations, renderWithI18n } from "../../../../tests/unit/helpers/ui";
import type { PreferencesRepository } from "../../../core";
import common from "../../../locales/en/common.json";
import { usePreferences, useSceneView, type ViewController } from "../../../state";
import { TOOLTIP_DELAY_MS } from "../../components/Tooltip";
import { SceneOverlay } from "./SceneOverlay";

const initialView = useSceneView.getState();
const initialPreferences = usePreferences.getState();
let controller: ViewController & { run: ReturnType<typeof vi.fn> };
let detach: () => void;

beforeEach(() => {
  useSceneView.setState(initialView, true);
  usePreferences.setState(initialPreferences, true);
  controller = { run: vi.fn(() => ({ limitReached: false })) };
  detach = useSceneView.getState().attachController(controller);
});

afterEach(() => {
  cleanup();
  detach();
  vi.useRealTimers();
});

// Real timers by default (user-event + Testing Library wait on real timers); the tests of
// the 600 ms announcements use fake timers without user-event.
const user = () => userEvent.setup();
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const settle = async () => {
  if (vi.isFakeTimers()) wait(0);
  else await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
};
const liveRegion = () => screen.getByRole("status");

async function renderReady() {
  const view = renderWithI18n(<SceneOverlay />);
  act(() => {
    useSceneView.getState().setDeskSize({ width: 1400, depth: 700 });
    useSceneView.getState().setStatus("ready");
  });
  await settle();
  return view;
}

const toolbar = () => screen.getByRole("toolbar", { name: "View" });
const button = (name: string) => screen.getByRole("button", { name });

describe("loading (UX-1)", () => {
  it("shows the message and a progress bar, no view bar, and announces it", async () => {
    vi.useFakeTimers();
    const { container } = renderWithI18n(<SceneOverlay />);
    expect(screen.getByText("Loading 3D scene…")).toBeTruthy();
    const progress = screen.getByRole("progressbar", { name: "Loading 3D scene…" });
    expect(progress).toBeTruthy();
    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(liveRegion().textContent).toBe(""); // empty first: changes are what is read
    wait(0);
    expect(liveRegion().textContent).toBe("Loading 3D scene…");
    expect(liveRegion().getAttribute("aria-live")).toBe("polite");
    vi.useRealTimers();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('announces "3D view ready. Desk 140 by 70 cm." once ready', async () => {
    await renderReady();
    expect(liveRegion().textContent).toBe("3D view ready. Desk 140 by 70 cm.");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});

describe("view bar (UX-2, UX-4, UX-5)", () => {
  it("has Reset view, Top and Front with visible labels and icons", async () => {
    const { container } = await renderReady();
    const buttons = within(toolbar()).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Reset view", "Top", "Front"]);
    for (const b of buttons) {
      expect(b.querySelector("svg[aria-hidden='true']")).not.toBeNull();
      expect(b.getAttribute("aria-label")).toBeNull(); // the visible text is the name
    }
    expect(button("Reset view").hasAttribute("aria-pressed")).toBe(false);
    expect(button("Top").getAttribute("aria-pressed")).toBe("false");
    expect(button("Front").getAttribute("aria-pressed")).toBe("false");
    vi.useRealTimers();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("Top: runs the view, is the only pressed button, shows a check and announces it", async () => {
    await renderReady();
    await user().click(button("Top"));
    expect(controller.run).toHaveBeenCalledWith({ type: "view", view: "top" });
    expect(button("Top").getAttribute("aria-pressed")).toBe("true");
    expect(button("Front").getAttribute("aria-pressed")).toBe("false");
    expect(button("Top").querySelector("[data-icon='check']")).not.toBeNull();
    expect(liveRegion().textContent).toBe("Top view.");

    await user().click(button("Front"));
    expect(button("Top").getAttribute("aria-pressed")).toBe("false");
    expect(button("Front").getAttribute("aria-pressed")).toBe("true");
    expect(liveRegion().textContent).toBe("Front view.");

    await user().click(button("Reset view"));
    expect(controller.run).toHaveBeenLastCalledWith({ type: "view", view: "reset" });
    expect(button("Front").getAttribute("aria-pressed")).toBe("false");
    expect(liveRegion().textContent).toBe("View reset.");
  });

  it("works with Enter and Space", async () => {
    await renderReady();
    act(() => button("Top").focus());
    await user().keyboard("{Enter}");
    expect(button("Top").getAttribute("aria-pressed")).toBe("true");
    act(() => button("Front").focus());
    await user().keyboard(" ");
    expect(button("Front").getAttribute("aria-pressed")).toBe("true");
  });

  it("pressing the active view again keeps it pressed and announces it again", async () => {
    await renderReady();
    await user().click(button("Top"));
    const first = liveRegion().firstElementChild;
    await user().click(button("Top"));
    expect(button("Top").getAttribute("aria-pressed")).toBe("true");
    expect(liveRegion().textContent).toBe("Top view.");
    expect(liveRegion().firstElementChild).not.toBe(first); // new node: read again
  });

  it("releases the pressed view after a drag or a wheel zoom", async () => {
    await renderReady();
    await user().click(button("Top"));
    act(() => useSceneView.getState().notifyPointerViewChange());
    expect(button("Top").getAttribute("aria-pressed")).toBe("false");
    expect(liveRegion().textContent).toBe("Top view."); // nothing said for a drag
  });

  it("shows a tooltip after 400 ms of hover, linked with aria-describedby", async () => {
    await renderReady();
    // React Aria shows the next tooltips at once for a short while after one was shown
    // ("warm" state, possibly left by an earlier test): start cold.
    await act(() => new Promise((resolve) => setTimeout(resolve, 600)));
    const start = performance.now();
    await user().hover(button("Top"));
    expect(screen.queryByRole("tooltip")).toBeNull();
    const tooltip = await screen.findByRole("tooltip", {}, { timeout: 2000 });
    expect(performance.now() - start).toBeGreaterThanOrEqual(TOOLTIP_DELAY_MS - 20);
    expect(tooltip.textContent).toBe("View from above (1)");
    expect(button("Top").getAttribute("aria-describedby")).toBe(tooltip.getAttribute("id"));
  });

  it("shows each tooltip with its shortcut on keyboard focus; Escape closes it and keeps the focus", async () => {
    await renderReady();
    const u = user();
    const hints: string[] = [];
    act(() => button("Front").focus()); // programmatic: no tooltip
    // Keyboard moves: Shift+Tab to Top, Shift+Tab to Reset view, Tab, Tab back to Front.
    const steps = [
      ["{Shift>}{Tab}{/Shift}", "Top"],
      ["{Shift>}{Tab}{/Shift}", "Reset view"],
      ["{Tab}", "Top"],
      ["{Tab}", "Front"],
    ] as const;
    for (const [keys, name] of steps) {
      await u.keyboard(keys);
      expect(document.activeElement).toBe(button(name));
      hints.push((await screen.findByRole("tooltip", {}, { timeout: 2000 })).textContent ?? "");
      await u.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).toBeNull();
      expect(document.activeElement).toBe(button(name));
    }
    expect(hints).toEqual([
      "View from above (1)",
      "Reset view (0)",
      "View from above (1)",
      "View from the front (2)",
    ]);
  });

  it("the arrow keys also move between the buttons", async () => {
    await renderReady();
    act(() => button("Reset view").focus());
    await user().keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(button("Top"));
    await user().keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(button("Front"));
  });
});

describe("tab order and tip (UX-3, UX-11)", () => {
  it("Tab goes Reset view, Top, Front, Got it, Hide tip", async () => {
    await renderReady();
    act(() => button("Reset view").focus());
    const order = [document.activeElement];
    for (let i = 0; i < 4; i++) {
      await user().tab();
      order.push(document.activeElement);
    }
    expect(
      order.map((element) => element?.textContent || element?.getAttribute("aria-label")),
    ).toEqual(["Reset view", "Top", "Front", "Got it", "Hide tip"]);
  });

  it.each(["Got it", "Hide tip"])(
    "%s hides the tip for good and moves the focus to Reset view",
    async (name) => {
      const repository: PreferencesRepository = {
        load: () => ({ sceneTipDismissed: false }),
        save: vi.fn(),
      };
      usePreferences.getState().connect(repository);
      await renderReady();
      expect(
        screen.getByText("Drag to turn the view, scroll to zoom, right-drag to move the view."),
      ).toBeTruthy();
      act(() => button(name).focus());
      await user().keyboard("{Enter}");
      expect(screen.queryByText(/Drag to turn the view/)).toBeNull();
      expect(document.activeElement).toBe(button("Reset view"));
      expect(repository.save).toHaveBeenCalledWith({ sceneTipDismissed: true });
      expect(toolbar()).toBeTruthy();
    },
  );

  it("is not shown again once dismissed (stored preference)", async () => {
    usePreferences.getState().connect({ load: () => ({ sceneTipDismissed: true }), save: vi.fn() });
    await renderReady();
    expect(screen.queryByText(/Drag to turn the view/)).toBeNull();
    expect(toolbar()).toBeTruthy();
  });
});

describe("keyboard announcements (UX-8)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("announces a run of steps once, 600 ms after the last key", async () => {
    await renderReady();
    const run = (direction: "left" | "right") =>
      act(() => useSceneView.getState().runViewCommand({ type: "turn", direction }, "keyboard"));
    run("right");
    wait(400);
    run("right");
    wait(599);
    expect(liveRegion().textContent).toBe("3D view ready. Desk 140 by 70 cm.");
    wait(1);
    expect(liveRegion().textContent).toBe("View turned 30 degrees right.");
  });

  it("announces the zoom limit reached from the keyboard", async () => {
    await renderReady();
    controller.run.mockReturnValue({ limitReached: true });
    act(() =>
      useSceneView.getState().runViewCommand({ type: "zoom", direction: "in" }, "keyboard"),
    );
    wait(600);
    expect(liveRegion().textContent).toBe("Zoom limit reached.");
  });

  it("announces 0 / 1 / 2 at once and drops the pending steps", async () => {
    await renderReady();
    act(() =>
      useSceneView.getState().runViewCommand({ type: "zoom", direction: "in" }, "keyboard"),
    );
    act(() => useSceneView.getState().runViewCommand({ type: "view", view: "front" }, "keyboard"));
    expect(liveRegion().textContent).toBe("Front view.");
    wait(1000);
    expect(liveRegion().textContent).toBe("Front view.");
  });
});

describe("3D unavailable and stopped (UX-13)", () => {
  it.each([
    ["unsupported", "The 3D view can't start", /doesn't support 3D graphics \(WebGL 2\)/],
    ["failed", "The 3D view can't start", /doesn't support 3D graphics \(WebGL 2\)/],
    ["contextLost", "The 3D view stopped", /graphics connection was lost/],
  ] as const)("%s: alert with the title focused and Try again", async (status, title, body) => {
    const { container } = renderWithI18n(<SceneOverlay />);
    act(() => useSceneView.getState().setStatus(status));
    const alert = screen.getByRole("alert");
    const heading = within(alert).getByRole("heading", { name: title });
    expect(document.activeElement).toBe(heading);
    expect(within(alert).getByText(body)).toBeTruthy();
    expect(alert.textContent).not.toMatch(/Deskfit|P152/);
    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(screen.queryByText(/Drag to turn the view/)).toBeNull();

    vi.useRealTimers();
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(useSceneView.getState().status).toBe("loading");
    expect(useSceneView.getState().attempt).toBe(1);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("focuses the title again when a new attempt fails", () => {
    renderWithI18n(<SceneOverlay />);
    act(() => useSceneView.getState().setStatus("unsupported"));
    act(() => {
      useSceneView.getState().retry();
      useSceneView.getState().setStatus("unsupported");
    });
    expect(document.activeElement?.textContent).toBe("The 3D view can't start");
  });
});

describe("wording (UX-15)", () => {
  it("never uses 3D jargon in the texts of the 3D view", () => {
    const texts = JSON.stringify(common.scene);
    expect(texts).not.toMatch(/\b(orbit|orbiting|pan|panning|mesh|meshes|camera)\b/i);
  });
});
