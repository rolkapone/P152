import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";
import { waitForScene } from "./helpers/perf";

// US-004 (developer part): view bar, tip, announcements, loading and error screens.
// The E2E config runs with prefers-reduced-motion: view changes are instant.

const region = (page: Page) => page.getByRole("group", { name: /3D view of your desk/ });
const toolbar = (page: Page) => page.getByRole("toolbar", { name: "View" });
const viewButton = (page: Page, name: string) =>
  toolbar(page).getByRole("button", { name, exact: true });
const live = (page: Page) => page.getByRole("status");
const TIP = "Drag to turn the view, scroll to zoom, right-drag to move the view.";

async function open(page: Page) {
  await page.goto("/");
  await waitForScene(page);
}

test("announces the ready view and shows the bar and the tip (UX-1, UX-2)", async ({ page }) => {
  await open(page);
  await expect(live(page)).toHaveText("3D view ready. Desk 140 by 70 cm.");
  await expect(live(page)).toHaveAttribute("aria-live", "polite");
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(page.getByText(TIP)).toBeVisible();

  const buttons = toolbar(page).getByRole("button");
  await expect(buttons).toHaveText(["Reset view", "Top", "Front"]);
  const boxes = await Promise.all((await buttons.all()).map((b) => b.boundingBox()));
  for (const box of boxes) expect(box?.height).toBeGreaterThanOrEqual(32);
  for (let i = 1; i < boxes.length; i++) {
    const previous = boxes[i - 1];
    const current = boxes[i];
    if (!previous || !current) throw new Error("no box");
    expect(current.x - (previous.x + previous.width)).toBeGreaterThanOrEqual(8);
  }
  for (const button of await buttons.all()) {
    await expect(button.locator("svg")).toHaveCount(1);
  }
});

test("Tab order: scene, Reset view, Top, Front, Got it, Hide tip (UX-3)", async ({ page }) => {
  await open(page);
  await region(page).focus();
  const names: string[] = [];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    names.push(
      await page.evaluate(
        () =>
          document.activeElement?.getAttribute("aria-label") ??
          document.activeElement?.textContent ??
          "",
      ),
    );
  }
  expect(names).toEqual(["Reset view", "Top", "Front", "Got it", "Hide tip"]);
});

test("tooltips after 400 ms, Escape closes them and keeps the focus (UX-4)", async ({ page }) => {
  // Fake page clock in this test only, as in UX-8: the 400 ms delay is checked exactly.
  await page.clock.install();
  await open(page);
  const top = await viewButton(page, "Top").boundingBox();
  if (!top) throw new Error("no button");
  // A real mouse moves over the scene before reaching a button (React Aria needs a pointer
  // move to know the mouse is in use; Playwright jumps straight onto the button otherwise).
  await page.mouse.move(10, 10);
  await page.mouse.move(20, 20);
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1_000);
  await page.mouse.move(top.x + top.width / 2, top.y + top.height / 2);
  await page.clock.runFor(399);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(page.getByRole("tooltip")).toHaveText("View from above (1)");
  await page.clock.resume();
  await page.mouse.move(0, 0);
  await expect(page.getByRole("tooltip")).toHaveCount(0);

  await region(page).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tooltip")).toHaveText("Reset view (0)");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(viewButton(page, "Reset view")).toBeFocused();
});

test("Top / Front are pressed toggles, released by a drag and by Reset view (UX-5)", async ({
  page,
}) => {
  await open(page);
  await viewButton(page, "Top").click();
  await expect(viewButton(page, "Top")).toHaveAttribute("aria-pressed", "true");
  await expect(viewButton(page, "Front")).toHaveAttribute("aria-pressed", "false");
  await expect(live(page)).toHaveText("Top view.");

  await viewButton(page, "Front").press("Enter");
  await expect(viewButton(page, "Front")).toHaveAttribute("aria-pressed", "true");
  await expect(viewButton(page, "Top")).toHaveAttribute("aria-pressed", "false");
  await expect(live(page)).toHaveText("Front view.");

  // Drag on the empty studio, at the top of the view.
  const box = await region(page).boundingBox();
  if (!box) throw new Error("no region");
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.15);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.15, { steps: 8 });
  await page.mouse.up();
  await expect(viewButton(page, "Front")).toHaveAttribute("aria-pressed", "false");
  await expect(live(page)).toHaveText("Front view."); // nothing said for a drag

  await viewButton(page, "Top").click();
  await viewButton(page, "Reset view").click();
  await expect(viewButton(page, "Top")).toHaveAttribute("aria-pressed", "false");
  await expect(viewButton(page, "Reset view")).not.toHaveAttribute("aria-pressed", /.*/);
  await expect(live(page)).toHaveText("View reset.");
});

