import AxeBuilder from "@axe-core/playwright";
import { deskChoices } from "../../src/core";
import { testCatalog } from "../unit/helpers/fixtures";
import { expect, test, type Page } from "./fixtures";
import { chooseDesk, deskGroup, deskRadio, expectDeskDrawn } from "./helpers/desk";
import { expectDeskInFreeZone } from "./helpers/framing";
import { waitForScene } from "./helpers/perf";

// US-006 Desk panel through the real UI (UX-1 to UX-15), production CSP (fixtures).

const DESKS = deskChoices(testCatalog());
const desk = (id: string) => DESKS.find((choice) => choice.id === id)!;
const STANDARD = desk("desk.rect/standard");
const live = (page: Page) =>
  page.getByRole("group", { name: /3D view of your desk/ }).getByRole("status");
const sidebar = (page: Page) => page.getByRole("complementary", { name: "Desk and objects" });

async function open(page: Page) {
  await page.goto("/");
  await waitForScene(page);
}

/** Freezes the page clock far enough ahead (see scene-ui.spec.ts). */
async function pauseClock(page: Page) {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 60_000);
}

test("lists the 7 desks, 140 × 70 checked, summary in cm and mm (UX-1, UX-2, UX-3, UX-8)", async ({
  page,
}) => {
  await open(page);
  await expect(page.getByRole("heading", { name: "Choose your desk" })).toBeVisible();
  await expect(deskGroup(page).getByRole("radio")).toHaveCount(7);
  for (const choice of DESKS) await expect(deskRadio(page, choice)).toBeVisible();
  await expect(deskGroup(page).getByRole("radio", { checked: true })).toHaveCount(1);
  await expect(deskRadio(page, STANDARD)).toBeChecked();
  await expect(deskRadio(page, STANDARD)).toHaveAccessibleDescription("Height 74 cm");
  const summary = page.getByRole("region", { name: "Selected" });
  await expect(summary).toContainText("Standard desk, 140 × 70 cm");
  await expect(summary).toContainText("1400 × 700 × 740 mm");
  for (const row of await deskGroup(page).locator("label").all()) {
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(56);
  }
  await expect(sidebar(page).getByRole("textbox")).toHaveCount(0);
  await expect(sidebar(page)).not.toContainText(/custom size|use this desk/i);
});

test("keyboard: one Tab stop, arrows / Home / End apply and reframe, focus stays (UX-2, UX-5, UX-10)", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("tab", { name: "Desk" }).focus();
  await page.keyboard.press("Tab");
  await expect(deskRadio(page, STANDARD)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(deskRadio(page, desk("desk.rect/large"))).toBeChecked();
  await expect(deskRadio(page, desk("desk.rect/large"))).toBeFocused();
  await expectDeskDrawn(page, desk("desk.rect/large"));
  await expectDeskInFreeZone(page);
  await page.keyboard.press("End");
  await expect(deskRadio(page, desk("desk.corner/large"))).toBeFocused();
  await expectDeskDrawn(page, desk("desk.corner/large"));
  await expectDeskInFreeZone(page);
  await page.keyboard.press("Home");
  await expect(deskRadio(page, desk("desk.rect/compact"))).toBeChecked();
  await expectDeskDrawn(page, desk("desk.rect/compact"));
  await expectDeskInFreeZone(page);
  await page.keyboard.press("ArrowUp"); // loops to the last line
  await expect(deskRadio(page, desk("desk.corner/large"))).toBeChecked();
  await page.keyboard.press("Tab"); // one Tab stop: out of the group
  await expect(deskGroup(page).getByRole("radio").and(page.locator(":focus"))).toHaveCount(0);
});

test("announces once, 400 ms after a burst of arrows; nothing for the active desk (UX-4, UX-7)", async ({
  page,
}) => {
  await page.clock.install();
  await open(page);
  await expect(live(page)).toHaveText("3D view ready. Desk 140 by 70 cm.");
  await pauseClock(page);
  await deskGroup(page).getByText("Standard desk", { exact: true }).click();
  await page.clock.runFor(800);
  await expect(live(page)).toHaveText("3D view ready. Desk 140 by 70 cm.");

  await deskRadio(page, STANDARD).focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowDown");
  await expect(deskRadio(page, desk("desk.rect/compact"))).toBeChecked();
  await page.clock.runFor(399);
  await expect(live(page)).toHaveText("3D view ready. Desk 140 by 70 cm.");
  await page.clock.runFor(1);
  await expect(live(page)).toHaveText("Compact desk selected. 100 by 60 cm.");
  await page.clock.resume();
});

for (const size of [
  { width: 375, height: 812 },
  { width: 820, height: 1180 },
  { width: 683, height: 384 }, // 1366 x 768 at 200 % zoom
]) {
  test(`drawer at ${size.width} x ${size.height}: no clipped text nor horizontal scroll (UX-13)`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await open(page);
    await page.getByRole("button", { name: "Desk and objects panel", exact: true }).click();
    await expect(sidebar(page)).toBeVisible();
    const overflow = await sidebar(page).evaluate((pane) => {
      const clipped = [...pane.querySelectorAll("label > span > span, section p, h2, h3")].filter(
        (node) => node.scrollWidth > node.clientWidth + 1,
      );
      return { horizontal: pane.scrollWidth - pane.clientWidth, clipped: clipped.length };
    });
    expect(overflow).toEqual({ horizontal: 0, clipped: 0 });
    // The last line is reached by scrolling the panel, and applies.
    await chooseDesk(page, desk("desk.corner/large"));
  });
}

test("usable without WebGL 2; the choice survives Try again (UX-12)", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2") return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...args);
    } as typeof original;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "The 3D view can't start" })).toBeVisible();
  await deskGroup(page).getByText("Gaming desk", { exact: true }).click();
  await expect(deskRadio(page, desk("desk.rect/gaming"))).toBeChecked();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(deskRadio(page, desk("desk.rect/gaming"))).toBeChecked();
  expect(errors).toEqual([]);
});

for (const scheme of ["light", "dark"] as const) {
  test(`no accessibility violation in the Desk panel, ${scheme} (axe, contrast included)`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await open(page);
    await deskRadio(page, STANDARD).focus();
    const results = await new AxeBuilder({ page })
      .include('[aria-label="Desk and objects"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}
