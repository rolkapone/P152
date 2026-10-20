import { CSP, expect, test } from "./fixtures";

// SEC-03a: the server sends the production headers and React Aria injects no inline <style>.
test("the document is served with the production security headers", async ({ page }) => {
  const response = await page.goto("/");
  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toBe(CSP);
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["strict-transport-security"]).toMatch(/^max-age=/);
});

test("React Aria uses the static stylesheet and injects no <style> element", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-scene-status="ready"]').waitFor();
  const pressable = page.locator("[data-react-aria-pressable]").first();
  await expect(pressable).toBeVisible();
  // Press interaction runs usePress handlers (and the effect that would inject the style).
  await pressable.hover();
  await page.mouse.down();
  await page.mouse.up();

  const info = await page.evaluate(() => ({
    styleElements: document.querySelectorAll("style").length,
    linkTag: document.getElementById("react-aria-pressable-style")?.tagName,
    touchAction: getComputedStyle(document.querySelector("[data-react-aria-pressable]")!)
      .touchAction,
  }));
  expect(info.styleElements).toBe(0);
  expect(info.linkTag).toBe("LINK");
  // Chrome serialises "pan-x pan-y pinch-zoom" as "manipulation".
  expect(info.touchAction).toBe("manipulation");
});
