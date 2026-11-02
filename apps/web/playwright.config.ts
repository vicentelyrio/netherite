import { defineConfig } from '@playwright/test'

/**
 * End-to-end tests (TASK-00048): the built app in a real browser, against a real `netherite serve`
 * over a throwaway git repository, asserting the files it wrote. Run `pnpm build` first, then
 * `pnpm e2e`. Locally it uses the installed Chrome; set CI to use Playwright's own Chromium
 * (`pnpm exec playwright install chromium`).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...(process.env.CI ? {} : { channel: 'chrome' }),
    trace: 'retain-on-failure',
    viewport: { width: 1600, height: 1000 },
  },
})
