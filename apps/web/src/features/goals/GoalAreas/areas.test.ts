import type { GoalRow } from '@netherite/api'
import { describe, expect, test } from 'vitest'
import { groupByArea, noArea, sum } from './areas'

const goal = (id: string, area?: string, done = 0, total = 0) =>
  ({ id, area, progress: { done, total } }) as unknown as GoalRow

describe('areas', () => {
  test('goals are grouped by area in the order they arrive, goals without one under "No area"', () => {
    const groups = groupByArea([goal('a', 'Health'), goal('b'), goal('c', 'Health')])
    expect(groups.map((g) => [g.area, g.goals.map((x) => x.id)])).toEqual([
      ['Health', ['a', 'c']],
      [noArea, ['b']],
    ])
  })

  test('progress adds up across goals, and a goal without progress counts as nothing', () => {
    expect(sum([goal('a', 'x', 3, 10), goal('b', 'x', 2, 4), { id: 'c' } as GoalRow])).toEqual({
      done: 5,
      total: 14,
    })
  })
})
