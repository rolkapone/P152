// The app consumes the v0.4 design tokens (design-system.md §18 point 6): every custom
// property used by a stylesheet of src/ exists in tokens.css or is defined by a stylesheet of
// the app (e.g. the free zone --dl / --dr of the shell, read by the scene overlays), and no
// colour is written by hand outside tokens.css.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TOKENS = "src/ui/styles/tokens.css";

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

const definedIn = (css: string) => new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const usedIn = (css: string) => [...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const tokens = definedIn(readFileSync(TOKENS, "utf8"));
const files = cssFiles("src").filter((path) => path !== TOKENS);
const appProperties = new Set(
  files.flatMap((path) => [...definedIn(withoutComments(readFileSync(path, "utf8")))]),
);

describe("design tokens usage", () => {
  it("finds the stylesheets of the app", () => {
    expect(files).toContain("src/ui/styles/global.css");
    expect(files.length).toBeGreaterThan(3);
  });

  it.each(files)("%s only uses defined tokens", (path) => {
    const css = withoutComments(readFileSync(path, "utf8"));
    const unknown = usedIn(css).filter((name) => !tokens.has(name) && !appProperties.has(name));
    expect(unknown).toEqual([]);
  });

  it.each(files)("%s has no hand-written colour", (path) => {
    const css = withoutComments(readFileSync(path, "utf8"));
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|lab|lch)\(/i);
  });

  it("defines both themes, the system one by default", () => {
    const css = readFileSync(TOKENS, "utf8");
    expect(css).toMatch(/:root,\s*\[data-theme="light"\]\s*\{\s*color-scheme: light;/);
    expect(css).toMatch(/\[data-theme="dark"\]\s*\{\s*color-scheme: dark;/);
    expect(css).toMatch(
      /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme\]\)\s*\{\s*color-scheme: dark;/,
    );
  });
});
