import type { TagUse } from '@netherite/api'
import { describe, expect, test } from 'vitest'
import { filterTags, renameOutcome } from '@/features/tags'

const tag = (name: string, field: 'tags' | 'labels', total = 1): TagUse => ({
  name,
  field,
  total,
  byType: { doc: total },
  ids: [],
})
const tags = [
  tag('ops', 'tags', 3),
  tag('shell', 'tags'),
  tag('backend', 'labels'),
  tag('ops', 'labels'),
]

describe('filtering tags', () => {
  test('by kind and by text together', () => {
    expect(filterTags(tags, 'all', '')).toHaveLength(4)
    expect(filterTags(tags, 'labels', '').map((t) => t.name)).toEqual(['backend', 'ops'])
    expect(filterTags(tags, 'tags', 'SH').map((t) => t.name)).toEqual(['shell'])
    expect(filterTags(tags, 'all', 'ops')).toHaveLength(2)
  })
})

describe('what a new name does', () => {
  const ops = tags[0] as TagUse
  test('is nothing for the same name, an error for none or spaces', () => {
    expect(renameOutcome(tags, ops, 'ops')).toBe('same')
    expect(renameOutcome(tags, ops, '  ')).toBe('empty')
    expect(renameOutcome(tags, ops, 'two words')).toBe('spaces')
  })

  test('merges into a name already used in the same field, and renames otherwise', () => {
    expect(renameOutcome(tags, ops, 'shell')).toBe('merge')
    // "backend" exists as a label, not as a tag: so for a tag it is just a rename.
    expect(renameOutcome(tags, ops, 'backend')).toBe('rename')
    expect(renameOutcome(tags, ops, 'operations')).toBe('rename')
  })
})
