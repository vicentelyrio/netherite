import { describe, expect, test } from 'vitest'
import { niceMax } from '@/components'
import { percent } from '@/features/stats'

describe('chart numbers', () => {
  test('percent is done over total, and 0 for a week with no tasks', () => {
    expect(percent({ week: '2026-01-05', done: 3, total: 8 })).toBe(38)
    expect(percent({ week: '2026-01-05', done: 0, total: 0 })).toBe(0)
    expect(percent({ week: '2026-01-05', done: 5, total: 5 })).toBe(100)
  })

  test('an axis tops out at a round number above the data', () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(3)).toBe(3)
    expect(niceMax(7)).toBe(8)
    expect(niceMax(23)).toBe(24)
    expect(niceMax(180)).toBe(200)
  })
})
