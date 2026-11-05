import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // With every package's tests running at once, the 5 second default is too tight for tests that
    // build whole workspaces or start processes.
    testTimeout: 30_000,
  },
})
