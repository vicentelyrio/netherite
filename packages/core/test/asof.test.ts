import { describe, expect, test } from 'vitest'
import { graphAsOf, graphOf, type History, type ItemHistory, type Transition } from '../src/index'
import { world } from './ops-helpers'

const front = (type: string, id: string, extra: string) =>
  `---\nid: ${id}\naliases: [${id}]\ntype: ${type}\ntitle: ${id}\n${extra}---\n\n# ${id}\n`

const files = {
  '/repo/.netherite/config.yml': 'version: 1\n',
  '/repo/netherite/goals/GOAL-00001-g.md': front('goal', 'GOAL-00001', 'status: active\n'),
  '/repo/netherite/projects/PRJ-00001-p.md': front(
    'project',
    'PRJ-00001',
    'goals: [GOAL-00001]\nstatus: active\n',
  ),
  '/repo/netherite/tasks/TASK-00001-a.md': front(
    'task',
    'TASK-00001',
    'project: PRJ-00001\nstate: done\n',
  ),
  '/repo/netherite/tasks/TASK-00002-b.md': front(
    'task',
    'TASK-00002',
    'project: PRJ-00001\nstate: doing\n',
  ),
  '/repo/netherite/adr/ADR-00001-o.md': front(
    'adr',
    'ADR-00001',
    'status: superseded\ndate: 2026-01-01\nsuperseded_by: ADR-00002\n',
  ),
  '/repo/netherite/adr/ADR-00002-n.md': front(
    'adr',
    'ADR-00002',
    'status: accepted\ndate: 2026-02-01\nsupersedes: [ADR-00001]\n',
  ),
}

const change = (
  id: string,
  type: string,
  field: string,
  from: string | undefined,
  to: string | string[],
  date: string,
): Transition => ({
  id,
  type,
  field,
  from,
  to,
  kind: from === undefined ? 'created' : 'changed',
  hash: `h-${id}-${field}-${date}`,
  date: `${date}T10:00:00Z`,
  author: { name: 'Ada', email: 'ada@example.com' },
})

const item = (
  id: string,
  type: string,
  created: string,
  transitions: Transition[],
): ItemHistory => ({
  id,
  type,
  paths: [],
  transitions,
  authors: [],
  created: { hash: 'h', date: `${created}T10:00:00Z`, author: { name: 'Ada', email: 'a@x' } },
  deletedAt: undefined,
  commits: transitions.length,
})

const history: History = {
  items: new Map([
    [
      'GOAL-00001',
      item('GOAL-00001', 'goal', '2026-01-01', [
        change('GOAL-00001', 'goal', 'status', undefined, 'active', '2026-01-01'),
      ]),
    ],
    [
      'PRJ-00001',
      item('PRJ-00001', 'project', '2026-01-01', [
        change('PRJ-00001', 'project', 'status', undefined, 'active', '2026-01-01'),
        change('PRJ-00001', 'project', 'goals', undefined, ['GOAL-00001'], '2026-01-01'),
      ]),
    ],
    [
      'TASK-00001',
      item('TASK-00001', 'task', '2026-01-10', [
        change('TASK-00001', 'task', 'state', undefined, 'backlog', '2026-01-10'),
        change('TASK-00001', 'task', 'project', undefined, 'PRJ-00001', '2026-01-10'),
        change('TASK-00001', 'task', 'state', 'backlog', 'done', '2026-01-20'),
      ]),
    ],
    [
      'TASK-00002',
      item('TASK-00002', 'task', '2026-01-15', [
        change('TASK-00002', 'task', 'state', undefined, 'backlog', '2026-01-15'),
        change('TASK-00002', 'task', 'project', undefined, 'PRJ-00001', '2026-01-15'),
        change('TASK-00002', 'task', 'state', 'backlog', 'doing', '2026-01-25'),
      ]),
    ],
    [
      'ADR-00001',
      item('ADR-00001', 'adr', '2026-01-01', [
        change('ADR-00001', 'adr', 'status', undefined, 'accepted', '2026-01-01'),
        change('ADR-00001', 'adr', 'status', 'accepted', 'superseded', '2026-02-05'),
      ]),
    ],
    [
      'ADR-00002',
      item('ADR-00002', 'adr', '2026-02-01', [
        change('ADR-00002', 'adr', 'status', undefined, 'proposed', '2026-02-01'),
        change('ADR-00002', 'adr', 'status', 'proposed', 'accepted', '2026-02-05'),
      ]),
    ],
  ]),
  commits: 10,
  partial: false,
}
const now = '2026-03-01T00:00:00Z'

describe('graph as of a date', () => {
  test('before any commit nothing existed', async () => {
    const w = await world(files)
    const g = graphAsOf(w.repo, history, { asOf: '2025-12-31', now })
    expect(g.nodes).toEqual([])
    expect(g.edges).toEqual([])
  })

  test('mid-history shows what existed, in the state it had', async () => {
    const w = await world(files)
    const g = graphAsOf(w.repo, history, { asOf: '2026-01-18', now })
    const byId = Object.fromEntries(g.nodes.map((n) => [n.id, n]))
    expect(Object.keys(byId).sort()).toEqual([
      'ADR-00001',
      'GOAL-00001',
      'PRJ-00001',
      'TASK-00001',
      'TASK-00002',
    ])
    expect(byId['TASK-00001']).toMatchObject({ status: 'backlog', parent: 'PRJ-00001' })
    expect(byId['PRJ-00001']).toMatchObject({
      status: 'progress',
      progress: 0,
      parent: 'GOAL-00001',
    })
  })

  test('progress follows the tasks done by then', async () => {
    const w = await world(files)
    const g = graphAsOf(w.repo, history, { asOf: '2026-01-26', now })
    const byId = Object.fromEntries(g.nodes.map((n) => [n.id, n]))
    expect(byId['TASK-00001']).toMatchObject({ status: 'done', progress: 1 })
    expect(byId['TASK-00002']).toMatchObject({ status: 'progress' })
    expect(byId['PRJ-00001']?.progress).toBe(0.5)
    expect(byId['GOAL-00001']?.progress).toBe(0.5)
  })

  test('a supersession shows from the day the new decision was accepted', async () => {
    const w = await world(files)
    const kinds = (asOf: string) =>
      graphAsOf(w.repo, history, { asOf, now }).edges.filter((e) => e.kind === 'supersedes')
    expect(kinds('2026-02-03')).toEqual([])
    expect(kinds('2026-02-05')).toEqual([
      { from: 'ADR-00002', to: 'ADR-00001', kind: 'supersedes' },
    ])
  })

  test('today is the live graph', async () => {
    const w = await world(files)
    const live = graphOf(w.repo)
    const past = graphAsOf(w.repo, history, { asOf: now, now })
    const pick = (n: { id: string; status?: string; progress?: number; parent?: string }) => [
      n.id,
      n.status,
      n.progress,
      n.parent,
    ]
    expect(past.nodes.map(pick).sort()).toEqual(live.nodes.map(pick).sort())
    expect(past.edges).toHaveLength(live.edges.length)
  })
})
