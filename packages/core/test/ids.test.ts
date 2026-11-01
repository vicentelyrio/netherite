import { describe, expect, test } from 'vitest'
import { nextId, nextIds } from '../src/index'
import { itemFile, itemsFrom, scanFixture } from './helpers'

describe('nextId', () => {
  test('starts at 1 in an empty workspace', () => {
    expect(nextId([], 'task')).toBe('TASK-00001')
    expect(nextId([], 'adr')).toBe('ADR-00001')
  })

  test('is one more than the highest number for that prefix', () => {
    const items = itemsFrom({
      'a/TASK-00003-a.md': itemFile({ id: 'TASK-00003' }),
      'a/TASK-00007-b.md': itemFile({ id: 'TASK-00007' }),
      'a/ADR-00040-c.md': itemFile({ id: 'ADR-00040' }),
    })
    expect(nextId(items, 'task')).toBe('TASK-00008')
    expect(nextId(items, 'adr')).toBe('ADR-00041')
    expect(nextId(items, 'doc')).toBe('DOC-00001')
  })

  test('does not fill gaps', () => {
    const items = itemsFrom({ 'TASK-00010-x.md': itemFile({ id: 'TASK-00010' }) })
    expect(nextId(items, 'task')).toBe('TASK-00011')
  })

  test('a file name reserves its number even without frontmatter', () => {
    const items = itemsFrom({
      'tasks/TASK-00200-no-frontmatter.md': '# Just text\n',
      'tasks/TASK-00150-x.md': itemFile({ id: 'TASK-00150' }),
    })
    expect(nextId(items, 'task')).toBe('TASK-00201')
  })

  test('a frontmatter id that differs from the file name still counts', () => {
    const items = itemsFrom({ 'tasks/TASK-00005-x.md': itemFile({ id: 'TASK-00099' }) })
    expect(nextId(items, 'task')).toBe('TASK-00100')
  })

  test('duplicates and invalid ids do not break it', () => {
    const items = itemsFrom({
      'a.md': itemFile({ id: 'TASK-00002' }),
      'b.md': itemFile({ id: 'TASK-00002' }),
      'c.md': itemFile({ id: 'TASK-banana' }),
      'd.md': '---\nid: [oops\n---\n',
    })
    expect(nextId(items, 'task')).toBe('TASK-00003')
  })

  test('honours the configured padding and never truncates', () => {
    expect(nextId([], 'task', 3)).toBe('TASK-001')
    const items = itemsFrom({ 'a.md': itemFile({ id: 'TASK-99999' }) })
    expect(nextId(items, 'task')).toBe('TASK-100000')
  })

  test('nextIds returns consecutive ids', () => {
    expect(nextIds([], 'task', 3)).toEqual(['TASK-00001', 'TASK-00002', 'TASK-00003'])
    expect(nextIds([], 'task', 0)).toEqual([])
  })
})

describe('on fixtures/basic', () => {
  test('allocates after the highest id of each type', async () => {
    const items = await scanFixture()
    expect(nextId(items, 'task')).toBe('TASK-00093')
    expect(nextId(items, 'adr')).toBe('ADR-00004')
    expect(nextId(items, 'doc')).toBe('DOC-00004')
    expect(nextId(items, 'goal')).toBe('GOAL-00002')
    expect(nextId(items, 'project')).toBe('PRJ-00002')
    expect(nextId(items, 'context')).toBe('CTX-00002')
    expect(nextId(items, 'runbook')).toBe('RUN-00002')
  })
})
