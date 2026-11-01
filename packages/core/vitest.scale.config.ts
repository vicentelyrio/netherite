import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.scale.test.ts'],
    fileParallelism: false,
  },
})
