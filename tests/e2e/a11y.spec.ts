import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("home page has no serious or critical accessibility violations (WCAG 2.2 AA)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#root")).not.toBeEmpty();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`)).toEqual([]);
});
