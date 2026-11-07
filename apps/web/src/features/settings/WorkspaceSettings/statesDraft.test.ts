import { describe, expect, test } from 'vitest'
import {
  changesOf,
  moved,
  problemOf,
  type StateRow,
  sameStates,
  toRows,
  toStates,
} from './statesDraft'

const states = [
  { name: 'backlog', category: 'todo' },
  { name: 'doing', category: 'active' },
  { name: 'done', category: 'done' },
]

const firstTwo = () => toRows(states).slice(0, 2) as [StateRow, StateRow]

describe('the states draft', () => {
  test('an untouched draft has no changes and no problems', () => {
    const rows = toRows(states)
    expect(sameStates(rows, states)).toBe(true)
    expect(problemOf(rows)).toBeUndefined()
    expect(changesOf(rows, states)).toEqual({ renamed: [], removed: [] })
  })

  test('a rename is told apart from a removal and from a new state', () => {
    const [backlog, doing] = firstTwo()
    const rows = [
      { ...backlog, name: ' queue ' },
      doing,
      { key: 9, original: undefined, name: 'review', category: 'active' },
    ]
    expect(changesOf(rows, states)).toEqual({
      renamed: [{ from: 'backlog', to: 'queue' }],
      removed: ['done'],
    })
    expect(toStates(rows)[0]?.name).toBe('queue')
  })

  test('removing a state and adding one with its name loses no tasks', () => {
    const [backlog, doing] = firstTwo()
    const rows = [backlog, doing, { key: 9, original: undefined, name: 'done', category: 'done' }]
    expect(changesOf(rows, states)).toEqual({ renamed: [], removed: [] })
  })

  test('order alone counts as a difference but warns about nothing', () => {
    const rows = moved(toRows(states), 2, 0)
    expect(rows.map((row) => row.name)).toEqual(['done', 'backlog', 'doing'])
    expect(sameStates(rows, states)).toBe(false)
    expect(changesOf(rows, states)).toEqual({ renamed: [], removed: [] })
  })

  test('names a list that cannot be saved', () => {
    const [backlog, doing] = firstTwo()
    expect(problemOf([])).toBe('none')
    expect(problemOf([{ ...backlog, name: '  ' }])).toBe('empty')
    expect(problemOf([backlog, { ...doing, name: 'backlog ' }])).toBe('duplicate')
  })
})
