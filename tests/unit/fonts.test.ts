// Self-hosted Inter and Lucide icons (US-005 T2, design-system.md §4 and §6): the shipped files,
// their licences and the CSP that serves them.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CSP_DIRECTIVES } from "../../config/security-headers.mjs";

const FONT_URL = "/fonts/inter-latin-wght-normal.woff2";
const FONT_FILE = `public${FONT_URL}`;
// Subset produced from the rsms/inter v4.1 release (docs/design/3d/licences-assets.md).
const FONT_SHA256 = "86aa7097d4f5d752167fe0a22136fd2d72720f73d048ef0ef9d6e0a91364fe1b";

const fontsCss = readFileSync("src/ui/styles/fonts.css", "utf8");
const registry = readFileSync("docs/design/3d/licences-assets.md", "utf8");

describe("self-hosted Inter", () => {
  const font = readFileSync(FONT_FILE);

  it("is the recorded WOFF2 subset, light enough to preload", () => {
    expect(font.subarray(0, 4).toString("latin1")).toBe("wOF2");
    expect(createHash("sha256").update(font).digest("hex")).toBe(FONT_SHA256);
    expect(font.length).toBeLessThan(80 * 1024);
  });

  it("is declared with font-display: swap and a system fallback", () => {
    expect(fontsCss).toContain(`url("${FONT_URL}") format("woff2")`);
    expect(fontsCss).toMatch(/font-display: swap;/);
    expect(fontsCss).toMatch(/font-weight: 100 900;/);
    const tokens = readFileSync("src/ui/styles/tokens.css", "utf8");
    expect(tokens).toMatch(/--font-sans: "Inter", system-ui,/);
  });

  it("is preloaded by index.html from the same origin", () => {
    const html = readFileSync("index.html", "utf8");
    expect(html).toMatch(
      new RegExp(
        String.raw`<link\s+rel="preload"\s+href="${FONT_URL}"\s+as="font"\s+type="font/woff2"\s+crossorigin`,
      ),
    );
  });

  it("ships its SIL OFL 1.1 licence next to it and in the licence registry", () => {
    const ofl = readFileSync("public/fonts/OFL.txt", "utf8");
    expect(ofl).toContain("Copyright (c) 2016 The Inter Project Authors");
    expect(ofl).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(registry).toMatch(/\| Inter .*SIL Open Font License 1\.1.*\|/);
    expect(registry).toContain(FONT_SHA256);
  });

  it("is served by the CSP without widening it: fonts from 'self' only", () => {
    const fontSources = CSP_DIRECTIVES["font-src"] ?? CSP_DIRECTIVES["default-src"];
    expect(fontSources).toEqual(["'self'"]);
  });
});

describe("Lucide icons", () => {
  it("are a pinned dependency with their ISC licence recorded", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
    };
    const version = pkg.dependencies["lucide-react"];
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(registry).toContain(`| lucide-react | ${version} | ISC |`);
  });

  it("keep their licence notice in the build (the minifier strips @license headers)", () => {
    const config = readFileSync("vite.config.ts", "utf8");
    expect(config).toContain(`license: { fileName: "THIRD_PARTY_LICENSES.md" }`);
  });
});
