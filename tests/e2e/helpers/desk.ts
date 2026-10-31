import { expect, type Page } from "@playwright/test";
import type { DeskChoice } from "../../../src/core";

/** The desk list of the Desk tab (US-006). */
export const deskGroup = (page: Page) => page.getByRole("radiogroup", { name: "Desk model" });

/** Radio of a desk line, by its visible text "W × D cm" then name (accessible name, UX-14). */
export const deskRadio = (page: Page, choice: DeskChoice) =>
  deskGroup(page).getByRole("radio", { name: deskLabel(choice) });

const cm = (mm: number) => String(mm / 10);

/** Accessible name of a line: its visible text, size then name. */
export const deskLabel = (choice: DeskChoice) =>
  new RegExp(`^${cm(choice.spec.widthMm)} × ${cm(choice.spec.depthMm)} cm\\s*${choice.name}$`);

/** Size of the desk drawn by the 3D view (mm), read from the E2E probe. */
export const drawnDeskSize = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as {
        __p152perf: { deskSize(): { width: number; depth: number; height: number } | null };
      }
    ).__p152perf.deskSize(),
  );

/** Waits until the 3D view draws this desk (observable state, 1 mm tolerance, UX-10). */
export async function expectDeskDrawn(page: Page, choice: DeskChoice) {
  await expect
    .poll(async () => {
      const size = await drawnDeskSize(page);
      return (
        size !== null &&
        Math.abs(size.width - choice.spec.widthMm) <= 1 &&
        Math.abs(size.depth - choice.spec.depthMm) <= 1
      );
    })
    .toBe(true);
}

/**
 * Chooses a desk with a click on its line, as the user does, then waits until it is checked
 * and drawn. The name is clicked (the native radio is visually hidden inside its line).
 */
export async function chooseDesk(page: Page, choice: DeskChoice) {
  await deskGroup(page).getByText(choice.name, { exact: true }).click();
  await expect(deskRadio(page, choice)).toBeChecked();
  await expectDeskDrawn(page, choice);
}
