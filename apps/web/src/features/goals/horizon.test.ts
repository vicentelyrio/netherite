import { describe, expect, test } from 'vitest'
import { horizonElapsed, horizonLabel } from './horizon'

describe('goal horizon', () => {
  test('labels start with a capital', () => {
    expect(horizonLabel('forever')).toBe('Forever')
    expect(horizonLabel('5 years')).toBe('5 years')
  })

  test('elapsed counts whole days since it was made, and stops at the horizon', () => {
    const now = new Date('2026-03-11T12:00:00Z')
    expect(horizonElapsed({ created: '2026-03-01T00:00:00Z', horizonDays: 100 }, now)).toEqual({
      elapsed: 10,
      total: 100,
    })
    expect(horizonElapsed({ created: '2020-01-01T00:00:00Z', horizonDays: 100 }, now)).toEqual({
      elapsed: 100,
      total: 100,
    })
  })

  test('forever, or no start date, has nothing to measure', () => {
    const now = new Date('2026-03-11T12:00:00Z')
    expect(horizonElapsed({ created: '2026-03-01T00:00:00Z' }, now)).toBeUndefined()
    expect(horizonElapsed({ horizonDays: 100 }, now)).toBeUndefined()
  })
})
