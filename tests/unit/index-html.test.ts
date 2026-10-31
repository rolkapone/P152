// index.html before any script runs (UX US-005 §2.5, UX-3): language, title, theme, noscript.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import common from "../../src/locales/en/common.json";

const html = readFileSync("index.html", "utf8");

describe("index.html", () => {
  it("declares the English language", () => {
    expect(html).toMatch(/<html lang="en">/);
  });

  it("has the i18n page title before the app starts", () => {
    const title = common.app.title.replace("{{appName}}", common.app.name);
    expect(title).toBe("Deskfit - Plan your desk setup");
    expect(html).toContain(`<title>${title}</title>`);
  });

  it("lets the browser paint the system theme before the styles load (no white flash)", () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark" />');
  });

  it("tells users without JavaScript what to do", () => {
    expect(html).toContain("<noscript>Turn on JavaScript to use this app.</noscript>");
  });

  it("has no inline script nor style (strict CSP)", () => {
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
    expect(html).not.toMatch(/<style|\sstyle=/);
  });
});
