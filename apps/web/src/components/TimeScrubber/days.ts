import { addDays, dayDiff } from '@/infrastructure/datetime'

/** Whole days from one `YYYY-MM-DD` to another. */
export const dayIndex = dayDiff

/** The day `index` days after `from`. */
export const dayAt = addDays

/** How many days a playback frame moves, so a whole history plays in about 90 frames. */
export const stepFor = (from: string, to: string) =>
  Math.max(1, Math.round(dayIndex(from, to) / 90))
