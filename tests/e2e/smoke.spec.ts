import { expect, test } from "@playwright/test";

test("the app loads without console errors", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => problems.push(`requestfailed: ${req.url()}`));

  await page.goto("/");

  await expect(page).toHaveTitle("P152");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("#root")).not.toBeEmpty();
  expect(problems).toEqual([]);
});
