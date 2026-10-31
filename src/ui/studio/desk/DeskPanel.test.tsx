import { act, cleanup, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bundledCatalog } from "../../../../tests/unit/helpers/bundledCatalog";
import { axeViolations, renderWithI18n } from "../../../../tests/unit/helpers/ui";
import { defaultDeskChoiceId, deskChoices } from "../../../core";
import { DeskPanel } from "./DeskPanel";
import { thumbPoints, thumbScale, THUMB_BOX } from "./DeskThumb";

const catalog = bundledCatalog();
const CHOICES = deskChoices(catalog);
const DEFAULT = defaultDeskChoiceId(catalog);

afterEach(cleanup);

/** The panel with its value held like the app does (one change per applied line). */
function Harness({ onChange }: { readonly onChange: (id: string) => void }) {
  const [value, setValue] = useState(DEFAULT);
  return (
    <DeskPanel
      choices={CHOICES}
      value={value}
      onChange={(id) => {
        onChange(id);
        setValue(id);
      }}
    />
  );
}

function renderPanel() {
  const onChange = vi.fn<(id: string) => void>();
  const view = renderWithI18n(<Harness onChange={onChange} />);
  const group = screen.getByRole("radiogroup", { name: "Desk model" });
  const radios = () => within(group).getAllByRole("radio");
  return { ...view, onChange, group, radios };
}

const checked = (radios: HTMLElement[]) =>
  radios.filter((radio) => (radio as HTMLInputElement).checked);

