import { expect, test, type Page } from "./fixtures";
import { waitForScene } from "./helpers/perf";

// US-004 (graphics-engineer part): the 3D view starts, renders on demand and answers the
// view keys when it has the focus. The view bar, the tip and the error screens are tested
// with the UI (developer / QA).

const status = (page: Page) => page.locator("[data-scene-status]");
const frames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __p152perf: { frames: number } }).__p152perf.frames);

/**
 * Loads the scene with a fake page clock, then freezes it: animation frames only run when the
 * test advances the clock, so "no frame while idle" is checked over an exact span of page
 * time, whatever the load of the machine (no real-time wait). The first second lets the
 * camera damping settle.
 */
async function openFrozen(page: Page) {
  await page.clock.install();
  await page.goto("/");
  await waitForScene(page);
  const now = await page.evaluate(() => Date.now());
  // Wide margin: pauseAt cannot jump to the past (docs/qa/ci-e2e-runner.md).
  await page.clock.pauseAt(now + 60_000);
  await page.clock.runFor(1000);
}

test("the 3D view starts in a labelled, focusable region without console errors", async ({
  page,
}) => {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(msg.text());
  });
  page.on("pageerror", (err) => problems.push(err.message));
  await page.goto("/");
  await waitForScene(page);
  const region = page.getByRole("group", { name: /3D view of your desk/ });
  await expect(region).toBeVisible();
  await expect(region.locator("canvas")).toBeVisible();
  const box = await region.boundingBox();
  const viewport = page.viewportSize();
  expect(box?.width).toBe(viewport?.width);
  expect(box?.height).toBe(viewport?.height);
  expect(problems).toEqual([]);
});

test("renders on demand: no frame while nothing changes", async ({ page }) => {
  await openFrozen(page);
  const before = await frames(page);
  await page.clock.runFor(1000); // one second of page time: 60 animation frames offered
  expect(await frames(page)).toBe(before);
});

test("view keys act only when the 3D view has the focus", async ({ page }) => {
  await openFrozen(page);
  const idle = await frames(page);
  await page.keyboard.press("1"); // focus is on the page body: nothing happens
  await page.clock.runFor(500);
  expect(await frames(page)).toBe(idle);

  await page.getByRole("group", { name: /3D view of your desk/ }).focus();
  await page.keyboard.press("1"); // Top view (instant: reduced motion in the E2E config)
  await page.clock.runFor(500);
  expect(await frames(page)).toBeGreaterThan(idle);
  await expect(status(page)).toHaveAttribute("data-scene-status", "ready");
});

test("right click on the scene opens no context menu", async ({ page }) => {
  await page.goto("/");
  await waitForScene(page);
  const prevented = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    canvas?.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(true);
});
