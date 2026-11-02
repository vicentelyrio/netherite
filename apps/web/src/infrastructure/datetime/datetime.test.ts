import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  ago,
  daysBetween,
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
