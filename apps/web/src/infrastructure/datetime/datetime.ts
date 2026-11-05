import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { now } from './clock'

dayjs.extend(utc)

/** What dates arrive as: ISO text from the API, a `Date`, or a moment already. */
export type DateInput = string | number | Date | Dayjs | undefined | null

const DAY = 'YYYY-MM-DD'

/** A moment, or `undefined` when the input is missing or not a date. */
export const parse = (value: DateInput): Dayjs | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : undefined
}

const show = (value: DateInput, pattern: string, empty = '—') =>
  parse(value)?.format(pattern) ?? empty

/** `3 Aug 2026`. */
export const formatDate = (value: DateInput) => show(value, 'D MMM YYYY')

/** `3 Aug`, for places where the year is shown elsewhere. */
export const formatDay = (value: DateInput) => show(value, 'D MMM')

/** `14 Jan 2023, 03:06`. */
export const formatDateTime = (value: DateInput) => show(value, 'D MMM YYYY, HH:mm')

/** The year of a date, `2026`. */
export const formatYear = (value: DateInput) => show(value, 'YYYY')

/** `3 Aug` for a week that starts on this ISO day, whatever the time zone of the reader. */
export const formatWeekStart = (day: string) => dayjs.utc(`${day}T00:00:00Z`).format('D MMM')

/**
 * The calendar day of a timestamp as written, `2026-08-03`, so a commit made late in the evening
 * somewhere else still shows the day its author saw.
 */
export const isoDay = (value: string): string => {
  const written = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0]
  return written ?? show(value, DAY, '')
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export const daysBetween = (from: DateInput, to: DateInput = now()): number | undefined => {
  const a = parse(from)
  const b = parse(to)
  return a && b ? b.diff(a, 'day') : undefined
}

/**
 * How long ago a date was, in the design's short form: `today`, `2d ago`, `7w ago`, `4mo ago`,
 * `2y ago`. A missing or unreadable date is `—`.
 */
export const ago = (value: DateInput, at: DateInput = now()): string => {
  const days = daysBetween(value, at)
  if (days === undefined) return '—'
  const past = Math.max(0, days)
  if (past < 1) return 'today'
  if (past < 14) return `${past}d ago`
  if (past < 60) return `${Math.floor(past / 7)}w ago`
  if (past < 365) return `${Math.floor(past / 30)}mo ago`
  return `${Math.floor(past / 365)}y ago`
}

/** A `YYYY-MM-DD` day as a UTC moment, so adding days or months never meets a time zone or daylight saving. */
export const utcDay = (day: string): Dayjs => dayjs.utc(day)

/** The day `days` after `day` (before when negative), both as `YYYY-MM-DD`. */
export const addDays = (day: string, days: number): string =>
  utcDay(day).add(days, 'day').format(DAY)

/** Whole calendar days from one `YYYY-MM-DD` to another, negative when `to` is earlier. */
export const dayDiff = (from: string, to: string): number => utcDay(to).diff(utcDay(from), 'day')

/** Every day from `from` to `to`, both included, as `YYYY-MM-DD`. */
export const eachDay = (from: string, to: string): ReadonlyArray<string> =>
  Array.from({ length: Math.max(0, dayDiff(from, to) + 1) }, (_, i) => addDays(from, i))

/** The current moment as ISO text, for saving "seen at". */
export const nowIso = (): string => now().toISOString()
