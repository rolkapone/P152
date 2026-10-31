import { expect, test, type Page } from "./fixtures";
import { waitForScene } from "./helpers/perf";

// US-005 T3b: restyle of the US-004 overlays to design v0.4 (design-system.md §14 and §18).

const viewBar = (page: Page) => page.getByRole("toolbar", { name: "View" });
const style = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

test("view bar in the thin material, tip in the regular one, both floating", async ({ page }) => {
  await page.goto("/");
  await waitForScene(page);
  await expect(viewBar(page)).toHaveClass(/\bmaterial-thin\b/);
  await expect(viewBar(page)).toHaveClass(/\bfloat\b/);
  expect(await viewBar(page).evaluate((e) => getComputedStyle(e).backdropFilter)).toContain(
    "blur(20px)",
  );
  const tip = page.locator(".material-regular", { hasText: "Drag to turn the view" });
  await expect(tip).toHaveClass(/\bfloat\b/);
  expect(await tip.evaluate((e) => getComputedStyle(e).backdropFilter)).toContain("blur(28px)");
  // "Got it" is a default pill button: gray fill, pill radius.
  const gotIt = page.getByRole("button", { name: "Got it" });
  expect(await gotIt.evaluate((e) => getComputedStyle(e).borderRadius)).toBe("999px");
});

test("a pressed view shows a check, without the former 2 px contour", async ({ page }) => {
  await page.goto("/");
  await waitForScene(page);
  const top = viewBar(page).getByRole("button", { name: "Top", exact: true });
  await top.click();
  await expect(top).toHaveAttribute("aria-pressed", "true");
  await expect(top.locator("[data-icon='check']")).toBeVisible();
  await page.mouse.move(0, page.viewportSize()?.height ?? 0); // no hover tint
  expect(await top.evaluate((e) => getComputedStyle(e).boxShadow)).toBe("none");
  expect(await top.evaluate((e) => getComputedStyle(e).fontWeight)).toBe("600");
  expect(await style(page, "body", "--color-accent-subtle")).not.toBe("");
});

test.describe("primary button on the solid accent (dark theme)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
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

  test("Try again: white text on --color-accent-solid, not on the light accent", async ({
    page,
  }) => {
    await page.goto("/");
    const retry = page.getByRole("alert").getByRole("button", { name: "Try again" });
    await expect(retry).toBeVisible();
    const colours = await retry.evaluate((e) => {
      const css = getComputedStyle(e);
      return [css.backgroundColor, css.color];
    });
    expect(colours).toEqual(["rgb(10, 108, 240)", "rgb(255, 255, 255)"]);
  });
});
