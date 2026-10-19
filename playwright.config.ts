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
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
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
  // Sert le build E2E (pnpm build:e2e doit avoir été exécuté). TODO (devops) : servir avec les mêmes
  // en-têtes CSP que la production (ADR-OPS-03) quand dist/_headers existera.
  webServer: {
    command: `pnpm exec vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 60_000,
  },
});
