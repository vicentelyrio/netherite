import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Scale tests measure time, so they run alone: `pnpm test:scale`.
    exclude: [...configDefaults.exclude, '**/*.scale.test.ts'],
  },
})
