import { expect, test, type Page } from "./fixtures";
import { deskRect, expectDeskInFreeZone, frames, type Rect } from "./helpers/framing";
import { waitForScene } from "./helpers/perf";

// US-005 UX-8 (graphics-engineer): on load and after Reset view / Top / Front, the whole desk
// is drawn in the free zone between the docked panels and under the toolbar, with a margin of
// at least 24 px; collapsing or opening a panel never moves the camera (UX-7), the next view
// command uses the new zone. Reduced motion (playwright.config.ts): views jump at once.

const LEFT_TOGGLE = "Desk and objects panel";
const RIGHT_TOGGLE = "Properties and alerts panel";

const viewButton = (page: Page, name: string) =>
  page.getByRole("toolbar", { name: "View" }).getByRole("button", { name, exact: true });
const toggle = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
/**
 * Runs a view command and waits for the next rendered frame: the view rig moves the camera
 * just before it (reduced motion: no transition), so the camera is final afterwards.
 */
async function showView(page: Page, name: string) {
  const before = await frames(page);
  await viewButton(page, name).click();
  await expect.poll(() => frames(page)).toBeGreaterThan(before);
}

/** Waits for a panel to be fully collapsed or open (its transition is 0 ms in reduced motion). */
async function setPanel(page: Page, name: string, open: boolean) {
  const button = toggle(page, name);
  if ((await button.getAttribute("aria-expanded")) !== String(open)) await button.click();
  await expect(button).toHaveAttribute("aria-expanded", String(open));
}

const close = (a: Rect, b: Rect) =>
  (["left", "top", "right", "bottom"] as const).every((key) => Math.abs(a[key] - b[key]) < 0.5);

test("frames the whole desk in the free zone on load and after Reset view, Top, Front (UX-8)", async ({
  page,
}) => {
  await page.goto("/");
  await waitForScene(page);
  await expectDeskInFreeZone(page);
  for (const view of ["Top", "Front", "Reset view"]) {
    await showView(page, view);
    await expectDeskInFreeZone(page);
  }
});

test("collapsing a panel keeps the camera; the next view frames the new zone (UX-7, UX-8)", async ({
  page,
}) => {
  await page.goto("/");
  await waitForScene(page);
  test.skip(
    (await page.locator("[data-layout]").getAttribute("data-layout")) !== "wide",
    "docked panels only from 1024 px",
  );
  await setPanel(page, LEFT_TOGGLE, true);
  await setPanel(page, RIGHT_TOGGLE, true);
  await showView(page, "Reset view");
  await expectDeskInFreeZone(page);
  const framedWithPanels = await deskRect(page);

  // Panels closed: the camera has not moved.
  await setPanel(page, LEFT_TOGGLE, false);
  await setPanel(page, RIGHT_TOGGLE, false);
  expect(close(await deskRect(page), framedWithPanels)).toBe(true);

  // The next view command frames the whole width, centred in the window.
  await showView(page, "Front");
  await expectDeskInFreeZone(page);
  await showView(page, "Reset view");
  await expectDeskInFreeZone(page);
  const framedWithout = await deskRect(page);
  const width = page.viewportSize()!.width;
  const centre = (rect: Rect) => (rect.left + rect.right) / 2;
  expect(Math.abs(centre(framedWithout) - width / 2)).toBeLessThan(
    Math.abs(centre(framedWithPanels) - width / 2),
  );

  // Panels open again: still no camera move until the next view command.
  await setPanel(page, LEFT_TOGGLE, true);
  await setPanel(page, RIGHT_TOGGLE, true);
  expect(close(await deskRect(page), framedWithout)).toBe(true);
  await showView(page, "Top");
  await expectDeskInFreeZone(page);
});
