import type { GoalRow } from '@netherite/api'
import { describe, expect, test } from 'vitest'
import { areaMoveFor, groupByArea, noArea, sum } from './areas'

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

const moving = [{ id: 'G1', area: 'Health' }, { id: 'G2' }]

describe('moving a goal between areas', () => {
  test('sets the new area', () => {
    expect(areaMoveFor(moving, 'G1', 'Work')).toEqual({
      id: 'G1',
      payload: { set: { area: 'Work' } },
    })
  })

  test('a goal without an area can join one', () => {
    expect(areaMoveFor(moving, 'G2', 'Work')).toEqual({
      id: 'G2',
      payload: { set: { area: 'Work' } },
    })
  })

  test('dropping on No area removes the field', () => {
    expect(areaMoveFor(moving, 'G1', noArea)).toEqual({
      id: 'G1',
      payload: { unset: ['area'] },
    })
  })

  test('the same area, no target or an unknown goal changes nothing', () => {
    expect(areaMoveFor(moving, 'G1', 'Health')).toBeUndefined()
    expect(areaMoveFor(moving, 'G2', noArea)).toBeUndefined()
    expect(areaMoveFor(moving, 'G1', undefined)).toBeUndefined()
    expect(areaMoveFor(moving, 'nope', 'Work')).toBeUndefined()
  })
})
