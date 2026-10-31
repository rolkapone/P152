import { expect, test, type Page } from "./fixtures";
import { waitForScene } from "./helpers/perf";

// US-005 T1 to T3: Studio window v0.4 (toolbar, sidebar, inspector, scene in full frame),
// system theme, self-hosted Inter. Served with the production CSP (fixtures).

const sidebar = (page: Page) => page.getByRole("complementary", { name: "Desk and objects" });
const inspector = (page: Page) =>
  page.getByRole("complementary", { name: "Properties and alerts" });
const toggle = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const viewBar = (page: Page) => page.getByRole("toolbar", { name: "View" });

async function box(page: Page, locator: ReturnType<Page["locator"]>) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("element not laid out");
  return rect;
}

test("lays out the window: toolbar, docked panels, scene in full frame, no page scroll", async ({
  page,
}) => {
  await page.goto("/");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport");
  const toolbar = await box(page, page.getByRole("banner"));
  expect(toolbar.y).toBe(0);
  expect(toolbar.height).toBeGreaterThanOrEqual(52);
  expect(toolbar.width).toBe(viewport.width);

  const left = await box(page, sidebar(page));
  const right = await box(page, inspector(page));
  expect([left.x, left.width]).toEqual([0, 248]);
  expect([right.x + right.width, right.width]).toEqual([viewport.width, 312]);
  expect(left.y).toBe(toolbar.height);
  expect(left.y + left.height).toBe(viewport.height);

  const scene = await box(page, page.getByRole("main"));
  expect(scene).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });

  const verdict = page.getByRole("banner").getByRole("status");
  await expect(verdict).toHaveText("Nothing to check yet");
  const pill = await box(page, verdict);
  expect(pill.x + pill.width).toBeLessThanOrEqual(viewport.width);

  const overflow = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    return [root.scrollWidth - root.clientWidth, root.scrollHeight - root.clientHeight];
  });
  expect(overflow).toEqual([0, 0]);
});

test("collapses a panel without moving the view bar (UX-6, UX-7, free zone)", async ({ page }) => {
  await page.goto("/");
  await waitForScene(page);
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("no viewport");
  const before = await box(page, viewBar(page));
  // Centred between the docked panels (806 px free zone at 1366 px).
  const freeCentre = (248 + viewport.width - 312) / 2;
  expect(Math.abs(before.x + before.width / 2 - freeCentre)).toBeLessThanOrEqual(1);

  const left = toggle(page, "Desk and objects panel");
  await left.click();
  await expect(left).toHaveAttribute("aria-expanded", "false");
  await expect(left).toBeFocused();
  await expect(sidebar(page)).toBeHidden();
  await toggle(page, "Properties and alerts panel").click();
  await expect(inspector(page)).toBeHidden();
  expect(await box(page, viewBar(page))).toEqual(before);

  await left.click();
  await expect(left).toHaveAttribute("aria-expanded", "true");
  await expect(sidebar(page)).toBeVisible();
});

test("follows the system theme, light and dark", async ({ page }) => {
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.getByRole("banner")).toBeVisible();
  expect(await background()).toBe("rgb(242, 242, 247)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(background).toBe("rgb(11, 11, 13)");
});

test("uses the self-hosted Inter, with no third-party request", async ({ page, baseURL }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await expect(page.getByRole("banner")).toBeVisible();
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].some(
      (face) => face.family.replaceAll('"', "") === "Inter" && face.status === "loaded",
    );
  });
  expect(loaded).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('600 16px "Inter"'))).toBe(true);
  expect(requests.filter((url) => !url.startsWith(`${baseURL ?? ""}/`))).toEqual([]);
});

// ---- US-005 T4: memory, drawers, skip links, Tab order, reflow, reduced transparency ----

test("remembers a collapsed panel after a reload (wide window, UX-6)", async ({ page }) => {
  await page.goto("/");
  await toggle(page, "Desk and objects panel").click();
  await expect(sidebar(page)).toBeHidden();
  await page.reload();
  await expect(toggle(page, "Desk and objects panel")).toHaveAttribute("aria-expanded", "false");
  await expect(sidebar(page)).toBeHidden();
  await expect(inspector(page)).toBeVisible();
});

for (const size of [
  { width: 683, height: 384 }, // 1366 x 768 at 200 % zoom
  { width: 820, height: 1000 },
]) {
  test(`drawers under 1024 px, ${size.width} x ${size.height}: closed, one at a time, Escape (UX-9)`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("/");
    const left = toggle(page, "Desk and objects panel");
    const right = toggle(page, "Properties and alerts panel");
    await expect(left).toHaveAttribute("aria-expanded", "false");
    await expect(right).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar(page)).toBeHidden();
    await expect(inspector(page)).toBeHidden();

    await left.click();
    await expect(sidebar(page)).toBeVisible();
    await right.click();
    await expect(sidebar(page)).toBeHidden();
    await expect(inspector(page)).toBeVisible();
    // Never over the toolbar: the verdict stays visible above the drawer.
    const verdict = await box(page, page.getByRole("banner").getByRole("status"));
    const drawer = await box(page, inspector(page));
    expect(drawer.y).toBeGreaterThanOrEqual(verdict.y + verdict.height);

    await inspector(page).getByRole("heading", { name: "Alerts" }).focus();
    await page.keyboard.press("Escape");
    await expect(inspector(page)).toBeHidden();
    await expect(right).toBeFocused();
  });
}

