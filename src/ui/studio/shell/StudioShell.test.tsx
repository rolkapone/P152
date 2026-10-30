import { act, cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { axeViolations, renderWithI18n } from "../../../../tests/unit/helpers/ui";
import { useShellLayout } from "../../../state";
import { StudioShell } from "./StudioShell";

const initialLayout = useShellLayout.getState();

afterEach(() => {
  cleanup();
  useShellLayout.setState(initialLayout, true);
});

function renderShell() {
  return renderWithI18n(
    <StudioShell>
      <p>scene placeholder</p>
    </StudioShell>,
  );
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
});
