import { eachDay } from '@/infrastructure/datetime'

export interface Change {
  /** Signed text such as `+3` or `-2`; `=` when nothing changed. */
  readonly text: string
  readonly direction: 'up' | 'down' | 'same'
}

/** How a number moved against the period before. Without a previous value there is nothing to say. */
export const changeOf = (value: number, previous: number | undefined): Change | undefined => {
  if (previous === undefined) return undefined
  const diff = Math.round((value - previous) * 10) / 10
  if (diff === 0) return { text: '=', direction: 'same' }
  return { text: `${diff > 0 ? '+' : ''}${diff}`, direction: diff > 0 ? 'up' : 'down' }
}

/** Done over everything, as a whole percent; an empty set is 0. */
export const percent = (done: number, total: number) =>
  total <= 0 ? 0 : Math.round((done / total) * 100)

/** Which of five shades a day's commits fall in, 0 for none, so the busiest day is the darkest. */
export const heatLevel = (count: number, max: number): 0 | 1 | 2 | 3 | 4 => {
  if (count <= 0 || max <= 0) return 0
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as 1 | 2 | 3 | 4
}

/** Every day from `from` to `to`, with its commit count, for the heat map. */
export const heatDays = (
  from: string,
  to: string,
  counts: ReadonlyArray<{ readonly date: string; readonly count: number }>,
): ReadonlyArray<{ readonly date: string; readonly count: number }> => {
  const byDay = new Map(counts.map((c) => [c.date, c.count]))
  return eachDay(from, to).map((date) => ({ date, count: byDay.get(date) ?? 0 }))
}
