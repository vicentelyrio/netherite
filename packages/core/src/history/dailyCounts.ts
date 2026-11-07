import type { History } from './history.types'
import { utcDay } from './weeks'

export interface DayCount {
  readonly day: string
  readonly count: number
}

export const commitsByDay = (
  history: History,
  range: { readonly from?: string; readonly to?: string } = {},
): ReadonlyArray<DayCount> => {
  const counts = new Map<string, number>()
  for (const commit of history.log) {
    const day = utcDay(commit.date)
    const inside =
      (range.from === undefined || day >= range.from) && (range.to === undefined || day <= range.to)
    if (inside) counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([day, count]) => ({ day, count }))
}
