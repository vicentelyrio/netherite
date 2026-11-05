import { eachDay } from '@/infrastructure/datetime'

export interface Change {
  readonly text: string
  readonly direction: 'up' | 'down' | 'same'
}

export const changeOf = (value: number, previous: number | undefined): Change | undefined => {
  if (previous === undefined) return undefined
  const diff = Math.round((value - previous) * 10) / 10
  if (diff === 0) return { text: '=', direction: 'same' }
  return { text: `${diff > 0 ? '+' : ''}${diff}`, direction: diff > 0 ? 'up' : 'down' }
}

export const percent = (done: number, total: number) =>
  total <= 0 ? 0 : Math.round((done / total) * 100)

export const heatLevel = (count: number, max: number): 0 | 1 | 2 | 3 | 4 => {
  if (count <= 0 || max <= 0) return 0
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as 1 | 2 | 3 | 4
}

export const heatDays = (
  from: string,
  to: string,
  counts: ReadonlyArray<{ readonly date: string; readonly count: number }>,
): ReadonlyArray<{ readonly date: string; readonly count: number }> => {
  const byDay = new Map(counts.map((c) => [c.date, c.count]))
  return eachDay(from, to).map((date) => ({ date, count: byDay.get(date) ?? 0 }))
}

export const heatSummary = (
  days: ReadonlyArray<{ readonly date: string; readonly count: number }>,
) => {
  let active = 0
  let streak = 0
  let longest = 0
  let busiest: { date: string; count: number } | undefined
  for (const d of days) {
    if (d.count > 0) {
      active++
      streak++
      longest = Math.max(longest, streak)
      if (busiest === undefined || d.count > busiest.count) busiest = d
    } else streak = 0
  }
  return { active, longest, busiest }
}
