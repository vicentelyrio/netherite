import type { History, ItemHistory, Transition } from '../src/index'

const front = (type: string, id: string, extra: string) =>
  `---\nid: ${id}\naliases: [${id}]\ntype: ${type}\ntitle: ${id}\n${extra}---\n\n# ${id}\n`

export const files = {
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

export const history: History = {
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
export const now = '2026-02-15T12:00:00Z'
