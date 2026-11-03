import { describe, expect, test } from 'vitest'
import { dayAt, dayIndex, stepFor } from './days'

describe('scrubber days', () => {
  test('count days between dates and back', () => {
    expect(dayIndex('2026-01-01', '2026-01-31')).toBe(30)
    expect(dayIndex('2026-03-01', '2026-02-28')).toBe(-1)
    expect(dayAt('2026-01-30', 3)).toBe('2026-02-02')
    expect(dayAt('2026-01-01', dayIndex('2026-01-01', '2026-11-03'))).toBe('2026-11-03')
  })

  test('a frame moves a day for short ranges and more for long ones', () => {
    expect(stepFor('2026-11-01', '2026-11-03')).toBe(1)
    expect(stepFor('2026-01-01', '2026-11-03')).toBe(3)
    expect(stepFor('2020-01-01', '2026-11-03')).toBe(28)
  })
})
