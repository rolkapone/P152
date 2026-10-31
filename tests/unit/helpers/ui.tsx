// Helpers for the component tests of src/ui and src/app (jsdom, ADR-APP-08).
import { render, type RenderResult } from "@testing-library/react";
import axe from "axe-core";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "../../../src/ui/i18n/config";

// jsdom has no CSS.escape, which React Aria collections (Tabs) use to find the focused item.
if (typeof globalThis.CSS?.escape !== "function") {
  const escape = (value: string) => value.replace(/[^\w-]/g, (char) => `\\${char}`);
  Object.defineProperty(globalThis, "CSS", {
    value: { ...globalThis.CSS, escape },
    configurable: true,
  });
}

/** Renders inside the app's i18n provider (English resources). */
export function renderWithI18n(ui: ReactNode): RenderResult {
  return render(<I18nextProvider i18n={createI18n()}>{ui}</I18nextProvider>);
}

/**
 * WCAG 2.2 AA violations found by axe-core in `node`. Colour contrast is left to the E2E
 * tests: jsdom computes no layout nor colours.
 */
export async function axeViolations(node: Element): Promise<string[]> {
  const results = await axe.run(node, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((violation) => `${violation.id} (${violation.nodes.length})`);
}
