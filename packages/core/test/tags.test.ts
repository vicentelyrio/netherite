import { describe, expect, test } from 'vitest'
import { renameTag, tagUsage } from '../src/index'
import { cleanFiles, world } from './ops-helpers'

const withTags = () => ({
  ...cleanFiles(),
  '/repo/netherite/docs/DOC-00002-a.md':
    '---\nid: DOC-00002\naliases: [DOC-00002]\ntype: doc\ntitle: A\ntags: [ops, shell]\n---\n\n# A\n\nText.\n',
  '/repo/netherite/docs/DOC-00003-b.md':
    '---\nid: DOC-00003\naliases: [DOC-00003]\ntype: doc\ntitle: B\ntags: [ops, shell-setup]\n---\n\n# B\n\nText.\n',
  '/repo/netherite/adr/ADR-00004-c.md':
    '---\nid: ADR-00004\naliases: [ADR-00004]\ntype: adr\ntitle: C\nstatus: accepted\ndate: 2026-01-04\ntags: [ops]\n---\n\n# C\n\nText.\n',
})

describe('tag usage', () => {
  test('counts each tag and label, most used first, with how many items of each type carry it', async () => {
    const w = await world(withTags())
    const use = tagUsage(w.repo)
    expect(use[0]).toMatchObject({
      name: 'ops',
      field: 'tags',
      total: 3,
      byType: { doc: 2, adr: 1 },
    })
    expect(use.find((u) => u.name === 'shell')?.ids).toEqual(['DOC-00002'])
    expect(use.find((u) => u.field === 'labels' && u.name === 'backend')?.total).toBe(1)
  })
})

describe('renaming a tag', () => {
  test('changes it in every file that has it, and nowhere else', async () => {
    const w = await world(withTags())
    const result = await w.run(renameTag(w.repo, { field: 'tags', from: 'ops', to: 'operations' }))
    expect(result.renamed).toBe(3)
    expect(w.read('netherite/docs/DOC-00002-a.md')).toContain('tags: [operations, shell]')
    expect(w.read('netherite/adr/ADR-00004-c.md')).toContain('operations')
    expect(w.read('netherite/docs/DOC-00003-b.md')).toContain('shell-setup')
  })

  test('merges into a tag the item already has, without a duplicate', async () => {
    const w = await world(withTags())
    await w.run(renameTag(w.repo, { field: 'tags', from: 'shell', to: 'ops' }))
    const text = w.read('netherite/docs/DOC-00002-a.md') as string
    expect(text.match(/ops/g)).toHaveLength(1)
    expect(text).not.toContain('shell')
  })

  test('is scoped to the field: renaming a tag leaves a label of the same name alone', async () => {
    const w = await world(withTags())
    await w.run(renameTag(w.repo, { field: 'tags', from: 'backend', to: 'server' }))
    expect(w.read('netherite/tasks/TASK-00001-core.md')).toContain('labels: [backend]')
  })

  test('refuses an empty name or one with spaces, and writes nothing for the same name', async () => {
    const w = await world(withTags())
    const before = w.files()
    expect(
      (await w.fail(renameTag(w.repo, { field: 'tags', from: 'ops', to: '  ' }))) as unknown,
    ).toBeTruthy()
    expect(
      (await w.fail(renameTag(w.repo, { field: 'tags', from: 'ops', to: 'a b' }))) as unknown,
    ).toBeTruthy()
    expect(await w.run(renameTag(w.repo, { field: 'tags', from: 'ops', to: 'ops' }))).toEqual({
      renamed: 0,
      changed: [],
    })
    expect(w.files()).toEqual(before)
  })
})
