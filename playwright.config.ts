import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const isCI = Boolean(process.env["CI"]);
// Le projet mobile est prévu mais désactivé au MVP (écran minimal 1366x768, cf. docs/design/ux/principes.md).
// Activer avec E2E_MOBILE=1.
const withMobile = process.env["E2E_MOBILE"] === "1";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  // Les captures de référence ne sont générées/comparées que dans l'image Playwright (ADR-OPS-05).
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: isCI,
  // Pas de retry : un test instable est un bug à signaler, pas à masquer (règle QA).
  retries: 0,
  // The 3D view renders with SwiftShader (CPU): more than a few parallel pages saturate the
  // machine and time out (US-004, measured with 16 workers on 24 threads). Same idea as CI.
  workers: isCI ? 2 : 4,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  // Loads the 3D view once before the workers start (cold start, see global-setup.ts).
  globalSetup: "./tests/e2e/global-setup.ts",
  expect: {
    // Rendu WebGL logiciel (SwiftShader) : anti-crénelage légèrement variable.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, threshold: 0.2, animations: "disabled" },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-US",
  },
  projects: [
    {
      name: "chromium-1366",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
    {
      name: "chromium-1920",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
    ...(withMobile
      ? [
          {
            name: "chromium-mobile",
            use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
          },
        ]
      : []),
  ],
  // Sert le build E2E (pnpm build:e2e doit avoir été exécuté) avec les en-têtes de production
  // (config/security-headers.mjs, via le plugin Vite : preview.headers, ADR-OPS-06).
  webServer: {
    command: `pnpm exec vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 60_000,
  },
});
