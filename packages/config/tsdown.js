import { defineConfig } from 'tsdown'

/**
 * Shared tsdown options for Netherite library packages.
 * @param {import('tsdown').UserConfig} [overrides]
 */
export const defineLibrary = (overrides = {}) =>
  defineConfig({
    entry: ['src/index.ts'],
    format: 'esm',
    platform: 'node',
    target: 'node24',
    dts: true,
    sourcemap: true,
    clean: true,
    ...overrides,
  })
