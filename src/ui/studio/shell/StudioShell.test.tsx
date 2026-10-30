import { act, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { axeViolations, renderWithI18n } from "../../../../tests/unit/helpers/ui";
import { usePreferences, useShellLayout } from "../../../state";
import { StudioShell } from "./StudioShell";

const initialLayout = useShellLayout.getState();
const initialPreferences = usePreferences.getState();

afterEach(() => {
  cleanup();
  useShellLayout.setState(initialLayout, true);
  usePreferences.setState(initialPreferences, true);
});

function renderShell() {
  return renderWithI18n(
    <StudioShell>
      <p>scene placeholder</p>
    </StudioShell>,
  );
}

/** Stands for the focusable 3D view of render/ (same role, tabindex and status attribute). */
function FakeView() {
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- mimics the 3D view region
  return <div role="group" aria-label="3D view" tabIndex={0} data-scene-status="ready" />;
}

const toggle = (name: string) => screen.getByRole("button", { name });
const LEFT = "Desk and objects panel";
const RIGHT = "Properties and alerts panel";

describe("StudioShell (W2, design v0.4)", () => {
  it("has one banner, one main, two named complementary landmarks and one h1 (UX-3)", async () => {
    const { container } = renderShell();
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    const asides = screen
      .getAllByRole("complementary")
      .map((aside) => aside.getAttribute("aria-label"));
    expect(asides).toEqual(["Desk and objects", "Properties and alerts"]);
    expect(screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent)).toEqual([
      "Deskfit",
    ]);
    expect(within(screen.getByRole("main")).getByText("scene placeholder")).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("keeps the DOM order header, left panel, scene, right panel", () => {
    renderShell();
    const order = [
      screen.getByRole("banner"),
      screen.getByRole("complementary", { name: "Desk and objects" }),
      screen.getByRole("main"),
      screen.getByRole("complementary", { name: "Properties and alerts" }),
    ];
    for (let i = 1; i < order.length; i += 1) {
      const previous = order[i - 1];
      const current = order[i];
      if (!previous || !current) throw new Error("missing landmark");
      expect(
        previous.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("shows the toolbar: toggles, wordmark, document name and the empty verdict", () => {
    renderShell();
    const toolbar = screen.getByRole("banner");
    const name = within(toolbar).getByText("My desk setup");
    expect(name.getAttribute("title")).toBe("My desk setup");
    const verdict = within(toolbar).getByRole("status");
    expect(verdict.textContent).toBe("Nothing to check yet");
    expect(verdict.hasAttribute("tabindex")).toBe(false);
    expect(verdict.querySelector("svg[data-icon='circle-dashed']")).not.toBeNull();
    const buttons = within(toolbar)
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label"));
    expect(buttons).toEqual([LEFT, RIGHT]);
  });

  it("renders no dead control: no Undo, Redo, File, Help, Saved nor Alert settings (UX-12)", () => {
    const { container } = renderShell();
    const text = container.textContent ?? "";
    for (const word of ["Undo", "Redo", "File", "Help", "Saved", "Alert settings"]) {
      expect(text).not.toContain(word);
      expect(container.querySelector(`[aria-label*="${word}"]`)).toBeNull();
    }
  });

  it("collapses and expands each panel from its toggle; the name stays, the focus too (UX-6)", async () => {
    const user = userEvent.setup();
    renderShell();
    const left = toggle(LEFT);
    const sidebar = document.getElementById(left.getAttribute("aria-controls") ?? "");
    expect(sidebar?.getAttribute("aria-label")).toBe("Desk and objects");
    expect(left.getAttribute("aria-expanded")).toBe("true");
    expect(sidebar?.hasAttribute("inert")).toBe(false);

    await user.click(left);
    expect(toggle(LEFT)).toBe(left);
    expect(left.getAttribute("aria-expanded")).toBe("false");
    expect(sidebar?.getAttribute("data-open")).toBe("false");
    expect(sidebar?.hasAttribute("inert")).toBe(true);
    expect(document.activeElement).toBe(left);
    expect(toggle(RIGHT).getAttribute("aria-expanded")).toBe("true");

    await user.keyboard("{Enter}");
    expect(left.getAttribute("aria-expanded")).toBe("true");
    expect(sidebar?.hasAttribute("inert")).toBe(false);

    const right = toggle(RIGHT);
    const inspector = document.getElementById(right.getAttribute("aria-controls") ?? "");
    expect(inspector?.getAttribute("aria-label")).toBe("Properties and alerts");
    await user.click(right);
    expect(right.getAttribute("aria-expanded")).toBe("false");
    expect(inspector?.hasAttribute("inert")).toBe(true);
  });

  it("tells what a toggle will do in a tooltip shown at once on keyboard focus (UX-20)", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.tab(); // Skip to 3D view
    await user.tab(); // Skip to alerts
    await user.tab();
    expect(document.activeElement).toBe(toggle(LEFT));
    expect((await screen.findByRole("tooltip", {}, { timeout: 2000 })).textContent).toBe(
      "Hide panel",
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(document.activeElement).toBe(toggle(LEFT));
    await user.keyboard("{Enter}");
    await user.tab();
    await user.tab({ shift: true });
    expect((await screen.findByRole("tooltip", {}, { timeout: 2000 })).textContent).toBe(
      "Show panel",
    );
  });

  it("keeps the dock's free zone of the load when a panel collapses (UX §2.3)", async () => {
    const user = userEvent.setup();
    renderShell();
    const main = screen.getByRole("main");
    expect(main.dataset.freeLeft).toBe("panel");
    expect(main.dataset.freeRight).toBe("panel");
    await user.click(toggle(LEFT));
    await user.click(toggle(RIGHT));
    expect(main.dataset.freeLeft).toBe("panel");
    expect(main.dataset.freeRight).toBe("panel");
  });

  it("starts from the panels open on load to place the dock", () => {
    act(() => useShellLayout.setState({ leftOpen: false }));
    renderShell();
    expect(screen.getByRole("main").dataset.freeLeft).toBe("none");
    expect(screen.getByRole("main").dataset.freeRight).toBe("panel");
  });

  it("switches Desk / Objects with a segmented tab list; Desk is selected on load (UX-10)", async () => {
    const user = userEvent.setup();
    renderShell();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Desk", "Objects"]);
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(["true", "false"]);
    expect(screen.getByRole("tabpanel").textContent).toContain("Desk");

    await user.click(tabs[0] as HTMLElement);
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Objects" }).getAttribute("aria-selected")).toBe("true");
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByRole("heading", { level: 2 }).textContent).toBe("Objects");
    expect(panel.textContent).toContain("No objects to add yet");
    expect(panel.textContent).toContain("The object library will appear here.");
    expect(panel.querySelector("a, button")).toBeNull();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Desk" }).getAttribute("aria-selected")).toBe("true");
  });

  it("shows Properties then Alerts with their empty states (UX-11)", () => {
    renderShell();
    const inspector = screen.getByRole("complementary", { name: "Properties and alerts" });
    const sections = within(inspector).getAllByRole("region");
    expect(sections.map((section) => section.getAttribute("aria-labelledby"))).toHaveLength(2);
    const [properties, alerts] = sections;
    expect(within(properties as HTMLElement).getByRole("heading", { level: 2 }).textContent).toBe(
      "Properties",
    );
    expect(properties?.textContent).toContain("Nothing selected");
    expect(properties?.textContent).toContain("Select an object to edit its size and position.");
    const alertsTitle = within(alerts as HTMLElement).getByRole("heading", { level: 2 });
    expect(alertsTitle.textContent).toBe("Alerts");
    expect(alertsTitle.getAttribute("tabindex")).toBe("-1");
    expect(alerts?.textContent).toContain("Nothing to check yet");
    expect(alerts?.textContent).toContain("Add an object to see if it fits.");
    expect(inspector.querySelector("a, button")).toBeNull();
  });

  it("starts the Tab order with the skip links, then both toggles, the tab, its panel, the view (UX-4, UX-5)", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <StudioShell>
        <FakeView />
      </StudioShell>,
    );
    const names: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      await user.tab();
      const active = document.activeElement as HTMLElement;
      names.push(
        active.getAttribute("aria-label") ??
          active.getAttribute("role") ??
          active.textContent ??
          "",
      );
    }
    expect(names).toEqual([
      "Skip to 3D view",
      "Skip to alerts",
      LEFT,
      RIGHT,
      "tab",
      "tabpanel",
      "3D view",
    ]);
    const positive = [...document.querySelectorAll("[tabindex]")].filter(
      (element) => Number(element.getAttribute("tabindex")) > 0,
    );
    expect(positive).toEqual([]);
  });

  it("Skip to 3D view focuses the 3D view; Skip to alerts opens the right panel and focuses Alerts (UX-4)", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <StudioShell>
        <FakeView />
      </StudioShell>,
    );
    await user.click(toggle(RIGHT));
    expect(toggle(RIGHT).getAttribute("aria-expanded")).toBe("false");
    await user.click(screen.getByRole("link", { name: "Skip to 3D view" }));
    expect(document.activeElement).toBe(screen.getByRole("group", { name: "3D view" }));
    await user.click(screen.getByRole("link", { name: "Skip to alerts" }));
    expect(toggle(RIGHT).getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Alerts" }));
  });

  it("Skip to 3D view falls back on the error title, then on the main region", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithI18n(
      <StudioShell>
        <h2 tabIndex={-1}>error</h2>
      </StudioShell>,
    );
    await user.click(screen.getByRole("link", { name: "Skip to 3D view" }));
    expect(document.activeElement?.textContent).toBe("error");
    rerender(<StudioShell>{null}</StudioShell>);
    await user.click(screen.getByRole("link", { name: "Skip to 3D view" }));
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });

  it("remembers a collapsed panel in the display preferences (wide window, UX-6)", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(toggle(LEFT));
    expect(usePreferences.getState().sidebarCollapsed).toBe(true);
    await user.click(toggle(LEFT));
    expect(usePreferences.getState().sidebarCollapsed).toBe(false);
  });

  it("narrow window: drawers closed, one open at a time, Escape closes and returns the focus (UX-9)", async () => {
    const user = userEvent.setup();
    act(() => useShellLayout.getState().setNarrow(true));
    renderShell();
    expect(toggle(LEFT).getAttribute("aria-expanded")).toBe("false");
    expect(toggle(RIGHT).getAttribute("aria-expanded")).toBe("false");
    await user.click(toggle(LEFT));
    await user.click(toggle(RIGHT));
    expect(toggle(LEFT).getAttribute("aria-expanded")).toBe("false");
    expect(toggle(RIGHT).getAttribute("aria-expanded")).toBe("true");
    act(() => screen.getByRole("heading", { name: "Alerts" }).focus());
    await user.keyboard("{Escape}");
    expect(toggle(RIGHT).getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle(RIGHT));
    expect(usePreferences.getState().inspectorCollapsed).toBe(false);
    expect(screen.getByRole("main").dataset.freeLeft).toBe("none");
  });

  it("Escape in a docked panel does nothing", async () => {
    const user = userEvent.setup();
    renderShell();
    act(() => screen.getByRole("heading", { name: "Alerts" }).focus());
    await user.keyboard("{Escape}");
    expect(toggle(RIGHT).getAttribute("aria-expanded")).toBe("true");
  });

  it("publishes the free zone for the camera framing, following the open panels", async () => {
    const user = userEvent.setup();
    renderShell();
    const zone = () => useShellLayout.getState().freeZone;
    // jsdom has no layout: the measured sizes are 0, the rule is what matters here.
    expect(zone()).toEqual({ top: 0, left: 0, right: 0, width: 0, height: 0 });
    const aside = screen.getByRole("complementary", { name: "Desk and objects" });
    Object.defineProperty(aside, "offsetWidth", { configurable: true, value: 248 });
    await user.click(toggle(LEFT));
    expect(zone().left).toBe(0);
    await user.click(toggle(LEFT));
    expect(zone().left).toBe(248);
    act(() => useShellLayout.getState().setNarrow(true));
    expect(zone().left).toBe(0);
  });

  it("follows the window across 1024 px", () => {
    const listeners: ((event: { matches: boolean }) => void)[] = [];
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
        listeners.push(listener),
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      const { unmount } = renderShell();
      act(() => listeners.forEach((listener) => listener({ matches: true })));
      expect(useShellLayout.getState().narrow).toBe(true);
      expect(toggle(LEFT).getAttribute("aria-expanded")).toBe("false");
      act(() => listeners.forEach((listener) => listener({ matches: false })));
      expect(toggle(LEFT).getAttribute("aria-expanded")).toBe("true");
      unmount();
    } finally {
      window.matchMedia = original;
    }
  });
});
