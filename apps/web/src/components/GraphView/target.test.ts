import { describe, expect, test } from 'vitest'
import type { GraphData } from './layout'
import { graphTarget } from './target'

const node = (id: string, type: string) => ({ id, type, title: id, path: `${id}.md` })
const data = {
  nodes: [
    node('GOAL-00001', 'goal'),
    node('PRJ-00001', 'project'),
    node('TASK-00001', 'task'),
    node('TASK-00002', 'task'),
    node('ADR-00001', 'adr'),
  ],
  edges: [
    { from: 'PRJ-00001', to: 'GOAL-00001', kind: 'belongs_to' },
    { from: 'TASK-00001', to: 'PRJ-00001', kind: 'belongs_to' },
    { from: 'TASK-00002', to: 'ADR-00001', kind: 'implements' },
  ],
} as unknown as GraphData
const at = (id: string) => graphTarget(data.nodes.find((n) => n.id === id) as never, data)

describe('graphTarget', () => {
  test('a goal and a project go to their pages', () => {
    expect(at('GOAL-00001')).toEqual({ to: '/goals/$id', params: { id: 'GOAL-00001' } })
    expect(at('PRJ-00001')).toEqual({ to: '/projects/$id', params: { id: 'PRJ-00001' } })
  })

  test('a task opens its drawer on the board of the project it belongs to', () => {
    expect(at('TASK-00001')).toEqual({
      to: '/projects/$id',
      params: { id: 'PRJ-00001' },
      search: { task: 'TASK-00001' },
    })
  })

  test('a task with no project, and any other item, go to the item page', () => {
    expect(at('TASK-00002')).toEqual({ to: '/items/$id', params: { id: 'TASK-00002' } })
    expect(at('ADR-00001')).toEqual({ to: '/items/$id', params: { id: 'ADR-00001' } })
  })
})
