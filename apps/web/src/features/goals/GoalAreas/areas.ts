import type { GoalRow } from '@netherite/api'

export const noArea = 'No area'

/** Goals grouped by area, in the order the server sends them (areas by name, no area last). */
export const groupByArea = (goals: ReadonlyArray<GoalRow>) => {
  const groups = new Map<string, GoalRow[]>()
  for (const goal of goals) {
    const area = goal.area ?? noArea
    groups.set(area, [...(groups.get(area) ?? []), goal])
  }
  return [...groups].map(([area, rows]) => ({ area, goals: rows }))
}

/** Tasks done and in total across some goals. */
export const sum = (goals: ReadonlyArray<GoalRow>) =>
  goals.reduce(
    (acc, g) => ({
      done: acc.done + (g.progress?.done ?? 0),
      total: acc.total + (g.progress?.total ?? 0),
    }),
    { done: 0, total: 0 },
  )