test("keyboard on the scene: 0 / 1 / 2 and one announcement 600 ms after the steps (UX-8)", async ({
  page,
}) => {
  // Fake page clock in this test only (independent of the machine load): the time flows
  // normally until pauseAt, then moves only when the test advances it.
  await page.clock.install();
  await open(page);
  await region(page).focus();
  await page.keyboard.press("2");
  await expect(viewButton(page, "Front")).toHaveAttribute("aria-pressed", "true");
  await expect(live(page)).toHaveText("Front view.");
  await page.keyboard.press("0");
  await expect(live(page)).toHaveText("View reset.");

  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1_000);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.clock.runFor(599);
  await expect(live(page)).toHaveText("View reset."); // not yet: the user is still turning
  await page.clock.runFor(1);
  await expect(live(page)).toHaveText("View turned 30 degrees right.");
  await page.clock.resume();

  await page.keyboard.press("+");
  await expect(live(page)).toHaveText(/^Zoomed in\.$|^Zoom limit reached\.$/);

  // The keys do nothing when a button of the bar has the focus.
  await viewButton(page, "Reset view").focus();
  await page.keyboard.press("1");
  await expect(viewButton(page, "Top")).toHaveAttribute("aria-pressed", "false");
});

test("Got it hides the tip for good and moves the focus to Reset view (UX-11)", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Got it" }).press("Enter");
  await expect(page.getByText(TIP)).toHaveCount(0);
  await expect(viewButton(page, "Reset view")).toBeFocused();
  await page.reload();
  await waitForScene(page);
  await expect(toolbar(page)).toBeVisible();
  await expect(page.getByText(TIP)).toHaveCount(0);
});

test("Hide tip has the same effect (UX-11)", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Hide tip" }).click();
  await expect(page.getByText(TIP)).toHaveCount(0);
  await expect(viewButton(page, "Reset view")).toBeFocused();
});

test("the tip still works when the browser blocks the storage", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByText(TIP)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("bar and tip fit at 1366 x 768 and at 200 % zoom (UX-14)", async ({ page }) => {
  for (const size of [
    { width: 1366, height: 768 },
    { width: 683, height: 384 }, // 1366 x 768 at 200 % zoom
  ]) {
    await page.setViewportSize(size);
    await open(page);
    const bar = await toolbar(page).boundingBox();
    const tip = await page.getByText(TIP).boundingBox();
    if (!bar || !tip) throw new Error("no box");
    expect(bar.x).toBeGreaterThanOrEqual(0);
    expect(bar.x + bar.width).toBeLessThanOrEqual(size.width);
    expect(bar.y + bar.height).toBeLessThanOrEqual(size.height);
    expect(tip.y + tip.height).toBeLessThanOrEqual(bar.y); // the tip never covers the bar
  }
});

test("no serious accessibility violation on the ready scene, light and dark (UX-12)", async ({
  page,
}) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await open(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(blocking.map((v) => `${scheme} ${v.id}: ${v.nodes.length}`)).toEqual([]);
  }
});

test.describe("without WebGL 2 (UX-13)", () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test("shows the message instead of the scene, focus on its title, Try again checks again", async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") problems.push(msg.text());
    });
    await page.goto("/");
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    const title = alert.getByRole("heading", { name: "The 3D view can't start" });
    await expect(title).toBeFocused();
    await expect(alert).toContainText("doesn't support 3D graphics (WebGL 2)");
    await expect(alert).not.toContainText("Deskfit");
    await expect(page.getByRole("toolbar")).toHaveCount(0);
    await expect(page.getByText(TIP)).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);

    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { name: "The 3D view can't start" })).toBeFocused();
    expect(problems).toEqual([]);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
    ).toEqual([]);
  });
});

test("context lost: 'The 3D view stopped', then Try again restores the scene", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas?.getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  const title = page.getByRole("heading", { name: "The 3D view stopped" });
  await expect(title).toBeFocused();
  await expect(page.getByRole("alert")).toContainText("The graphics connection was lost.");
  await expect(page.getByRole("toolbar")).toHaveCount(0);
  await page.getByRole("button", { name: "Try again" }).click();
  await waitForScene(page);
  await expect(toolbar(page)).toBeVisible();
});
