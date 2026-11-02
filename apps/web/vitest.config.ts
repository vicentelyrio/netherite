import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globalSetup: ['./test/global.ts'],
    css: false,
    testTimeout: 20_000,
    // The Playwright tests run under `pnpm e2e`, in a real browser.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
