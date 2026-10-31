import { expect, test, type Page } from "./fixtures";
import { waitForScene } from "./helpers/perf";

// US-005 UX-8 (graphics-engineer): on load and after Reset view / Top / Front, the whole desk
// is drawn in the free zone between the docked panels and under the toolbar, with a margin of
// at least 24 px; collapsing or opening a panel never moves the camera (UX-7), the next view
// command uses the new zone. Reduced motion (playwright.config.ts): views jump at once.

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const MARGIN = 24;
const LEFT_TOGGLE = "Desk and objects panel";
const RIGHT_TOGGLE = "Properties and alerts panel";

const viewButton = (page: Page, name: string) =>
  page.getByRole("toolbar", { name: "View" }).getByRole("button", { name, exact: true });
const toggle = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const frames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __p152perf: { frames: number } }).__p152perf.frames);

/**
 * Runs a view command and waits for the next rendered frame: the view rig moves the camera
 * just before it (reduced motion: no transition), so the camera is final afterwards.
 */
async function showView(page: Page, name: string) {
  const before = await frames(page);
  await viewButton(page, name).click();
  await expect.poll(() => frames(page)).toBeGreaterThan(before);
}

/** The desk as the camera draws it now, in page CSS px (window.__p152perf, E2E build). */
async function deskRect(page: Page): Promise<Rect> {
  const rect = await page.evaluate(() => {
    const probe = (window as unknown as { __p152perf?: { deskRect(): Rect | null } }).__p152perf;
    const canvas = document.querySelector("canvas")?.getBoundingClientRect();
    const desk = probe?.deskRect();
    if (!desk || !canvas) return null;
    return {
      left: desk.left + canvas.left,
      top: desk.top + canvas.top,
      right: desk.right + canvas.left,
      bottom: desk.bottom + canvas.top,
    };
  });
  if (!rect) throw new Error("window.__p152perf.deskRect() unavailable");
  return rect;
}

/** Free zone measured in the page: under the toolbar, between the docked panels open now. */
async function freeZone(page: Page): Promise<Rect> {
  return page.evaluate(() => {
    const app = document.querySelector("[data-layout]");
    const docked = app?.getAttribute("data-layout") === "wide";
    const side = (name: string) => {
      const pane = document.querySelector<HTMLElement>(`aside[aria-label="${name}"]`);
      return docked && pane?.dataset.open === "true" ? pane.getBoundingClientRect() : null;
    };
    const header = document.querySelector("header")!.getBoundingClientRect();
    const left = side("Desk and objects");
    const right = side("Properties and alerts");
    return {
      left: left ? left.right : 0,
      top: header.bottom,
      right: right ? right.left : window.innerWidth,
      bottom: window.innerHeight,
    };
  });
}

const inside = (desk: Rect, zone: Rect) =>
  desk.left >= zone.left + MARGIN &&
  desk.right <= zone.right - MARGIN &&
  desk.top >= zone.top + MARGIN &&
  desk.bottom <= zone.bottom - MARGIN;

/** Waits until the desk is drawn inside the free zone (observable state, no fixed delay). */
async function expectDeskInFreeZone(page: Page) {
  const zone = await freeZone(page);
  await expect
    .poll(async () => {
      const desk = await deskRect(page);
      return inside(desk, zone) ? "inside" : JSON.stringify({ desk, zone });
    })
    .toBe("inside");
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
