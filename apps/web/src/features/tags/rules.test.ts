import { describe, expect, test } from 'vitest'
import {
  filterTags,
  grepFor,
  groupsOf,
  keyOf,
  pairKey,
  recentIds,
  renameOutcome,
  shareOf,
} from './rules'

const tag = (field: 'tags' | 'labels', name: string) => ({ field, name })

describe('tag rules', () => {
  test('the text and kind filters apply together', () => {
    const all = [tag('tags', 'backend'), tag('labels', 'backend'), tag('tags', 'docs')]
    expect(filterTags(all, 'all', 'back')).toHaveLength(2)
    expect(filterTags(all, 'labels', 'back')).toEqual([tag('labels', 'backend')])
    expect(filterTags(all, 'all', '  ')).toHaveLength(3)
  })

  test('renaming to a name in use merges, nothing to do for the same name', () => {
    const all = [tag('tags', 'a'), tag('tags', 'b'), tag('labels', 'c')]
    expect(renameOutcome(all, all[0] as never, 'b')).toBe('merge')
    expect(renameOutcome(all, all[0] as never, 'c')).toBe('rename')
    expect(renameOutcome(all, all[0] as never, 'a')).toBe('same')
    expect(renameOutcome(all, all[0] as never, 'a b')).toBe('spaces')
    expect(renameOutcome(all, all[0] as never, ' ')).toBe('empty')
  })

  test('the grep is the same search by hand, and special characters are escaped', () => {
    expect(grepFor(tag('labels', 'backend'))).toBe(
      "grep -rnE '^labels:.*[[ ,]backend[], ]' netherite",
    )
    expect(grepFor(tag('tags', 'c++'))).toContain('c\\+\\+')
  })

  test('recent items are the highest IDs', () => {
    expect(recentIds(['TASK-00002', 'TASK-00010', 'DOC-00001', 'TASK-00003'], 2)).toEqual([
      'TASK-00010',
      'TASK-00003',
    ])
  })

  test('keys, pairs and shares', () => {
    expect(keyOf(tag('tags', 'x'))).toBe('tags:x')
    const a = { a: tag('tags', 'x'), b: tag('tags', 'y') }
    expect(pairKey(a)).toBe(pairKey({ a: a.b, b: a.a }))
    expect(shareOf(3, 6)).toBe(0.5)
    expect(shareOf(3, 0)).toBe(0)
    expect(groupsOf({ goal: 1, task: 4, doc: 2, adr: 1 })).toEqual({
      goals: 1,
      projects: 0,
      tasks: 4,
      docs: 3,
    })
  })
})
