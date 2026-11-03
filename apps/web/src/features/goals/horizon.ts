/** `forever` becomes "Forever"; `5 years` stays as written, with a capital. */
export const horizonLabel = (horizon: string) =>
  horizon === '' ? horizon : horizon.charAt(0).toUpperCase() + horizon.slice(1)

/**
 * How much of its horizon a goal has used: whole days since it was made, and the days it looks
 * ahead. Missing when there is no end to measure against (forever) or no start date.
 */
export const horizonElapsed = (
  goal: { readonly created?: string | undefined; readonly horizonDays?: number | undefined },
  now: Date,
) => {
  if (goal.horizonDays === undefined || goal.created === undefined) return undefined
  const start = Date.parse(goal.created)
  if (Number.isNaN(start)) return undefined
  const days = Math.max(0, Math.floor((now.getTime() - start) / 86_400_000))
  return { elapsed: Math.min(days, goal.horizonDays), total: goal.horizonDays }
}
