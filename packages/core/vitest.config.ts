import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Some tests build and check whole generated workspaces; with every package's tests running at
    // once, the 5 second default is too tight.
    testTimeout: 30_000,
    // Scale tests measure time, so they run alone: `pnpm test:scale`.
    exclude: [...configDefaults.exclude, '**/*.scale.test.ts'],
  },
})
