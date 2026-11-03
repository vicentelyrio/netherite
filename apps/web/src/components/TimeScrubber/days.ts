const DAY = 86_400_000

const at = (day: string) => Date.parse(`${day}T00:00:00Z`)

/** Whole days from one `YYYY-MM-DD` to another. */
export const dayIndex = (from: string, day: string) => Math.round((at(day) - at(from)) / DAY)

/** The day `index` days after `from`. */
export const dayAt = (from: string, index: number) =>
  new Date(at(from) + index * DAY).toISOString().slice(0, 10)

/** How many days a playback frame moves, so a whole history plays in about 90 frames. */
export const stepFor = (from: string, to: string) =>
  Math.max(1, Math.round(dayIndex(from, to) / 90))
