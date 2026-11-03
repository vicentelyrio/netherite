import { describe, expect, test } from 'vitest'
import { tagMap } from '../src/index'
import { world } from './ops-helpers'

const item = (type: string, id: string, extra: string) =>
  `---\nid: ${id}\naliases: [${id}]\ntype: ${type}\ntitle: ${id}\n${extra}---\n\n# ${id}\n`

const files = {
  '/repo/.netherite/config.yml': 'version: 1\n',
  '/repo/netherite/goals/GOAL-00001-g.md': item(
    'goal',
    'GOAL-00001',
    'status: active\narea: Product\n',
  ),
  '/repo/netherite/projects/PRJ-00001-p.md': item(
    'project',
    'PRJ-00001',
    'goals: [GOAL-00001]\nstatus: active\nlabels: [backend]\n',
  ),
  '/repo/netherite/tasks/TASK-00001-a.md': item(
    'task',
    'TASK-00001',
    'project: PRJ-00001\nstate: backlog\nlabels: [backend, api]\n',
  ),
  '/repo/netherite/tasks/TASK-00002-b.md': item(
    'task',
    'TASK-00002',
    'project: PRJ-00001\nstate: backlog\nlabels: [backend, api, Back-End]\n',
  ),
  '/repo/netherite/docs/DOC-00001-d.md': item('doc', 'DOC-00001', 'tags: [guide, guides]\n'),
  '/repo/netherite/docs/DOC-00002-e.md': item('doc', 'DOC-00002', 'tags: [guide, setup]\n'),
  '/repo/netherite/docs/DOC-00003-f.md': item('doc', 'DOC-00003', 'tags: [setup]\n'),
}

describe('tag map', () => {
  test('counts how often tags are on the same item, and what each tag is used by', async () => {
    const w = await world(files)
    const map = tagMap(w.repo)
    const edge = (a: string, b: string) =>
      map.edges.find((e) => [e.a.name, e.b.name].sort().join() === [a, b].sort().join())?.count
    expect(edge('api', 'backend')).toBe(2)
    expect(edge('backend', 'Back-End')).toBe(1)
    expect(edge('guide', 'setup')).toBe(1)
    const backend = map.tags.find((t) => t.name === 'backend')
    expect(backend?.byType).toEqual({ project: 1, task: 2 })
    expect(backend?.often.map((o) => [o.name, o.count])).toEqual([
      ['api', 2],
      ['Back-End', 1],
    ])
  })

  test('a tag clusters under the area of its goals; the others by what they are used with', async () => {
    const w = await world(files)
    const map = tagMap(w.repo)
    const cluster = (name: string) => map.tags.find((t) => t.name === name)?.cluster
    expect(cluster('backend')).toBe('Product')
    expect(cluster('api')).toBe('Product')
    // Docs have no goal: guide and setup are used together, and named after the most used.
    expect(cluster('guide')).toBe(cluster('setup'))
    expect(cluster('guide')).not.toBe('Product')
    expect(map.clusters.map((c) => c.tags).reduce((a, b) => a + b, 0)).toBe(map.tags.length)
  })

  test('tags that would be alone in a group are put together as Other', async () => {
    const w = await world({
      ...files,
      '/repo/netherite/docs/DOC-00004-g.md':
        '---\nid: DOC-00004\naliases: [DOC-00004]\ntype: doc\ntitle: G\ntags: [lonely]\n---\n\n# G\n',
    })
    const map = tagMap(w.repo)
    expect(map.tags.find((t) => t.name === 'lonely')?.cluster).toBe('Other')
  })

  test('spellings of one tag are likely duplicates', async () => {
    const w = await world(files)
    const pairs = tagMap(w.repo).duplicates.map((d) => [d.a.name, d.b.name, d.reason].join(' '))
    expect(pairs).toContain('guide guides name')
    expect(pairs.some((p) => p.includes('backend') && p.includes('Back-End'))).toBe(true)
    expect(pairs.some((p) => p.includes('api') && p.includes('guide'))).toBe(false)
  })

  test('without tags there is nothing to map', async () => {
    const w = await world({ '/repo/.netherite/config.yml': 'version: 1\n' })
    expect(tagMap(w.repo)).toEqual({ tags: [], edges: [], clusters: [], duplicates: [] })
  })
})
