import type { Timeline } from '@netherite/api'
import { addDays } from '@/infrastructure/datetime'
import { type Span, spanOf, type TickUnit } from './layout'

export interface ActivityBar {
  readonly start: string
  readonly count: number
  readonly span: Span
  readonly height: number
}

const dayLength = 1
const weekLength = 7
const fullHeight = 100
const shortestBar = 10

export const barsAreDaily = (unit: TickUnit) => unit === 'day'

export const activityBars = (
  data: Pick<typeof Timeline.Type, 'activity' | 'activityByDay'>,
  unit: TickUnit,
  from: string,
  to: string,
): ReadonlyArray<ActivityBar> => {
  const daily = barsAreDaily(unit)
  const buckets = daily
    ? data.activityByDay.map((d) => ({ start: d.day, count: d.count }))
    : data.activity.map((w) => ({ start: w.week, count: w.count }))
  const length = daily ? dayLength : weekLength
  const peak = Math.max(1, ...buckets.map((b) => b.count))
  return buckets.flatMap(({ start, count }) => {
    const span = spanOf(start, addDays(start, length), from, to)
    if (span === undefined || span.width === 0 || count === 0) return []
    return [{ start, count, span, height: Math.max(shortestBar, (count / peak) * fullHeight) }]
  })
}
