// SEC-03a: config/security-headers.mjs is the single source of the HTTP security headers.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CSP,
  SECURITY_HEADERS,
  renderHeadersFile,
  securityHeadersPlugin,
} from "../../config/security-headers.mjs";

describe("security headers config", () => {
  it("has a strict CSP matching ADR-OPS-06", () => {
    expect(CSP).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; " +
        "connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; " +
        "form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
    );
    expect(CSP).not.toMatch(/unsafe-inline|unsafe-eval|unsafe-hashes|wasm-unsafe-eval/);
  });

  it("carries the other mandatory headers", () => {
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(SECURITY_HEADERS["Referrer-Policy"]).toBe("no-referrer");
    expect(SECURITY_HEADERS["Permissions-Policy"]).toContain("camera=()");
    expect(SECURITY_HEADERS["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(SECURITY_HEADERS["Strict-Transport-Security"]).toMatch(/^max-age=\d+$/);
  });

  it("renders a _headers file with every global header and LF endings", () => {
    const file = renderHeadersFile();
    expect(file).not.toContain("\r");
    expect(file.endsWith("\n")).toBe(true);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(file).toContain(`  ${name}: ${value}\n`);
    }
  });

  it("exposes the same headers to vite preview", () => {
    const plugin = securityHeadersPlugin();
    const cfg = (plugin.config as () => { preview: { headers: unknown } })();
    expect(cfg.preview.headers).toEqual(SECURITY_HEADERS);
  });
});

describe("dist/_headers", () => {
  let dir = "";
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "p152-headers-"));
    writeFileSync(join(dir, "index.html"), "<!doctype html><title>t</title>");
  });
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("is emitted by a real Vite build, identical to the config output", async () => {
    await build({
      configFile: false,
      root: dir,
      logLevel: "silent",
      plugins: [securityHeadersPlugin()],
      build: { outDir: join(dir, "out") },
    });
    expect(readFileSync(join(dir, "out", "_headers"), "utf8")).toBe(renderHeadersFile());
  });

  it.skipIf(!existsSync("dist/_headers"))("the project build output matches too", () => {
    expect(readFileSync("dist/_headers", "utf8")).toBe(renderHeadersFile());
  });
});
