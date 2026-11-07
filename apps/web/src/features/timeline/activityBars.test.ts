import { describe, expect, test } from 'vitest'
import { activityBars } from './activityBars'

const data = {
  activity: [
    { week: '2026-10-26', count: 0 },
    { week: '2026-11-02', count: 3 },
  ],
  activityByDay: [
    { day: '2026-11-04', count: 1 },
    { day: '2026-11-07', count: 2 },
  ],
}

describe('activityBars', () => {
  test('a timeline counted in days has one bar a day, a day wide', () => {
    const bars = activityBars(data, 'day', '2026-11-01', '2026-11-11')
    expect(bars.map((b) => [b.start, b.count])).toEqual([
      ['2026-11-04', 1],
      ['2026-11-07', 2],
    ])
    expect(bars[0]?.span).toEqual({ left: 30, width: 10 })
  })

  test('a longer timeline has one bar a week, a week wide, and skips empty weeks', () => {
    const bars = activityBars(data, 'week', '2026-11-02', '2026-12-02')
    expect(bars.map((b) => b.start)).toEqual(['2026-11-02'])
    expect(bars[0]?.span.width).toBeCloseTo((7 / 30) * 100)
  })

  test('the busiest bar fills the row, and a quiet one stays visible', () => {
    const many = {
      activity: [],
      activityByDay: [
        { day: '2026-11-02', count: 100 },
        { day: '2026-11-03', count: 1 },
      ],
    }
    expect(activityBars(many, 'day', '2026-11-01', '2026-11-11').map((b) => b.height)).toEqual([
      100, 10,
    ])
  })

  test('bars outside the window are left out', () => {
    expect(activityBars(data, 'day', '2026-11-10', '2026-11-20')).toEqual([])
  })
})
