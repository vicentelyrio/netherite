import { describe, expect, test } from 'vitest'
import { withServer } from './helpers'

describe('smoke', () => {
  test('health', async () => {
    const health = await withServer((s) => s.client.meta.health())
    expect(health.name).toBe('netherite')
  })
})
