import { expect, type Page } from "@playwright/test";

/** Screen rectangle in page CSS px. */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** UX-8 (US-005) and UX-10 (US-006): margin around the desk inside the free zone. */
export const FREE_ZONE_MARGIN = 24;

/** Rendered frames so far (window.__p152perf, E2E build). */
export const frames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __p152perf: { frames: number } }).__p152perf.frames);

/** The desk as the camera draws it now (its vertices), in page CSS px. */
export async function deskRect(page: Page): Promise<Rect> {
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
export async function freeZone(page: Page): Promise<Rect> {
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

export const inside = (desk: Rect, zone: Rect) =>
  desk.left >= zone.left + FREE_ZONE_MARGIN &&
  desk.right <= zone.right - FREE_ZONE_MARGIN &&
  desk.top >= zone.top + FREE_ZONE_MARGIN &&
  desk.bottom <= zone.bottom - FREE_ZONE_MARGIN;

/** Waits until the desk is drawn inside the free zone (observable state, no fixed delay). */
export async function expectDeskInFreeZone(page: Page) {
  const zone = await freeZone(page);
  await expect
    .poll(async () => {
      const desk = await deskRect(page);
      return inside(desk, zone) ? "inside" : JSON.stringify({ desk, zone });
    })
    .toBe("inside");
}
