import { deskChoices, type DeskSpec } from "../../src/core";
import { testCatalog } from "../unit/helpers/fixtures";
import { expect, test, type Page } from "./fixtures";
import { expectDeskInFreeZone, frames } from "./helpers/framing";
import { readPerf, STUDIO_BUDGET, waitForScene } from "./helpers/perf";

// US-006 (graphics-engineer, scene part): changing the desk in the 3D view. The Desk panel
// (developer) calls the same store API (`useSceneDesk.setDesk`); here the E2E hook does, so the
// scene is tested on its own. Reduced motion (playwright.config.ts): the reframing is instant.

const DESKS = deskChoices(testCatalog());
const desk = (id: string) => DESKS.find((choice) => choice.id === id)!.spec;
const LARGEST = desk("desk.corner/large");

interface Probe {
  frames: number;
  geometries: number;
  textures: number;
  setDesk(desk: DeskSpec): boolean;
  deskSize(): { width: number; depth: number; height: number } | null;
  viewDirection(): [number, number, number];
}

const hook = (page: Page) => ({
  deskSize: () =>
    page.evaluate(() => (window as unknown as { __p152perf: Probe }).__p152perf.deskSize()),
  viewDirection: () =>
    page.evaluate(() => (window as unknown as { __p152perf: Probe }).__p152perf.viewDirection()),
  memory: () =>
    page.evaluate(() => {
      const p = (window as unknown as { __p152perf: Probe }).__p152perf;
      return [p.geometries, p.textures];
    }),
});

/**
 * Applies a desk, then waits until the scene draws it (observable state: size of the desk
 * meshes). The camera is checked by polling too (`expectDeskInFreeZone`).
 */
async function showDesk(page: Page, spec: DeskSpec) {
  const changed = await page.evaluate(
    (value) => (window as unknown as { __p152perf: Probe }).__p152perf.setDesk(value),
    spec,
  );
  await expect
    .poll(async () => {
      const size = await hook(page).deskSize();
      return (
        size !== null &&
        Math.abs(size.width - spec.widthMm) <= 1 &&
        Math.abs(size.depth - spec.depthMm) <= 1
      );
    })
    .toBe(true);
  return changed;
}

/** Direction of the camera once it no longer changes between two reads (settled view). */
async function settledDirection(page: Page): Promise<[number, number, number]> {
  let last: [number, number, number] | null = null;
  await expect
    .poll(async () => {
      const now = await hook(page).viewDirection();
      const settled = last !== null && now.every((v, i) => Math.abs(v - last![i]!) < 1e-6);
      last = now;
      return settled;
    })
    .toBe(true);
  return last!;
}

const viewButton = (page: Page, name: string) =>
  page.getByRole("toolbar", { name: "View" }).getByRole("button", { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await waitForScene(page);
});

test("draws each desk of the catalog at its real size, framed in the free zone (UX-10)", async ({
  page,
}) => {
  expect(DESKS).toHaveLength(7);
  for (const { spec } of DESKS) {
    await showDesk(page, spec);
    const size = await hook(page).deskSize();
    expect(Math.abs(size!.width - spec.widthMm)).toBeLessThanOrEqual(1);
    expect(Math.abs(size!.depth - spec.depthMm)).toBeLessThanOrEqual(1);
    expect(Math.abs(size!.height - spec.heightMm)).toBeLessThanOrEqual(1);
    await expectDeskInFreeZone(page);
  }
});

test("keeps the orientation of the view; Top stays active (UX-10)", async ({ page }) => {
  await page.getByRole("group", { name: /3D view/ }).focus();
  const before = await frames(page);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => frames(page)).toBeGreaterThan(before);
  const turned = await settledDirection(page);
  await showDesk(page, LARGEST);
  const after = await settledDirection(page);
  after.forEach((value, axis) => expect(value).toBeCloseTo(turned[axis]!, 3));
  await expectDeskInFreeZone(page);

  await viewButton(page, "Top").click();
  await expect(viewButton(page, "Top")).toHaveAttribute("aria-pressed", "true");
  await showDesk(page, desk("desk.rect/compact"));
  await expect(viewButton(page, "Top")).toHaveAttribute("aria-pressed", "true");
  await expectDeskInFreeZone(page);
});

test("the same desk again changes nothing", async ({ page }) => {
  expect(await showDesk(page, LARGEST)).toBe(true);
  expect(await showDesk(page, LARGEST)).toBe(false);
});

test("frees the geometries and textures of the previous desks (no leak)", async ({ page }) => {
  await showDesk(page, desk("desk.rect/standard"));
  const start = await hook(page).memory();
  for (const { spec } of [...DESKS, ...DESKS]) await showDesk(page, spec);
  await showDesk(page, desk("desk.rect/standard"));
  await expect.poll(() => hook(page).memory()).toEqual(start);
});

test("stays within the studio budget with the largest desk (draw calls, triangles)", async ({
  page,
}) => {
  await showDesk(page, LARGEST);
  await showDesk(page, desk("desk.rect/gaming"));
  const perf = await readPerf(page);
  test.info().annotations.push({
    type: "perf",
    description: `drawCalls=${String(perf.drawCalls)} triangles=${String(perf.triangles)}`,
  });
  expect(perf.drawCalls).toBeLessThanOrEqual(STUDIO_BUDGET.drawCalls);
  expect(perf.triangles).toBeLessThanOrEqual(STUDIO_BUDGET.triangles);
});

test.describe("smallest docked window (risk R11, ADR-3D-11)", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("frames the largest desk at 1024 px with both panels open", async ({ page }) => {
    await expect(page.locator("[data-layout]")).toHaveAttribute("data-layout", "wide");
    for (const name of ["Desk and objects panel", "Properties and alerts panel"]) {
      const button = page.getByRole("button", { name, exact: true });
      if ((await button.getAttribute("aria-expanded")) !== "true") await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
    }
    await showDesk(page, LARGEST);
    await expectDeskInFreeZone(page);
    for (const view of ["Top", "Front", "Reset view"]) {
      const before = await frames(page);
      await viewButton(page, view).click();
      await expect.poll(() => frames(page)).toBeGreaterThan(before);
      await expectDeskInFreeZone(page);
    }
  });
});
