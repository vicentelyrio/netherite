import { describe, expect, test } from 'vitest'
import { fitTo, layout, neighbourhood, subgraph, toGraphology } from '../src/graph/layout'

const data = {
  nodes: [
    { id: 'GOAL-00001', type: 'goal', title: 'Goal' },
    { id: 'PRJ-00001', type: 'project', title: 'Project' },
    { id: 'TASK-00001', type: 'task', title: 'One' },
    { id: 'TASK-00002', type: 'task', title: 'Two' },
    { id: 'DOC-00001', type: 'doc', title: 'Doc' },
  ],
  edges: [
    { from: 'PRJ-00001', to: 'GOAL-00001', kind: 'belongs_to' },
    { from: 'TASK-00001', to: 'PRJ-00001', kind: 'belongs_to' },
    { from: 'TASK-00002', to: 'PRJ-00001', kind: 'belongs_to' },
    { from: 'TASK-00002', to: 'TASK-00001', kind: 'depends_on' },
    { from: 'TASK-00002', to: 'TASK-00001', kind: 'reference' },
    { from: 'DOC-00001', to: 'GONE-00001', kind: 'reference' },
  ],
}

describe('the graph layout', () => {
  test('places every node, and the same graph the same way every time', () => {
    const a = layout(data)
    const b = layout(data)
    expect(a.map((p) => p.id)).toEqual(data.nodes.map((n) => n.id))
    expect(a.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
    expect(a).toEqual(b)
  })

  test('keeps nodes apart, and linked ones nearer than strangers', () => {
    const at = new Map(layout(data).map((p) => [p.id, p]))
    const d = (a: string, b: string) =>
      Math.hypot(
        (at.get(a)?.x ?? 0) - (at.get(b)?.x ?? 0),
        (at.get(a)?.y ?? 0) - (at.get(b)?.y ?? 0),
      )
    for (const [a, b] of [
      ['TASK-00001', 'TASK-00002'],
      ['GOAL-00001', 'PRJ-00001'],
    ] as const) {
      expect(d(a, b)).toBeGreaterThan(10)
    }
    expect(d('PRJ-00001', 'TASK-00001')).toBeLessThan(d('DOC-00001', 'TASK-00001'))
  })

  test('an empty graph, and one node, are fine', () => {
    expect(layout({ nodes: [], edges: [] })).toEqual([])
    expect(layout({ nodes: [data.nodes[0] as never], edges: [] })).toHaveLength(1)
  })
})

describe('a scope', () => {
  test('keeps the nodes in it and only the edges between them', () => {
    const scoped = subgraph(data, new Set(['PRJ-00001', 'TASK-00001']))
    expect(scoped.nodes.map((n) => n.id)).toEqual(['PRJ-00001', 'TASK-00001'])
    expect(scoped.edges).toEqual([{ from: 'TASK-00001', to: 'PRJ-00001', kind: 'belongs_to' }])
    expect(subgraph(data)).toBe(data)
  })

  test('neighbours come from graphology, and an edge to a missing node is dropped', () => {
    const graph = toGraphology(data)
    expect([...neighbourhood(graph, 'TASK-00001')].sort()).toEqual([
      'PRJ-00001',
      'TASK-00001',
      'TASK-00002',
    ])
    expect(neighbourhood(graph, 'DOC-00001')).toEqual(new Set(['DOC-00001']))
    expect(neighbourhood(graph, 'NOPE-00001').size).toBe(0)
  })
})

describe('fitting a view', () => {
  const view = { width: 1000, height: 700 }
  test('centres the points and scales them to fit with room to spare', () => {
    const fit = fitTo(
      [
        { x: 0, y: 0 },
        { x: 200, y: 100 },
      ],
      view,
    )
    expect(fit.k).toBeLessThanOrEqual(2)
    expect(fit.x + 100 * fit.k).toBeCloseTo(500)
    expect(fit.y + 50 * fit.k).toBeCloseTo(350)
    const wide = fitTo(
      [
        { x: -5000, y: 0 },
        { x: 5000, y: 0 },
      ],
      view,
    )
    expect(wide.k).toBeLessThan(0.2)
  })

  test('with no points, centres the origin', () => {
    expect(fitTo([], view)).toEqual({ x: 500, y: 350, k: 1 })
  })
})
