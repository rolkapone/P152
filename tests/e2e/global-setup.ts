import { chromium, type FullConfig } from "@playwright/test";

/**
 * Warm-up before the workers start (US-004 review): the first load of the 3D view after a
 * cold start (preview server, disk cache, SwiftShader) took up to 24 s while 4 workers
 * started together. One page is loaded here until the scene is ready, alone on the machine.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL;
  if (baseURL === undefined) return;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(baseURL);
    await page.locator('[data-scene-status="ready"]').waitFor({ timeout: 120_000 });
  } finally {
    await browser.close();
  }
}
