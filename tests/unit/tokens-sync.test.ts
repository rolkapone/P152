// The app consumes a copy of the design tokens (src/ui/styles/tokens.css): it must stay
// identical to the ui-designer's source (docs/design/ui/tokens.css), synced block included.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MARKER = "/* ======================= BEGIN SYNCED";

function syncedPart(path: string): string {
  const text = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const start = text.indexOf(MARKER);
  if (start < 0) throw new Error(`${path}: no BEGIN SYNCED marker`);
  return text.slice(start);
}

describe("design tokens copy", () => {
  it("is identical to docs/design/ui/tokens.css from the BEGIN SYNCED line to the end", () => {
    expect(syncedPart("src/ui/styles/tokens.css")).toBe(syncedPart("docs/design/ui/tokens.css"));
  });

  it("does not load a font file that is not shipped yet (Inter is self-hosted in US-005)", () => {
    expect(readFileSync("src/ui/styles/tokens.css", "utf8")).not.toMatch(/url\(/);
  });
});
