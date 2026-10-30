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
