import { addDays, dayDiff } from '@/infrastructure/datetime'

export const dayIndex = dayDiff

export const dayAt = addDays

export const stepFor = (from: string, to: string) =>
  Math.max(1, Math.round(dayIndex(from, to) / 90))
