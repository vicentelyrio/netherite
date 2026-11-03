import { describe, expect, test } from 'vitest'
import {
  commitsByWeek,
  type History,
  type ItemHistory,
  type Transition,
  timelineOf,
} from '../src/index'
import { world } from './ops-helpers'

const front = (type: string, id: string, extra: string) =>
  `---\nid: ${id}\naliases: [${id}]\ntype: ${type}\ntitle: ${id}\n${extra}---\n\n# ${id}\n`

const files = {
  '/repo/.netherite/config.yml': 'version: 1\n',
  '/repo/netherite/goals/GOAL-00001-g.md': front(
    'goal',
    'GOAL-00001',
    'status: active\nhorizon: 10 years\n',
  ),
  '/repo/netherite/projects/PRJ-00001-p.md': front(
    'project',
    'PRJ-00001',
    'goals: [GOAL-00001]\nstatus: active\ndue: 2026-03-20\nmilestone: Beta\n',
  ),
  '/repo/netherite/tasks/TASK-00001-a.md': front(
    'task',
    'TASK-00001',
    'project: PRJ-00001\nstate: done\ndue: 2026-01-30\n',
  ),
  '/repo/netherite/tasks/TASK-00002-b.md': front(
    'task',
    'TASK-00002',
    'project: PRJ-00001\nstate: blocked\ndue: 2026-02-10\n',
  ),
  '/repo/netherite/tasks/TASK-00003-c.md': front(
    'task',
    'TASK-00003',
    'project: PRJ-00001\nstate: backlog\n',
  ),
  '/repo/netherite/adr/ADR-00001-a.md': front(
    'adr',
    'ADR-00001',
    'status: accepted\ndate: 2026-01-02\n',
  ),
}

const ada = { name: 'Ada', email: 'ada@example.com' }
const t = (
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
  hash: `${id}${field}${date}`,
  date: `${date}T10:00:00Z`,
  author: ada,
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
  created: { hash: 'h', date: `${created}T10:00:00Z`, author: ada },
  deletedAt: undefined,
  commits: transitions.length,
})

const history: History = {
  items: new Map([
    [
      'GOAL-00001',
      item('GOAL-00001', 'goal', '2026-01-01', [
        t('GOAL-00001', 'goal', 'status', undefined, 'active', '2026-01-01'),
      ]),
    ],
    [
      'PRJ-00001',
      item('PRJ-00001', 'project', '2026-01-01', [
        t('PRJ-00001', 'project', 'status', undefined, 'active', '2026-01-01'),
        t('PRJ-00001', 'project', 'goals', undefined, ['GOAL-00001'], '2026-01-01'),
      ]),
    ],
    [
      'TASK-00001',
      item('TASK-00001', 'task', '2026-01-05', [
        t('TASK-00001', 'task', 'state', undefined, 'backlog', '2026-01-05'),
        t('TASK-00001', 'task', 'project', undefined, 'PRJ-00001', '2026-01-05'),
        t('TASK-00001', 'task', 'state', 'backlog', 'doing', '2026-01-08'),
        t('TASK-00001', 'task', 'state', 'doing', 'done', '2026-01-20'),
      ]),
    ],
    [
      'TASK-00002',
      item('TASK-00002', 'task', '2026-01-06', [
        t('TASK-00002', 'task', 'state', undefined, 'backlog', '2026-01-06'),
        t('TASK-00002', 'task', 'project', undefined, 'PRJ-00001', '2026-01-06'),
        t('TASK-00002', 'task', 'state', 'backlog', 'doing', '2026-01-10'),
        t('TASK-00002', 'task', 'state', 'doing', 'blocked', '2026-01-25'),
      ]),
    ],
    [
      'TASK-00003',
      item('TASK-00003', 'task', '2026-01-07', [
        t('TASK-00003', 'task', 'state', undefined, 'backlog', '2026-01-07'),
        t('TASK-00003', 'task', 'project', undefined, 'PRJ-00001', '2026-01-07'),
      ]),
    ],
    [
      'ADR-00001',
      item('ADR-00001', 'adr', '2026-01-02', [
        t('ADR-00001', 'adr', 'status', undefined, 'proposed', '2026-01-02'),
        t('ADR-00001', 'adr', 'status', 'proposed', 'accepted', '2026-01-09'),
      ]),
    ],
  ]),
  commits: 5,
  log: [
    { hash: 'a', date: '2026-02-03T10:00:00Z' },
    { hash: 'b', date: '2026-01-26T10:00:00Z' },
    { hash: 'c', date: '2026-01-27T10:00:00Z' },
    { hash: 'd', date: '2026-01-05T10:00:00Z' },
    { hash: 'e', date: '2026-01-01T10:00:00Z' },
  ],
  partial: false,
}
const now = '2026-02-15T12:00:00Z'

describe('timeline', () => {
  test('goals, projects and tasks carry their dates, holds and due dates', async () => {
    const w = await world(files)
    const tl = timelineOf(w.repo, history, { now })
    expect(tl.today).toBe('2026-02-15')
    expect(tl.from).toBe('2026-01-01')
    expect(tl.goals[0]).toMatchObject({
      id: 'GOAL-00001',
      horizon: '10 years',
      started: '2026-01-08',
    })
    expect(tl.projects[0]).toMatchObject({
      id: 'PRJ-00001',
      goal: 'GOAL-00001',
      milestone: 'Beta',
      due: '2026-03-20',
      started: '2026-01-08',
    })
    const done = tl.tasks.find((x) => x.id === 'TASK-00001')
    expect(done).toMatchObject({
      status: 'done',
      started: '2026-01-08',
      finished: '2026-01-20',
      overdue: false,
    })
    expect(tl.decisions[0]).toMatchObject({
      id: 'ADR-00001',
      proposed: '2026-01-02',
      accepted: '2026-01-09',
    })
  })

  test('overdue and planned are decided from today', async () => {
    const w = await world(files)
    const tl = timelineOf(w.repo, history, { now })
    const task = (id: string) => tl.tasks.find((x) => x.id === id)
    expect(task('TASK-00002')).toMatchObject({ overdue: true, planned: false, status: 'hold' })
    expect(task('TASK-00002')?.holds).toEqual([{ from: '2026-01-25' }])
    expect(task('TASK-00003')).toMatchObject({ overdue: false, planned: true })
    const early = timelineOf(w.repo, history, { now: '2026-02-05T12:00:00Z' })
    expect(early.tasks.find((x) => x.id === 'TASK-00002')?.overdue).toBe(false)
  })

  test('the window leaves out what does not touch it', async () => {
    const w = await world(files)
    const tl = timelineOf(w.repo, history, { from: '2026-02-01', to: '2026-02-28', now })
    expect(tl.tasks.map((x) => x.id).sort()).toEqual(['TASK-00002', 'TASK-00003'])
    expect(tl.decisions).toEqual([])
    expect(tl.projects).toHaveLength(1)
  })

  test('activity counts commits per week, empty weeks included', () => {
    const weeks = commitsByWeek(history)
    expect(weeks[0]).toEqual({ week: '2025-12-29', count: 1 })
    expect(weeks.find((x) => x.week === '2026-01-26')?.count).toBe(2)
    expect(weeks.at(-1)).toEqual({ week: '2026-02-02', count: 1 })
    expect(weeks.reduce((n, x) => n + x.count, 0)).toBe(5)
    expect(weeks).toHaveLength(6)
  })
})
