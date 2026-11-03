import { describe, expect, test } from 'vitest'
import { diffLines, hasChanges } from '@/components/ItemEditor/diff'

const set = (c: ReadonlySet<number>) => [...c].sort((a, b) => a - b)
const diff = (a: string, b: string) => {
  const d = diffLines(a, b)
  return { added: set(d.added), modified: set(d.modified), deleted: set(d.deleted) }
}

describe('the change gutter', () => {
  test('same text, no changes', () => {
    expect(diff('a\nb\nc\n', 'a\nb\nc\n')).toEqual({ added: [], modified: [], deleted: [] })
    expect(hasChanges(diffLines('a', 'a'))).toBe(false)
  })

  test('a new line is added', () => {
    expect(diff('a\nc\n', 'a\nb\nc\n')).toEqual({ added: [2], modified: [], deleted: [] })
  })

  test('a changed line is modified, not added and deleted', () => {
    expect(diff('a\nb\nc\n', 'a\nB\nc\n')).toEqual({ added: [], modified: [2], deleted: [] })
  })

  test('removed lines leave a mark on the line above', () => {
    expect(diff('a\nb\nc\n', 'a\nc\n')).toEqual({ added: [], modified: [], deleted: [1] })
  })

  test('removing the first lines marks "before the first line" as 0', () => {
    expect(diff('a\nb\nc\n', 'c\n')).toEqual({ added: [], modified: [], deleted: [0] })
  })

  test('replacing two lines with three: two modified and one added', () => {
    expect(diff('a\nb\nc\nd\n', 'a\nX\nY\nZ\nd\n')).toEqual({
      added: [4],
      modified: [2, 3],
      deleted: [],
    })
  })

  test('replacing three lines with one: one modified', () => {
    expect(diff('a\nb\nc\nd\ne\n', 'a\nX\ne\n')).toEqual({ added: [], modified: [2], deleted: [] })
  })

  test('separate changes are separate', () => {
    expect(diff('1\n2\n3\n4\n5\n6\n', '1\nTWO\n3\n4\n5\n6\nseven\n')).toEqual({
      added: [7],
      modified: [2],
      deleted: [],
    })
  })

  test('an empty committed text makes every line new; empty text deletes everything', () => {
    expect(diff('', 'a\nb')).toEqual({ added: [1, 2], modified: [], deleted: [] })
    expect(diff('a\nb', '')).toEqual({ added: [], modified: [], deleted: [0] })
  })

  test('a trailing newline is not a line', () => {
    expect(diff('a\n', 'a')).toEqual({ added: [], modified: [], deleted: [] })
  })

  test('moved text shows as removed in one place and added in another', () => {
    const d = diff('a\nb\nc\nd\n', 'a\nc\nd\nb\n')
    expect(d.added.length + d.deleted.length).toBeGreaterThan(0)
  })

  test('a long file with one edit in the middle is quick and exact', () => {
    const lines = Array.from({ length: 3000 }, (_, i) => `line ${i}`)
    const edited = [...lines]
    edited[1500] = 'changed'
    const start = Date.now()
    expect(diff(lines.join('\n'), edited.join('\n'))).toEqual({
      added: [],
      modified: [1501],
      deleted: [],
    })
    expect(Date.now() - start).toBeLessThan(500)
  })

  test('texts that are very different still give an answer without exploding', () => {
    const a = Array.from({ length: 2500 }, (_, i) => `a${i}`).join('\n')
    const b = Array.from({ length: 2500 }, (_, i) => `b${i}`).join('\n')
    const d = diffLines(a, b)
    expect(d.modified.size).toBe(2500)
  })
})
