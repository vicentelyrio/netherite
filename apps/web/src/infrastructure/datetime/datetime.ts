import dayjs, { type Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { now } from './clock'

dayjs.extend(utc)

export type DateInput = string | number | Date | Dayjs | undefined | null

const DAY = 'YYYY-MM-DD'

export const parse = (value: DateInput): Dayjs | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : undefined
}

const show = (value: DateInput, pattern: string, empty = '—') =>
  parse(value)?.format(pattern) ?? empty

export const formatDate = (value: DateInput) => show(value, 'D MMM YYYY')

export const formatDay = (value: DateInput) => show(value, 'D MMM')

export const formatDateTime = (value: DateInput) => show(value, 'D MMM YYYY, HH:mm')

export const formatYear = (value: DateInput) => show(value, 'YYYY')

export const formatWeekStart = (day: string) => dayjs.utc(`${day}T00:00:00Z`).format('D MMM')

export const isoDay = (value: string): string => {
  const written = /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0]
  return written ?? show(value, DAY, '')
}

export const daysBetween = (from: DateInput, to: DateInput = now()): number | undefined => {
  const a = parse(from)
  const b = parse(to)
  return a && b ? b.diff(a, 'day') : undefined
}

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

export const utcDay = (day: string): Dayjs => dayjs.utc(day)

export const addDays = (day: string, days: number): string =>
  utcDay(day).add(days, 'day').format(DAY)

export const dayDiff = (from: string, to: string): number => utcDay(to).diff(utcDay(from), 'day')

export const eachDay = (from: string, to: string): ReadonlyArray<string> =>
  Array.from({ length: Math.max(0, dayDiff(from, to) + 1) }, (_, i) => addDays(from, i))

export const nowIso = (): string => now().toISOString()
