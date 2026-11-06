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

const moving = [
  { id: 'G1', area: 'Health', rank: 1 },
  { id: 'G3', area: 'Health', rank: 3 },
  { id: 'G4', area: 'Work', rank: 4 },
  { id: 'G2', rank: 2 },
]

describe('moving a goal', () => {
  test('to the end of another area', () => {
    expect(areaMoveFor(moving, 'G1', { list: 'Work' })).toEqual({
      id: 'G1',
      payload: { set: { position: 4.5, area: 'Work' } },
    })
  })

  test('a goal without an area can join one, before a goal in it', () => {
    expect(areaMoveFor(moving, 'G2', { list: 'Work', item: 'G4', edge: 'before' })).toEqual({
      id: 'G2',
      payload: { set: { position: 3, area: 'Work' } },
    })
  })

  test('dropping on No area removes the field', () => {
    expect(areaMoveFor(moving, 'G1', { list: noArea })).toEqual({
      id: 'G1',
      payload: { set: { position: 2.5 }, unset: ['area'] },
    })
  })

  test('within its area only the position changes', () => {
    expect(areaMoveFor(moving, 'G3', { list: 'Health', item: 'G1', edge: 'before' })).toEqual({
      id: 'G3',
      payload: { set: { position: 0 } },
    })
  })

  test('its own place, its own column, no target or an unknown goal change nothing', () => {
    expect(areaMoveFor(moving, 'G1', { list: 'Health' })).toBeUndefined()
    expect(
      areaMoveFor(moving, 'G1', { list: 'Health', item: 'G3', edge: 'before' }),
    ).toBeUndefined()
    expect(areaMoveFor(moving, 'G2', { list: noArea })).toBeUndefined()
    expect(areaMoveFor(moving, 'G1', undefined)).toBeUndefined()
    expect(areaMoveFor(moving, 'nope', { list: 'Work' })).toBeUndefined()
  })
})
