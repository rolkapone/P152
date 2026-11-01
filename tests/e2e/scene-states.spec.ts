import type { Route } from "@playwright/test";
import { expect, test } from "./fixtures";
import { waitForScene } from "./helpers/perf";

// US-005 T5: states of the 3D view inside the shell (W11): loading with the shell usable, and
// the neutral "failed" screen with "Reload page" from the 2nd consecutive failure. The 3D code
// is a lazy chunk: holding or aborting its request gives these states without any delay.

const SCENE_CHUNK = "**/assets/SceneCanvas-*.js";
const FAILED_BODY =
  "Something went wrong while starting it. Try again. If the problem continues, reload this page.";

test("loading: the shell stays visible and usable while the 3D view loads (UX-13)", async ({
  page,
}) => {
  let release: (route: Route) => void = () => {};
  const held = new Promise<Route>((resolve) => {
    release = resolve;
  });
  await page.route(SCENE_CHUNK, (route) => release(route));
  await page.goto("/");
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.getByText("Loading 3D scene…").first()).toBeVisible();
  await expect(page.getByRole("banner").getByRole("status")).toHaveText("Nothing to check yet");
  const left = page.getByRole("button", { name: "Desk and objects panel", exact: true });
  await left.click();
  await expect(left).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("tab", { name: "Objects" })).toBeHidden();
  await left.click();
  await page.getByRole("tab", { name: "Objects" }).click();
  await expect(page.getByText("No objects to add yet")).toBeVisible();

  await (await held).continue();
  await waitForScene(page);
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("failed: neutral text, Try again, then Reload page from the 2nd failure (UX-14, UX-15)", async ({
  page,
}) => {
  await page.route(SCENE_CHUNK, (route) => route.abort());
  await page.goto("/");
  const alert = page.getByRole("alert");
  const title = alert.getByRole("heading", { name: "The 3D view didn't load" });
  await expect(title).toBeFocused();
  await expect(alert).toContainText(FAILED_BODY);
  await expect(alert).not.toContainText(/browser|device|support|WebGL/i);
  await expect(alert.getByRole("button")).toHaveText(["Try again"]);
  await expect(page.getByRole("toolbar", { name: "View" })).toHaveCount(0);
  // The rest of the window stays usable (UX §2.4).
  await expect(page.getByRole("banner").getByRole("status")).toBeVisible();
  const right = page.getByRole("button", { name: "Properties and alerts panel", exact: true });
  await right.click();
  await expect(right).toHaveAttribute("aria-expanded", "false");

  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(alert.getByRole("button")).toHaveText(["Try again", "Reload page"]);
  await expect(title).toBeFocused();
  // Stacked full-width buttons (maquette US-005, design control US-005): same left edge and
  // width, filling the actions row, which spans the card content.
  const [retry, reload, actions] = await Promise.all([
    alert.getByRole("button", { name: "Try again" }).boundingBox(),
    alert.getByRole("button", { name: "Reload page" }).boundingBox(),
    alert.getByRole("button", { name: "Try again" }).locator("..").boundingBox(),
  ]);
  expect(retry && reload && actions).toBeTruthy();
  expect(reload!.y).toBeGreaterThan(retry!.y);
  expect(reload!.x).toBe(retry!.x);
  expect(reload!.width).toBe(retry!.width);
  expect(retry!.width).toBe(actions!.width);
  const card = await alert.evaluate((e) => {
    const style = getComputedStyle(e);
    const box = e.getBoundingClientRect();
    return box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  });
  expect(actions!.width).toBeCloseTo(card, 0);

  await Promise.all([
    page.waitForEvent("load"),
    alert.getByRole("button", { name: "Reload page" }).click(),
  ]);
  // A new page: first failure again, a single button.
  await expect(page.getByRole("heading", { name: "The 3D view didn't load" })).toBeFocused();
  await expect(page.getByRole("alert").getByRole("button")).toHaveText(["Try again"]);
});