describe("DeskPanel (UX US-006)", () => {
  it("shows the title, the help and the 7 desk models, size then name (UX-1, UX-17)", () => {
    const { radios } = renderPanel();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Choose your desk");
    expect(screen.getByText("Pick the model closest to yours.")).toBeTruthy();
    // Accessible name = visible text (UX-14); the thumbnail is decorative.
    expect(radios().map((radio) => radio.closest("label")?.textContent)).toEqual([
      "100 × 60 cmCompact desk",
      "120 × 60 cmBasic desk",
      "140 × 70 cmStandard desk",
      "160 × 80 cmLarge desk",
      "180 × 80 cmGaming desk",
      "160 × 140 cmCorner desk",
      "180 × 160 cmCorner desk large",
    ]);
  });

  it("starts on 140 × 70 with exactly one checked line and one Tab stop (UX-2, UX-3)", () => {
    const { radios } = renderPanel();
    expect(checked(radios()).map((radio) => radio.closest("label")?.textContent)).toEqual([
      "140 × 70 cmStandard desk",
    ]);
    expect(radios().filter((radio) => radio.tabIndex === 0)).toHaveLength(1);
    expect(checked(radios())[0]!.tabIndex).toBe(0);
  });

  it("describes each line by its height (UX-14)", () => {
    const { radios } = renderPanel();
    for (const radio of radios()) {
      const id = radio.getAttribute("aria-describedby")!.split(" ").at(-1)!;
      expect(document.getElementById(id)?.textContent).toBe("Height 74 cm");
    }
  });

  it("applies a line on click, and the active line again does nothing (UX-4)", async () => {
    const user = userEvent.setup();
    const { radios, onChange } = renderPanel();
    await user.click(screen.getByText("Gaming desk"));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("desk.rect/gaming");
    expect(checked(radios())).toEqual([radios()[4]]);
    await user.click(screen.getByText("Gaming desk"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("applies with the arrows (looping), Home and End; focus stays on the line (UX-5)", async () => {
    const user = userEvent.setup();
    const { radios, onChange } = renderPanel();
    await user.tab();
    expect(document.activeElement).toBe(radios()[2]);
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith("desk.rect/large");
    expect(document.activeElement).toBe(radios()[3]);
    await user.keyboard("{ArrowUp}{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("desk.rect/basic");
    // Home / End through fireEvent: user-event moves a text caret on them (not in jsdom).
    act(() => void fireEvent.keyDown(document.activeElement!, { key: "End" }));
    expect(onChange).toHaveBeenLastCalledWith("desk.corner/large");
    expect(document.activeElement).toBe(radios()[6]);
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith("desk.rect/compact");
    act(() => void fireEvent.keyDown(document.activeElement!, { key: "End" }));
    act(() => void fireEvent.keyDown(document.activeElement!, { key: "Home" }));
    expect(onChange).toHaveBeenLastCalledWith("desk.rect/compact");
    expect(document.activeElement).toBe(radios()[0]);
    expect(checked(radios())).toEqual([radios()[0]]);
    const calls = onChange.mock.calls.length;
    // Space on the active line, Home on the first one: nothing new.
    await user.keyboard(" ");
    act(() => void fireEvent.keyDown(document.activeElement!, { key: "Home" }));
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it("sums up the active desk in cm and mm (UX-8)", async () => {
    const user = userEvent.setup();
    renderPanel();
    const summary = screen.getByRole("region", { name: "Selected" });
    expect(summary.textContent).toBe(
      "SelectedStandard desk, 140 × 70 cm1400 × 700 × 740 mmWidth × depth × height",
    );
    await user.click(screen.getByText("Corner desk large"));
    expect(summary.textContent).toContain("Corner desk large, 180 × 160 cm");
    expect(summary.textContent).toContain("1800 × 1600 × 740 mm");
  });

  it("marks the active line by a check, not by the colour alone (UX-6)", () => {
    renderPanel();
    const label = (text: string) => screen.getByText(text).closest("label")!;
    expect(label("Standard desk").hasAttribute("data-selected")).toBe(true);
    expect(label("Compact desk").hasAttribute("data-selected")).toBe(false);
    for (const name of ["Standard desk", "Compact desk"]) {
      expect(label(name).querySelector('[data-icon="check"]')).not.toBeNull();
    }
  });

  it("draws decorative thumbnails at a common scale, the corner desk as an L (UX-9)", () => {
    renderPanel();
    const thumbs = [...document.querySelectorAll("svg[data-shape]")];
    expect(thumbs).toHaveLength(7);
    for (const thumb of thumbs) expect(thumb.getAttribute("aria-hidden")).toBe("true");
    const points = thumbs.map((thumb) => thumb.querySelector("polygon")!.getAttribute("points")!);
    expect(points.map((list) => list.split(" ").length)).toEqual([4, 4, 4, 4, 4, 6, 6]);
    // Common scale: the width drawn follows the real width.
    const width = (list: string) => {
      const xs = list.split(" ").map((point) => Number(point.split(",")[0]));
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(width(points[4]!) / width(points[0]!)).toBeCloseTo(1800 / 1000, 2);
  });

  it("fits the largest desk in the thumbnail box", () => {
    const specs = CHOICES.map(({ spec }) => spec);
    const scale = thumbScale(specs);
    const largest = CHOICES.at(-1)!.spec;
    const coords = thumbPoints(largest, scale)
      .split(" ")
      .map((point) => point.split(",").map(Number));
    for (const [x, y] of coords) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(THUMB_BOX.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(THUMB_BOX.height);
    }
    expect(thumbScale([])).toBe(0);
  });

  it("has no input, no 'Custom size' and no button in the list (UX-15)", () => {
    const { container } = renderPanel();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.textContent).not.toMatch(/custom size|use this desk/i);
    // No jargon in the visible text (UX-17).
    expect(container.textContent).not.toMatch(/preset|catalog|mesh|orbit|pan\b|camera/i);
  });

  it("has no accessibility violation (axe)", async () => {
    const { container } = renderPanel();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("DeskPanel when the desks cannot load", () => {
  it("shows an alert with a reload button instead of the list and the summary", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    const { container } = renderWithI18n(
      <DeskPanel choices={null} value={null} onChange={vi.fn()} onReload={onReload} />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("Desks couldn't loadReload the page to try again.Reload page");
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.queryByRole("region", { name: "Selected" })).toBeNull();
    await user.click(within(alert).getByRole("button", { name: "Reload page" }));
    expect(onReload).toHaveBeenCalledOnce();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("reloads the page by default", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    renderWithI18n(<DeskPanel choices={null} value={null} onChange={vi.fn()} />);
    await act(async () => {
      await userEvent.setup().click(screen.getByRole("button", { name: "Reload page" }));
    });
    expect(reload).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
