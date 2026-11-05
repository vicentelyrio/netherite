import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globalSetup: ['./test/global.ts'],
    css: false,
    testTimeout: 20_000,
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
