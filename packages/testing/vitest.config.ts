import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // These tests start real `git` processes, which are slow on Windows runners; the 5 second
    // default is too tight there.
    testTimeout: 30_000,
  },
})
