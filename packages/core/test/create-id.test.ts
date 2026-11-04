import { describe, expect, test } from 'vitest'
import { createItem } from '../src/index'
import { world } from './ops-helpers'

describe('creating an item with an explicit ID', () => {
  test('uses the ID it is given, leaving a gap, and the next free ID goes after it', async () => {
    const w = await world()
    const made = await w.run(
      createItem(w.repo, { type: 'doc', title: 'Imported', id: 'DOC-00040' }),
    )
    expect(made.path).toContain('DOC-00040-imported')
    expect(w.read(made.path)).toContain('id: DOC-00040')
    const next = await w.run(createItem(w.repo, { type: 'doc', title: 'After' }))
    expect(next.path).toContain('DOC-00041')
  })

  test('refuses an ID in use, of another type, or not written as the workspace writes IDs', async () => {
    const w = await world()
    const before = w.files()
    for (const [type, id] of [
      ['doc', 'DOC-00001'],
      ['doc', 'TASK-00099'],
      ['doc', 'DOC-1'],
      ['doc', 'nonsense'],
    ] as const) {
      expect(await w.fail(createItem(w.repo, { type, title: 'X', id })), id).toMatchObject({
        _tag: 'ValidationError',
        issues: [{ path: ['id'] }],
      })
    }
    expect(w.files()).toEqual(before)
  })
})
