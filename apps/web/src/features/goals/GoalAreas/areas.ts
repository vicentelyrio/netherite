import type { GoalRow } from '@netherite/api'
import { type DropTarget, placeIn } from '@/components/Reorder/placement'

export const noArea = 'No area'

export const groupByArea = (goals: ReadonlyArray<GoalRow>) => {
  const groups = new Map<string, GoalRow[]>()
  for (const goal of goals) {
    const area = goal.area ?? noArea
    groups.set(area, [...(groups.get(area) ?? []), goal])
  }
  return [...groups].map(([area, rows]) => ({ area, goals: rows }))
}

export const sum = (goals: ReadonlyArray<GoalRow>) =>
  goals.reduce(
    (acc, g) => ({
      done: acc.done + (g.progress?.done ?? 0),
      total: acc.total + (g.progress?.total ?? 0),
    }),
    { done: 0, total: 0 },
  )

export interface AreaMove {
  readonly id: string
  readonly payload: {
    readonly set?: { readonly area?: string; readonly position?: number }
    readonly unset?: ReadonlyArray<string>
  }
}

export const areaMoveFor = (
  goals: ReadonlyArray<{
    readonly id: string
    readonly rank: number
    readonly area?: string | undefined
  }>,
  goalId: string,
  target: DropTarget | undefined,
): AreaMove | undefined => {
  const goal = goals.find((g) => g.id === goalId)
  if (goal === undefined || target === undefined) return undefined
  const moving = (goal.area ?? noArea) !== target.list
  if (!moving && target.item === undefined) return undefined
  const rows = goals.filter((g) => (g.area ?? noArea) === target.list)
  const position = placeIn(rows, goalId, target)
  if (!moving && position === undefined) return undefined
  const set = {
    ...(position === undefined ? {} : { position }),
    ...(moving && target.list !== noArea ? { area: target.list } : {}),
  }
  return {
    id: goalId,
    payload: {
      ...(Object.keys(set).length > 0 ? { set } : {}),
      ...(moving && target.list === noArea ? { unset: ['area'] } : {}),
    },
  }
}
