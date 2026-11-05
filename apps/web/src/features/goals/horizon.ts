import dayjs from 'dayjs'
import { parse } from '@/infrastructure/datetime'

export const horizonLabel = (horizon: string) =>
  horizon === '' ? horizon : horizon.charAt(0).toUpperCase() + horizon.slice(1)

export const horizonElapsed = (
  goal: { readonly created?: string | undefined; readonly horizonDays?: number | undefined },
  now: Date,
) => {
  if (goal.horizonDays === undefined || goal.created === undefined) return undefined
  const start = parse(goal.created)
  if (start === undefined) return undefined
  const days = Math.max(0, dayjs(now).diff(start, 'day'))
  return { elapsed: Math.min(days, goal.horizonDays), total: goal.horizonDays }
}
