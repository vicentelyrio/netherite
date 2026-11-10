import { describe, expect, test } from 'vitest'
import { cardBeside, cardInColumn, columnBeside } from './boardKeys'

const columns = [['a', 'b'], [], ['c', 'd', 'e']]

describe('moving around the board by keyboard', () => {
  test('up and down stay in the column and stop at its ends', () => {
    expect(cardInColumn(columns, 'a', 1)).toBe('b')
    expect(cardInColumn(columns, 'a', -1)).toBeUndefined()
    expect(cardInColumn(columns, 'e', 1)).toBeUndefined()
  })

  test('left and right skip empty columns and keep the row where they can', () => {
    expect(cardBeside(columns, 'b', 1)).toBe('d')
    expect(cardBeside(columns, 'e', -1)).toBe('b')
    expect(cardBeside(columns, 'c', -1)).toBe('a')
    expect(cardBeside(columns, 'c', 1)).toBeUndefined()
  })

  test('a card has a column beside it unless it is at the edge', () => {
    expect(columnBeside(['todo', 'done'], 'todo', 1)).toBe('done')
    expect(columnBeside(['todo', 'done'], 'done', 1)).toBeUndefined()
    expect(columnBeside(['todo', 'done'], 'todo', -1)).toBeUndefined()
  })
})
