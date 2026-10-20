import { expect, test as base } from "@playwright/test";
import { CSP } from "../../config/security-headers.mjs";

/**
 * Every E2E test imports `test` from here (SEC-03a, ADR-OPS-06 point 3): a test fails on any
 * `securitypolicyviolation` event or console error mentioning the Content Security Policy.
 * The app is served with the production headers (config/security-headers.mjs).
 */
export const test = base.extend<{ cspGuard: void }>({
  cspGuard: [
    async ({ context, page }, use) => {
      const violations: string[] = [];
      await context.exposeFunction("__reportCspViolation", (detail: string) => {
        violations.push(`securitypolicyviolation: ${detail}`);
      });
      await context.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (e) => {
          const report = (window as unknown as { __reportCspViolation?: (d: string) => void })
            .__reportCspViolation;
          report?.(
            `${e.violatedDirective} blocked ${e.blockedURI || "inline"} (${e.sourceFile}:${e.lineNumber})`,
          );
        });
      });
      page.on("console", (msg) => {
        if (
          msg.type() === "error" &&
          /content security policy|refused to (apply|load|execute|connect|create)/i.test(msg.text())
        ) {
          violations.push(`console: ${msg.text()}`);
        }
      });
      await use();
      expect(violations, "CSP violations").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect, CSP };
export type { Page } from "@playwright/test";
