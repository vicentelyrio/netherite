import { describe, expect, test } from 'vitest'
import { placeIn, positionAt } from './placement'

const rows = [
  { id: 'A', rank: 1 },
  { id: 'B', rank: 2 },
  { id: 'C', rank: 3 },
]

describe('positionAt', () => {
  test('between two items it takes the middle', () => {
    expect(positionAt([1, 2], 1)).toBe(1.5)
  })

  test('at the start it goes one lower', () => {
    expect(positionAt([1, 2], 0)).toBe(0)
  })

  test('at the end it stays below the next whole number, again and again', () => {
    expect(positionAt([3], 1)).toBe(3.5)
    expect(positionAt([3.5], 1)).toBe(3.75)
    expect(positionAt([3.75], 1)).toBeLessThan(4)
  })

  test('an empty list has nothing to be placed against', () => {
    expect(positionAt([], 0)).toBeUndefined()
  })
})

describe('placeIn', () => {
  test('moves up, before another item', () => {
    expect(placeIn(rows, 'C', { list: 'l', item: 'A', edge: 'before' })).toBe(0)
  })

  test('moves down, after another item', () => {
    expect(placeIn(rows, 'A', { list: 'l', item: 'B', edge: 'after' })).toBe(2.5)
    expect(placeIn(rows, 'A', { list: 'l', item: 'C', edge: 'after' })).toBe(3.5)
  })

  test('between its own neighbours nothing changes', () => {
    expect(placeIn(rows, 'B', { list: 'l', item: 'B', edge: 'after' })).toBeUndefined()
    expect(placeIn(rows, 'B', { list: 'l', item: 'A', edge: 'after' })).toBeUndefined()
    expect(placeIn(rows, 'B', { list: 'l', item: 'C', edge: 'before' })).toBeUndefined()
  })

  test('from another list it joins the end when dropped on no item', () => {
    expect(placeIn(rows, 'X', { list: 'l' })).toBe(3.5)
  })

  test('from another list it can land before an item', () => {
    expect(placeIn(rows, 'X', { list: 'l', item: 'B', edge: 'before' })).toBe(1.5)
  })
})
