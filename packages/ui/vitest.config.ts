import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    // Components render in jsdom and some open portals and transitions; the 5 second default is
    // too tight when a CI runner is busy.
    testTimeout: 15_000,
  },
})
