import { describe, expect, test } from 'vitest'
import { renameArea, updateItem } from '../src/index'
import { cleanFiles, world } from './ops-helpers'

const goal = (n: number, area: string) =>
  `---\nid: GOAL-0000${n}\naliases: [GOAL-0000${n}]\ntype: goal\ntitle: G${n}\nstatus: active\narea: ${area}\n---\n\n# G${n}\n`

const withAreas = () => ({
  ...cleanFiles(),
  '/repo/netherite/goals/GOAL-00007-a.md': goal(7, 'Platform'),
  '/repo/netherite/goals/GOAL-00008-b.md': goal(8, 'Platform'),
  '/repo/netherite/goals/GOAL-00009-c.md': goal(9, 'Growth'),
})

describe('renaming an area', () => {
  test('changes it on every goal in the area, and on no other goal', async () => {
    const w = await world(withAreas())
    const result = await w.run(renameArea(w.repo, { from: 'Platform', to: 'Core' }))
    expect(result.renamed).toBe(2)
    expect(w.read('netherite/goals/GOAL-00007-a.md')).toContain('area: Core')
    expect(w.read('netherite/goals/GOAL-00008-b.md')).toContain('area: Core')
    expect(w.read('netherite/goals/GOAL-00009-c.md')).toContain('area: Growth')
  })

  test('an empty `from` gives an area to the goals that have none', async () => {
    const files = withAreas()
    const w = await world({
      ...files,
      '/repo/netherite/goals/GOAL-00010-d.md':
        '---\nid: GOAL-00010\naliases: [GOAL-00010]\ntype: goal\ntitle: G10\nstatus: active\n---\n\n# G10\n',
    })
    await w.run(renameArea(w.repo, { from: '', to: 'Misc' }))
    expect(w.read('netherite/goals/GOAL-00010-d.md')).toContain('area: Misc')
    expect(w.read('netherite/goals/GOAL-00009-c.md')).toContain('area: Growth')
  })

  test('an empty new name removes the area from its goals', async () => {
    const w = await world(withAreas())
    const result = await w.run(renameArea(w.repo, { from: 'Platform', to: '' }))
    expect(result.renamed).toBe(2)
    expect(w.read('netherite/goals/GOAL-00007-a.md')).not.toContain('area:')
    expect(w.read('netherite/goals/GOAL-00009-c.md')).toContain('area: Growth')
  })

  test('writes nothing for an empty or unchanged name', async () => {
    const w = await world(withAreas())
    const before = w.files()
    expect(await w.fail(renameArea(w.repo, { from: '', to: ' ' }))).toBeTruthy()
    expect((await w.run(renameArea(w.repo, { from: 'Platform', to: 'Platform' }))).renamed).toBe(0)
    expect(w.files()).toEqual(before)
  })
})

describe('retitling an item', () => {
  test('keeps the heading in step with the title', async () => {
    const w = await world(withAreas())
    await w.run(updateItem(w.repo, 'GOAL-00007', { set: { title: 'Renamed' } }))
    const text = w.read('netherite/goals/GOAL-00007-a.md') as string
    expect(text).toContain('title: Renamed')
    expect(text).toContain('\n# Renamed\n')
    expect(text).not.toContain('# G7')
  })
})
