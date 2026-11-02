import { describe, expect, test } from 'vitest'
import { linkOptions, openWikiLink } from '../src/editor/complete'

const targets = [
  { id: 'ADR-00001', title: 'Callbacks', type: 'adr' },
  { id: 'ADR-00007', title: 'Use GNU Stow', type: 'adr' },
  { id: 'TASK-00001', title: 'Core', type: 'task' },
  { id: 'TASK-00002', title: 'Add the CLI', type: 'task' },
  { id: 'DOC-00001', title: 'App overview', type: 'doc' },
]

describe('the unfinished link before the cursor', () => {
  test.each([
    ['see [[', ''],
    ['see [[ADR', 'ADR'],
    ['[[ADR-0000', 'ADR-0000'],
    ['text [[use gnu', 'use gnu'],
  ])('%j is open, with %j typed', (before, typed) => {
    expect(openWikiLink.exec(before)?.[1]).toBe(typed)
  })

  test.each(['see [[ADR-00007]]', 'see [ADR', '[[a|b', '[[a#b', 'plain', '[[a]] and [['])(
    '%j is not open',
    (before) => {
      const m = openWikiLink.exec(before)
      // "[[a]] and [[" is open at the second link; the others are not.
      expect(Boolean(m)).toBe(before === '[[a]] and [[')
    },
  )
})

describe('suggestions', () => {
  test('nothing typed: everything, in ID order', () => {
    expect(linkOptions(targets, '').map((o) => o.label)).toEqual([
      'ADR-00001',
      'ADR-00007',
      'DOC-00001',
      'TASK-00001',
      'TASK-00002',
    ])
  })

  test('an ID prefix, case-insensitive', () => {
    expect(linkOptions(targets, 'adr').map((o) => o.label)).toEqual(['ADR-00001', 'ADR-00007'])
    expect(linkOptions(targets, 'TASK-0000').map((o) => o.label)).toEqual([
      'TASK-00001',
      'TASK-00002',
    ])
  })

  test('an exact ID comes first', () => {
    expect(linkOptions(targets, 'task-00002')[0]?.label).toBe('TASK-00002')
  })

  test('a title, by its start or anywhere in it', () => {
    expect(linkOptions(targets, 'core').map((o) => o.label)).toEqual(['TASK-00001'])
    expect(linkOptions(targets, 'stow').map((o) => o.label)).toEqual(['ADR-00007'])
    expect(linkOptions(targets, 'add the').map((o) => o.label)).toEqual(['TASK-00002'])
  })

  test('several words match across the ID and the title', () => {
    expect(linkOptions(targets, 'gnu adr').map((o) => o.label)).toEqual(['ADR-00007'])
  })

  test('title starts rank above titles that only contain it', () => {
    const list = [
      { id: 'DOC-00001', title: 'Notes on cores', type: 'doc' },
      { id: 'DOC-00002', title: 'Core ideas', type: 'doc' },
    ]
    expect(linkOptions(list, 'core').map((o) => o.label)).toEqual(['DOC-00002', 'DOC-00001'])
  })

  test('applying a suggestion closes the link, and shows the title and the type', () => {
    expect(linkOptions(targets, 'adr-00007')[0]).toEqual({
      label: 'ADR-00007',
      detail: 'Use GNU Stow',
      type: 'adr',
      apply: 'ADR-00007]]',
    })
  })

  test('no match is no suggestions, and the list is capped', () => {
    expect(linkOptions(targets, 'zzzz')).toEqual([])
    const many = Array.from({ length: 500 }, (_, i) => ({
      id: `TASK-${String(i).padStart(5, '0')}`,
      title: 't',
      type: 'task',
    }))
    expect(linkOptions(many, 'task')).toHaveLength(50)
    expect(linkOptions(many, 'task', 5)).toHaveLength(5)
  })
})
