import { describe, expect, test } from 'vitest'
import { percent } from '@/features/stats'

describe('chart numbers', () => {
  test('percent is done over total, and 0 for a week with no tasks', () => {
    expect(percent({ week: '2026-01-05', done: 3, total: 8 })).toBe(38)
    expect(percent({ week: '2026-01-05', done: 0, total: 0 })).toBe(0)
    expect(percent({ week: '2026-01-05', done: 5, total: 5 })).toBe(100)
  })
})