test("reflows at 320 px: no horizontal scroll, verdict and toggles fully visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(320);
  for (const locator of [
    page.getByRole("banner").getByRole("status"),
    toggle(page, "Desk and objects panel"),
    toggle(page, "Properties and alerts panel"),
  ]) {
    const rect = await box(page, locator);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(320);
  }
  await expect(page.getByRole("banner").getByRole("status")).toHaveText("Nothing to check yet");
});

test("Tab order: skip links, toggles, tab, the desk list, 3D view, view bar, tip (UX-4, UX-5)", async ({
  page,
}) => {
  await page.goto("/");
  await waitForScene(page);
  const names: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press("Tab");
    names.push(
      await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        const label = active?.getAttribute("aria-label");
        if (label) return label.split(".")[0] ?? label;
        if (active instanceof HTMLInputElement) return active.type;
        return active?.getAttribute("role") ?? active?.textContent?.trim() ?? "";
      }),
    );
  }
  expect(names).toEqual([
    "Skip to 3D view",
    "Skip to alerts",
    "Desk and objects panel",
    "Properties and alerts panel",
    "tab",
    "radio", // the desk list of the Desk tab: one Tab stop (US-006 UX-2)
    "3D view of your desk",
    "Reset view",
    "Top",
    "Front",
    "Got it",
    "Hide tip",
  ]);
});

test("skip links appear on focus and move the focus (UX-4)", async ({ page }) => {
  await page.goto("/");
  await waitForScene(page);
  const skipScene = page.getByRole("link", { name: "Skip to 3D view" });
  await expect(skipScene).not.toBeInViewport();
  await page.keyboard.press("Tab");
  await expect(skipScene).toBeFocused();
  await expect(skipScene).toBeInViewport();
  expect(await skipScene.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("group", { name: /3D view of your desk/ })).toBeFocused();

  await toggle(page, "Properties and alerts panel").click();
  await expect(inspector(page)).toBeHidden();
  await page.getByRole("link", { name: "Skip to alerts" }).focus();
  await page.keyboard.press("Enter");
  await expect(inspector(page)).toBeVisible();
  await expect(inspector(page).getByRole("heading", { name: "Alerts" })).toBeFocused();
});

test("view keys do nothing while the focus is in the toolbar or a panel (UX-22)", async ({
  page,
}) => {
  await page.goto("/");
  await waitForScene(page);
  await toggle(page, "Desk and objects panel").focus();
  await page.keyboard.press("1");
  await page.getByRole("tab", { name: "Desk" }).focus();
  await page.keyboard.press("2");
  const pressed = viewBar(page).locator("[aria-pressed='true']");
  await expect(pressed).toHaveCount(0);
});

test("Reduce transparency (.no-glass): opaque materials, same layout", async ({ page }) => {
  await page.goto("/");
  const toolbar = page.getByRole("banner");
  const before = await box(page, sidebar(page));
  await page.evaluate(() => document.documentElement.classList.add("no-glass"));
  // Polled: under reduced motion every property still "transitions" for 0.01 ms.
  await expect
    .poll(() =>
      toolbar.evaluate((e) => {
        const style = getComputedStyle(e);
        return [style.backgroundColor, style.backdropFilter];
      }),
    )
    .toEqual(["rgb(242, 242, 247)", "none"]);
  expect(await box(page, sidebar(page))).toEqual(before);
});

test("reduced motion: panels open and close without animation (UX-19)", async ({ page }) => {
  await page.goto("/");
  const durations = await sidebar(page).evaluate((e) =>
    getComputedStyle(e)
      .transitionDuration.split(",")
      .map((value) => parseFloat(value)),
  );
  for (const seconds of durations) expect(seconds).toBeLessThanOrEqual(0.001);
});

test("the dock follows the window and reopened panels: never under a panel (UX-7, UX-21)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 768 });
  await page.goto("/");
  await waitForScene(page);
  await page.setViewportSize({ width: 1100, height: 768 });
  await expect(inspector(page)).toBeVisible();
  const tip = page.locator(".material-regular", { hasText: "Drag to turn the view" });
  const clear = async () => {
    const left = await box(page, sidebar(page));
    const right = await box(page, inspector(page));
    for (const element of [viewBar(page), tip]) {
      const rect = await box(page, element);
      expect(rect.x).toBeGreaterThanOrEqual(left.x + left.width);
      expect(rect.x + rect.width).toBeLessThanOrEqual(right.x);
    }
  };
  await expect.poll(async () => (await box(page, tip)).x).toBeGreaterThanOrEqual(248);
  await clear();

  // Collapsing does not move the dock; reopening keeps it clear of the panel.
  const before = await box(page, viewBar(page));
  await toggle(page, "Desk and objects panel").click();
  await expect(sidebar(page)).toBeHidden();
  expect(await box(page, viewBar(page))).toEqual(before);
  await toggle(page, "Desk and objects panel").click();
  await expect(sidebar(page)).toBeVisible();
  await clear();
});

test("a panel opened after a load with it collapsed pushes the dock clear of it", async ({
  page,
}) => {
  await page.goto("/");
  await toggle(page, "Properties and alerts panel").click();
  await page.reload();
  await waitForScene(page);
  await expect(inspector(page)).toBeHidden();
  await toggle(page, "Properties and alerts panel").click();
  await expect(inspector(page)).toBeVisible();
  const right = await box(page, inspector(page));
  await expect
    .poll(async () => {
      const bar = await box(page, viewBar(page));
      return bar.x + bar.width <= right.x;
    })
    .toBe(true);
});
