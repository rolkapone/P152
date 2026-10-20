import { expect, test, type Page } from "@playwright/test";
import { waitForScene } from "./helpers/perf";

// US-004 (graphics-engineer part): the 3D view starts, renders on demand and answers the
// view keys when it has the focus. The view bar, the tip and the error screens are tested
// with the UI (developer / QA).

const status = (page: Page) => page.locator("[data-scene-status]");

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
  await page.goto("/");
  await waitForScene(page);
  const frames = () =>
    page.evaluate(
      () => (window as unknown as { __p152perf: { frames: number } }).__p152perf.frames,
    );
  await page.waitForTimeout(500);
  const before = await frames();
  await page.waitForTimeout(1000);
  expect(await frames()).toBe(before);
});

test("view keys act only when the 3D view has the focus", async ({ page }) => {
  await page.goto("/");
  await waitForScene(page);
  const frames = () =>
    page.evaluate(
      () => (window as unknown as { __p152perf: { frames: number } }).__p152perf.frames,
    );
  await page.waitForTimeout(300);
  const idle = await frames();
  await page.keyboard.press("1"); // focus is on the page body: nothing happens
  await page.waitForTimeout(300);
  expect(await frames()).toBe(idle);

  await page.getByRole("group", { name: /3D view of your desk/ }).focus();
  await page.keyboard.press("1"); // Top view (instant: reduced motion in the E2E config)
  await expect.poll(frames).toBeGreaterThan(idle); // a new frame, however loaded the machine
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
