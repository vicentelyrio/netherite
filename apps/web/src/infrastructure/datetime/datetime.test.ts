import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  addDays,
  ago,
  dayDiff,
  daysBetween,
  eachDay,
  formatDate,
  formatDateTime,
  formatDay,
  formatWeekStart,
  formatYear,
  isoDay,
  nowIso,
  resetClock,
  setClock,
} from '.'

beforeEach(() => setClock('2026-11-02T12:00:00'))
afterEach(resetClock)

describe('formatting', () => {
  test('dates, days, years and times in the short form of the designs', () => {
    expect(formatDate('2026-08-03T09:30:00')).toBe('3 Aug 2026')
    expect(formatDay('2026-08-03T09:30:00')).toBe('3 Aug')
    expect(formatYear('2026-08-03T09:30:00')).toBe('2026')
    expect(formatDateTime('2023-01-14T03:06:00')).toBe('14 Jan 2023, 03:06')
  })

  test('a missing or unreadable date shows a dash', () => {
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('not a date')).toBe('—')
    expect(formatDateTime('')).toBe('—')
  })

  test('a week start is shown as that UTC day', () => {
    expect(formatWeekStart('2026-10-26')).toBe('26 Oct')
  })

  test('the written day of a timestamp is kept, whatever the offset', () => {
    expect(isoDay('2026-08-03T23:30:00-07:00')).toBe('2026-08-03')
    expect(isoDay('2026-08-03')).toBe('2026-08-03')
  })
})

describe('time since', () => {
  test('daysBetween counts whole days, both ways', () => {
    expect(daysBetween('2026-10-30T12:00:00')).toBe(3)
    expect(daysBetween('2026-11-02T12:00:00', '2026-10-30T12:00:00')).toBe(-3)
    expect(daysBetween('nope')).toBeUndefined()
  })

  test('ago uses the design wording at each size', () => {
    expect(ago('2026-11-02T08:00:00')).toBe('today')
    expect(ago('2026-10-31T12:00:00')).toBe('2d ago')
    expect(ago('2026-09-14T12:00:00')).toBe('7w ago')
    expect(ago('2026-07-02T12:00:00')).toBe('4mo ago')
    expect(ago('2023-11-01T12:00:00')).toBe('3y ago')
  })

  test('ago never says the future, and shows a dash for no date', () => {
    expect(ago('2026-12-01T12:00:00')).toBe('today')
    expect(ago(undefined)).toBe('—')
  })

  test('the clock is injectable: now and the saved timestamp follow it', () => {
    setClock('2030-01-01T00:00:00Z')
    expect(nowIso()).toBe('2030-01-01T00:00:00.000Z')
    expect(ago('2029-12-30T00:00:00Z')).toBe('2d ago')
  })
})

describe('calendar days', () => {
  test('adding days crosses months, years and leap days on the calendar', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  test('the difference is whole days, even across a daylight saving change', () => {
    expect(dayDiff('2026-03-01', '2026-03-31')).toBe(30)
    expect(dayDiff('2026-11-02', '2026-10-26')).toBe(-7)
    expect(dayDiff('2026-03-28', '2026-03-30')).toBe(2)
  })

  test('each day lists both ends, and nothing when the end is before the start', () => {
    expect(eachDay('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ])
    expect(eachDay('2026-03-02', '2026-03-01')).toEqual([])
  })
})
