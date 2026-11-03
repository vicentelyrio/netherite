import { describe, expect, test } from 'vitest'
import { changeOf, heatDays, heatLevel, percent } from './numbers'

describe('stats numbers', () => {
  test('a change is signed, equal, or unknown', () => {
    expect(changeOf(8, 5)).toEqual({ text: '+3', direction: 'up' })
    expect(changeOf(2.5, 4)).toEqual({ text: '-1.5', direction: 'down' })
    expect(changeOf(3, 3)).toEqual({ text: '=', direction: 'same' })
    expect(changeOf(3, undefined)).toBeUndefined()
  })

  test('percent is done over total, and 0 for none', () => {
    expect(percent(3, 8)).toBe(38)
    expect(percent(0, 0)).toBe(0)
  })

  test('heat levels scale to the busiest day', () => {
    expect(heatLevel(0, 8)).toBe(0)
    expect(heatLevel(1, 8)).toBe(1)
    expect(heatLevel(4, 8)).toBe(2)
    expect(heatLevel(8, 8)).toBe(4)
  })

  test('heat days run without gaps from the first day to the last', () => {
    const days = heatDays('2026-01-30', '2026-02-02', [{ date: '2026-02-01', count: 3 }])
    expect(days.map((d) => d.date)).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
      '2026-02-02',
    ])
    expect(days.map((d) => d.count)).toEqual([0, 0, 3, 0])
  })
})
