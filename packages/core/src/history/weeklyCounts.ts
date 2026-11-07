import { AdrStatus } from '@netherite/schema'
import type { History } from './history.types'
import { decisionLog, taskTransitions } from './itemQueries'
import { utcDay, type WeekCount, type WeekRange, weekStart, weeksBetween } from './weeks'

export const commitsByWeek = (
  history: History,
  range: WeekRange = {},
): ReadonlyArray<WeekCount> => {
  const days = history.log.map((c) => utcDay(c.date)).sort()
  const from = range.from ?? days[0]
  const to = range.to ?? days.at(-1)
  if (from === undefined || to === undefined) return []
  const counts = new Map(weeksBetween(from, to).map((week) => [week, 0]))
  for (const day of days) {
    const week = weekStart(day)
    if (counts.has(week)) counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  return [...counts].map(([week, count]) => ({ week, count }))
}

export const completionsByWeek = (
  history: History,
  doneStates: ReadonlySet<string>,
  range: WeekRange = {},
): ReadonlyArray<WeekCount> => {
  const done = taskTransitions(history).filter(
    (t) =>
      typeof t.to === 'string' &&
      doneStates.has(t.to) &&
      !(typeof t.from === 'string' && doneStates.has(t.from)),
  )
  const dates = done.map((t) => utcDay(t.date))
  const from =
    range.from ??
    dates.reduce<string | undefined>((a, b) => (a === undefined || b < a ? b : a), undefined)
  const to =
    range.to ??
    dates.reduce<string | undefined>((a, b) => (a === undefined || b > a ? b : a), undefined)
  if (from === undefined || to === undefined) return []
  const counts = new Map(weeksBetween(from, to).map((week) => [week, 0]))
  for (const transition of done) {
    const week = weekStart(transition.date)
    if (counts.has(week)) counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  return [...counts].map(([week, count]) => ({ week, count }))
}

export interface AdrWeek {
  readonly week: string
  readonly proposed: number
  readonly accepted: number
  readonly deprecated: number
  readonly superseded: number
}

export const adrActivityByWeek = (
  history: History,
  range: WeekRange = {},
): ReadonlyArray<AdrWeek> => {
  const log = decisionLog(history)
  const dates = log.map((t) => utcDay(t.date))
  const from = range.from ?? dates[0]
  const to = range.to ?? dates.at(-1)
  if (from === undefined || to === undefined) return []
  const weeks = new Map<string, { -readonly [K in keyof AdrWeek]: AdrWeek[K] }>(
    weeksBetween(from, to).map((week) => [
      week,
      { week, proposed: 0, accepted: 0, deprecated: 0, superseded: 0 },
    ]),
  )
  for (const t of log) {
    const row = weeks.get(weekStart(t.date))
    if (
      row !== undefined &&
      (t.to === AdrStatus.Proposed ||
        t.to === AdrStatus.Accepted ||
        t.to === AdrStatus.Deprecated ||
        t.to === AdrStatus.Superseded)
    ) {
      row[t.to]++
    }
  }
  return [...weeks.values()]
}
