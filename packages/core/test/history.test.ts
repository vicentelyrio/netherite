import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { NodeServices } from '@effect/platform-node'
import { type GitRepository, openGit } from '@netherite/git'
import {
  basicHistory,
  type Commit,
  createGitRepo,
  emptyGitConfig,
  type GitRepo,
} from '@netherite/testing'
import { Effect } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  adrActivityByWeek,
  authorsOf,
  completionsByWeek,
  decisionLog,
  type History,
  progressSeries,
  readHistory,
  taskTransitions,
  weekStart,
} from '../src/index'

beforeAll(() => {
  process.env.GIT_CONFIG_GLOBAL = emptyGitConfig
  process.env.GIT_CONFIG_SYSTEM = emptyGitConfig
})

const run = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) =>
  Effect.runPromise(effect.pipe(Effect.provide(NodeServices.layer)))

const ada = { name: 'Ada Lovelace', email: 'ada@example.com' }
const grace = { name: 'Grace Hopper', email: 'grace@example.com' }

const adr = (id: string, status: string, extra = '', body = '# ADR\n') =>
  `---\nid: ${id}\naliases: [${id}]\ntype: adr\ntitle: ${id}\nstatus: ${status}\ndate: 2026-01-01\n${extra}---\n\n${body}`
const task = (id: string, state: string, project = 'PRJ-00001', body = '# Task\n') =>
  `---\nid: ${id}\naliases: [${id}]\ntype: task\ntitle: ${id}\nproject: ${project}\nstate: ${state}\n---\n\n${body}`
const project = (id: string, goals: string[]) =>
  `---\nid: ${id}\naliases: [${id}]\ntype: project\ntitle: ${id}\ngoals: [${goals.join(', ')}]\nstatus: active\n---\n`

const at = (
  date: string,
  message: string,
  write: Record<string, string>,
  author = ada,
  remove: string[] = [],
): Commit => ({
  message,
  date: `${date}T10:00:00Z`,
  author,
  write,
  remove,
})

const withHistory = async <A>(
  commits: ReadonlyArray<Commit>,
  use: (history: History, repo: GitRepo, git: GitRepository) => Promise<A>,
  options: { after?: string; limit?: number } = {},
) => {
  const repo = await createGitRepo({ history: commits })
  try {
    const git = await run(openGit(repo.root))
    const history = await run(readHistory(git, repo.root, { contentRoot: 'netherite', ...options }))
    return await use(history, repo, git)
  } finally {
    await repo.cleanup()
  }
}

const adrFile = (n: number, name = 'x') => `netherite/adr/ADR-0000${n}-${name}.md`
const taskFile = (n: number, name = 'x') => `netherite/tasks/TASK-0000${n}-${name}.md`

describe('ADR status over time', () => {
  const lifecycle: Commit[] = [
    at('2026-01-05', 'propose', { [adrFile(1)]: adr('ADR-00001', 'proposed') }, ada),
    at('2026-01-12', 'accept', { [adrFile(1)]: adr('ADR-00001', 'accepted') }, grace),
    at(
      '2026-01-14',
      'typo in the body',
      { [adrFile(1)]: adr('ADR-00001', 'accepted', '', '# ADR\n\nTypo fixed.\n') },
      ada,
    ),
    at('2026-02-02', 'propose another', { [adrFile(2)]: adr('ADR-00002', 'proposed') }, ada),
    at(
      '2026-02-09',
      'supersede',
      {
        [adrFile(1)]: adr('ADR-00001', 'superseded', 'superseded_by: ADR-00002\n'),
        [adrFile(2)]: adr('ADR-00002', 'accepted', 'supersedes: [ADR-00001]\n'),
      },
      grace,
    ),
  ]

  test('records each status change with who, when and the commit', async () => {
    await withHistory(lifecycle, async (history, repo) => {
      const log = decisionLog(history)
      expect(
        log.map((t) => [t.id, t.from, t.to, t.kind, t.date.slice(0, 10), t.author.name]),
      ).toEqual([
        ['ADR-00001', undefined, 'proposed', 'created', '2026-01-05', 'Ada Lovelace'],
        ['ADR-00001', 'proposed', 'accepted', 'changed', '2026-01-12', 'Grace Hopper'],
        ['ADR-00002', undefined, 'proposed', 'created', '2026-02-02', 'Ada Lovelace'],
        ['ADR-00001', 'accepted', 'superseded', 'changed', '2026-02-09', 'Grace Hopper'],
        ['ADR-00002', 'proposed', 'accepted', 'changed', '2026-02-09', 'Grace Hopper'],
      ])
      expect(log[1]?.hash).toBe(repo.git('log', '--format=%H', '--grep=^accept$'))
      expect(log.every((t) => t.type === 'adr' && t.field === 'status')).toBe(true)
    })
  })

  test('a change to the body only is not a transition', async () => {
    await withHistory(lifecycle, async (history) => {
      expect(decisionLog(history).filter((t) => t.date.startsWith('2026-01-14'))).toEqual([])
    })
  })

  test('the item shows when it was created and by whom', async () => {
    await withHistory(lifecycle, async (history) => {
      const item = history.items.get('ADR-00001')
      expect(item?.created).toMatchObject({ date: '2026-01-05T10:00:00Z', author: ada })
      expect(item?.commits).toBe(4)
      expect(item?.paths).toEqual([adrFile(1)])
      expect(item?.deletedAt).toBeUndefined()
    })
  })

  test('only ADRs are in the decision log', async () => {
    await withHistory(
      [...lifecycle, at('2026-02-10', 'a task', { [taskFile(1)]: task('TASK-00001', 'backlog') })],
      async (history) => {
        expect(new Set(decisionLog(history).map((t) => t.id))).toEqual(
          new Set(['ADR-00001', 'ADR-00002']),
        )
      },
    )
  })

  test('a file renamed or renumbered keeps one history', async () => {
    await withHistory(
      [
        at('2026-01-05', 'propose', { [adrFile(1, 'old-name')]: adr('ADR-00001', 'proposed') }),
        at(
          '2026-01-06',
          'rename',
          { [adrFile(1, 'new-name')]: adr('ADR-00001', 'proposed') },
          ada,
          [adrFile(1, 'old-name')],
        ),
        at('2026-01-07', 'accept', { [adrFile(1, 'new-name')]: adr('ADR-00001', 'accepted') }),
      ],
      async (history) => {
        const item = history.items.get('ADR-00001')
        expect(item?.paths).toEqual([adrFile(1, 'old-name'), adrFile(1, 'new-name')])
        expect(item?.transitions.map((t) => [t.from, t.to])).toEqual([
          [undefined, 'proposed'],
          ['proposed', 'accepted'],
        ])
      },
    )
  })

  test('a deleted item is marked, and an item brought back is not', async () => {
    await withHistory(
      [
        at('2026-01-05', 'add', {
          [adrFile(1)]: adr('ADR-00001', 'proposed'),
          [adrFile(2)]: adr('ADR-00002', 'proposed'),
        }),
        at('2026-01-06', 'remove both', {}, ada, [adrFile(1), adrFile(2)]),
        at('2026-01-07', 'restore one', { [adrFile(2)]: adr('ADR-00002', 'proposed') }),
      ],
      async (history) => {
        expect(history.items.get('ADR-00001')?.deletedAt).toBe('2026-01-06T10:00:00Z')
        expect(history.items.get('ADR-00002')?.deletedAt).toBeUndefined()
      },
    )
  })

  test('a commit with broken YAML is skipped and the value carries over', async () => {
    await withHistory(
      [
        at('2026-01-05', 'add', { [adrFile(1)]: adr('ADR-00001', 'proposed') }),
        at('2026-01-06', 'oops', { [adrFile(1)]: '---\nid: ADR-00001\nstatus: [accepted\n---\n' }),
        at('2026-01-07', 'fix', { [adrFile(1)]: adr('ADR-00001', 'accepted') }),
      ],
      async (history) => {
        expect(history.items.get('ADR-00001')?.transitions.map((t) => [t.from, t.to])).toEqual([
          [undefined, 'proposed'],
          ['proposed', 'accepted'],
        ])
      },
    )
  })

  test('files without an id, folders that are not items and non-Markdown files are ignored', async () => {
    await withHistory(
      [
        at('2026-01-05', 'junk', {
          'netherite/adr/notes.md': '---\ntitle: no id\nstatus: accepted\n---\n',
          'netherite/assets/readme.md': adr('ADR-00009', 'accepted'),
          'netherite/.obsidian/x.md': adr('ADR-00008', 'accepted'),
          'netherite/adr/data.json': '{}',
          'elsewhere/ADR.md': adr('ADR-00007', 'accepted'),
        }),
      ],
      async (history) => {
        expect([...history.items.keys()]).toEqual([])
      },
    )
  })
})

describe('tasks and weeks', () => {
  const states: Commit[] = [
    at('2026-01-05', 'tasks', {
      [taskFile(1)]: task('TASK-00001', 'backlog'),
      [taskFile(2)]: task('TASK-00002', 'backlog'),
      [taskFile(3)]: task('TASK-00003', 'done'),
    }),
    at('2026-01-07', 'start', { [taskFile(1)]: task('TASK-00001', 'doing') }, grace),
    at('2026-01-09', 'finish 1', { [taskFile(1)]: task('TASK-00001', 'done') }, grace),
    at('2026-01-11', 'sunday', { [taskFile(2)]: task('TASK-00002', 'done') }),
    at('2026-01-12', 'reopen', { [taskFile(2)]: task('TASK-00002', 'doing') }),
    at('2026-01-27', 'finish 2 again', { [taskFile(2)]: task('TASK-00002', 'done') }, ada),
  ]
  const done = new Set(['done'])

  test('lists task state transitions oldest first', async () => {
    await withHistory(states, async (history) => {
      expect(
        taskTransitions(history).map((t) => [t.id, t.from, t.to, t.date.slice(5, 10)]),
      ).toEqual([
        ['TASK-00001', undefined, 'backlog', '01-05'],
        ['TASK-00002', undefined, 'backlog', '01-05'],
        ['TASK-00003', undefined, 'done', '01-05'],
        ['TASK-00001', 'backlog', 'doing', '01-07'],
        ['TASK-00001', 'doing', 'done', '01-09'],
        ['TASK-00002', 'backlog', 'done', '01-11'],
        ['TASK-00002', 'done', 'doing', '01-12'],
        ['TASK-00002', 'doing', 'done', '01-27'],
      ])
    })
  })

  test('counts completions per week, with empty weeks', async () => {
    await withHistory(states, async (history) => {
      expect(completionsByWeek(history, done)).toEqual([
        { week: '2026-01-05', count: 3 },
        { week: '2026-01-12', count: 0 },
        { week: '2026-01-19', count: 0 },
        { week: '2026-01-26', count: 1 },
      ])
    })
  })

  test('a range limits and extends the weeks', async () => {
    await withHistory(states, async (history) => {
      expect(completionsByWeek(history, done, { from: '2026-01-19' })).toEqual([
        { week: '2026-01-19', count: 0 },
        { week: '2026-01-26', count: 1 },
      ])
      const wide = completionsByWeek(history, done, { from: '2025-12-29', to: '2026-02-08' })
      expect(wide.map((w) => w.week)).toEqual([
        '2025-12-29',
        '2026-01-05',
        '2026-01-12',
        '2026-01-19',
        '2026-01-26',
        '2026-02-02',
      ])
      expect(wide.reduce((n, w) => n + w.count, 0)).toBe(4)
    })
  })

  test('moving between two done states is not a new completion', async () => {
    await withHistory(
      [
        at('2026-01-05', 'a', { [taskFile(1)]: task('TASK-00001', 'doing') }),
        at('2026-01-06', 'b', { [taskFile(1)]: task('TASK-00001', 'done') }),
        at('2026-01-07', 'c', { [taskFile(1)]: task('TASK-00001', 'shipped') }),
      ],
      async (history) => {
        expect(
          completionsByWeek(history, new Set(['done', 'shipped'])).reduce((n, w) => n + w.count, 0),
        ).toBe(1)
      },
    )
  })

  test('no tasks, no weeks', async () => {
    await withHistory(
      [at('2026-01-05', 'adr', { [adrFile(1)]: adr('ADR-00001', 'proposed') })],
      async (history) => {
        expect(completionsByWeek(history, done)).toEqual([])
      },
    )
  })

  test('weekStart is the Monday', () => {
    expect(
      ['2026-01-05', '2026-01-06', '2026-01-11', '2026-01-12', '2026-03-01'].map(weekStart),
    ).toEqual(['2026-01-05', '2026-01-05', '2026-01-05', '2026-01-12', '2026-02-23'])
  })
})

describe('ADR activity per week', () => {
  test('counts status changes by the status they moved to', async () => {
    await withHistory(
      [
        at('2026-01-05', 'p1', {
          [adrFile(1)]: adr('ADR-00001', 'proposed'),
          [adrFile(2)]: adr('ADR-00002', 'proposed'),
        }),
        at('2026-01-06', 'a1', { [adrFile(1)]: adr('ADR-00001', 'accepted') }),
        at('2026-01-20', 'sup', {
          [adrFile(2)]: adr('ADR-00002', 'superseded', 'superseded_by: ADR-00001\n'),
        }),
        at('2026-01-21', 'dep', { [adrFile(1)]: adr('ADR-00001', 'deprecated') }),
      ],
      async (history) => {
        expect(adrActivityByWeek(history)).toEqual([
          { week: '2026-01-05', proposed: 2, accepted: 1, deprecated: 0, superseded: 0 },
          { week: '2026-01-12', proposed: 0, accepted: 0, deprecated: 0, superseded: 0 },
          { week: '2026-01-19', proposed: 0, accepted: 0, deprecated: 1, superseded: 1 },
        ])
      },
    )
  })
})

describe('progress over time', () => {
  test('replays tasks per project and goal at the end of each week', async () => {
    await withHistory(
      [
        at('2026-01-05', 'setup', {
          'netherite/projects/PRJ-00001-a.md': project('PRJ-00001', ['GOAL-00001']),
          'netherite/projects/PRJ-00002-b.md': project('PRJ-00002', ['GOAL-00001']),
          [taskFile(1)]: task('TASK-00001', 'backlog', 'PRJ-00001'),
          [taskFile(2)]: task('TASK-00002', 'backlog', 'PRJ-00001'),
        }),
        at('2026-01-13', 'done and a new task', {
          [taskFile(1)]: task('TASK-00001', 'done', 'PRJ-00001'),
          [taskFile(3)]: task('TASK-00003', 'backlog', 'PRJ-00002'),
        }),
        at('2026-01-20', 'move a task and finish it', {
          [taskFile(2)]: task('TASK-00002', 'done', 'PRJ-00002'),
        }),
        at('2026-01-27', 'delete a task', {}, ada, [taskFile(3)]),
      ],
      async (history) => {
        const series = progressSeries(history, new Set(['done']))
        expect(series.projects.get('PRJ-00001')).toEqual([
          { week: '2026-01-05', done: 0, total: 2 },
          { week: '2026-01-12', done: 1, total: 2 },
          { week: '2026-01-19', done: 1, total: 1 },
          { week: '2026-01-26', done: 1, total: 1 },
        ])
        expect(series.projects.get('PRJ-00002')).toEqual([
          { week: '2026-01-12', done: 0, total: 1 },
          { week: '2026-01-19', done: 1, total: 2 },
          { week: '2026-01-26', done: 1, total: 1 },
        ])
        expect(series.goals.get('GOAL-00001')).toEqual([
          { week: '2026-01-05', done: 0, total: 2 },
          { week: '2026-01-12', done: 1, total: 3 },
          { week: '2026-01-19', done: 2, total: 3 },
          { week: '2026-01-26', done: 2, total: 2 },
        ])
      },
    )
  })

  test('a project that changes goal moves its tasks with it', async () => {
    await withHistory(
      [
        at('2026-01-05', 'setup', {
          'netherite/projects/PRJ-00001-a.md': project('PRJ-00001', ['GOAL-00001']),
          [taskFile(1)]: task('TASK-00001', 'done', 'PRJ-00001'),
        }),
        at('2026-01-13', 'new goal', {
          'netherite/projects/PRJ-00001-a.md': project('PRJ-00001', ['GOAL-00002']),
        }),
      ],
      async (history) => {
        const { goals } = progressSeries(history, new Set(['done']))
        expect(goals.get('GOAL-00001')).toEqual([{ week: '2026-01-05', done: 1, total: 1 }])
        expect(goals.get('GOAL-00002')).toEqual([{ week: '2026-01-12', done: 1, total: 1 }])
      },
    )
  })

  test('no history gives empty series', async () => {
    await withHistory([], async (history) => {
      const { projects, goals } = progressSeries(history, new Set(['done']))
      expect([projects.size, goals.size]).toEqual([0, 0])
    })
  })
})

describe('authors per item', () => {
  test('counts every commit that touched the item, body-only edits included', async () => {
    await withHistory(
      [
        at('2026-01-05', 'add', { [taskFile(1)]: task('TASK-00001', 'backlog') }, ada),
        at(
          '2026-01-06',
          'edit body',
          { [taskFile(1)]: task('TASK-00001', 'backlog', 'PRJ-00001', '# Task\n\nmore\n') },
          grace,
        ),
        at(
          '2026-01-09',
          'edit body again',
          {
            [taskFile(1)]: task(
              'TASK-00001',
              'backlog',
              'PRJ-00001',
              '# Task\n\nmore\n\neven more\n',
            ),
          },
          grace,
        ),
        at(
          '2026-01-12',
          'state',
          {
            [taskFile(1)]: task(
              'TASK-00001',
              'doing',
              'PRJ-00001',
              '# Task\n\nmore\n\neven more\n',
            ),
          },
          ada,
        ),
        at('2026-01-13', 'something else', { 'src/a.ts': 'x' }, grace),
      ],
      async (history) => {
        expect(authorsOf(history, 'TASK-00001')).toEqual([
          { ...ada, commits: 2, first: '2026-01-05', last: '2026-01-12' },
          { ...grace, commits: 2, first: '2026-01-06', last: '2026-01-09' },
        ])
        expect(history.items.get('TASK-00001')?.commits).toBe(4)
      },
    )
  })

  test('the same person under different name spellings is one author', async () => {
    await withHistory(
      [
        at(
          '2026-01-05',
          'a',
          { [taskFile(1)]: task('TASK-00001', 'backlog') },
          { name: 'Ada', email: 'ADA@example.com' },
        ),
        at(
          '2026-01-06',
          'b',
          { [taskFile(1)]: task('TASK-00001', 'doing') },
          { name: 'Ada L.', email: 'ada@example.com' },
        ),
      ],
      async (history) => {
        expect(authorsOf(history, 'TASK-00001')).toHaveLength(1)
        expect(authorsOf(history, 'TASK-00001')[0]?.commits).toBe(2)
      },
    )
  })

  test('commits after a rename still count for the same item', async () => {
    await withHistory(
      [
        at('2026-01-05', 'add', { [taskFile(1, 'old')]: task('TASK-00001', 'backlog') }, ada),
        at('2026-01-06', 'rename', { [taskFile(1, 'new')]: task('TASK-00001', 'backlog') }, grace, [
          taskFile(1, 'old'),
        ]),
        at(
          '2026-01-07',
          'body only',
          { [taskFile(1, 'new')]: task('TASK-00001', 'backlog', 'PRJ-00001', '# T\n\nx\n') },
          grace,
        ),
      ],
      async (history) => {
        expect(authorsOf(history, 'TASK-00001').map((a) => [a.name, a.commits])).toEqual([
          ['Grace Hopper', 2],
          ['Ada Lovelace', 1],
        ])
      },
    )
  })

  test('an unknown item has no authors', async () => {
    await withHistory([], async (history) => {
      expect(authorsOf(history, 'TASK-09999')).toEqual([])
    })
  })
})

describe('windows and partial history', () => {
  const many: Commit[] = [
    at('2026-01-05', 'add', { [adrFile(1)]: adr('ADR-00001', 'proposed') }),
    at('2026-01-12', 'accept', { [adrFile(1)]: adr('ADR-00001', 'accepted') }),
    at('2026-01-19', 'deprecate', { [adrFile(1)]: adr('ADR-00001', 'deprecated') }),
  ]

  test('a full history is not partial', async () => {
    await withHistory(many, async (history) => {
      expect(history.partial).toBe(false)
      expect(history.commits).toBe(3)
    })
  })

  test('a window is partial, and the first value seen is marked as seen, not created', async () => {
    await withHistory(
      many,
      async (history) => {
        expect(history.partial).toBe(true)
        expect(history.commits).toBe(1)
        expect(history.items.get('ADR-00001')?.transitions).toMatchObject([
          { from: undefined, to: 'deprecated', kind: 'seen' },
        ])
      },
      { limit: 1 },
    )
  })

  test('`after` also gives a window', async () => {
    await withHistory(
      many,
      async (history) => {
        expect(history.items.get('ADR-00001')?.transitions.map((t) => [t.to, t.kind])).toEqual([
          ['accepted', 'seen'],
          ['deprecated', 'changed'],
        ])
      },
      { after: '2026-01-10' },
    )
  })

  test('a shallow clone is partial', async () => {
    const repo = await createGitRepo({ history: many })
    const target = mkdtempSync(join(tmpdir(), 'netherite-shallow-'))
    try {
      execFileSync('git', ['clone', '-q', '--depth', '2', `file://${repo.root}`, 'clone'], {
        cwd: target,
      })
      const clone = join(target, 'clone')
      const git = await run(openGit(clone))
      const history = await run(readHistory(git, clone, { contentRoot: 'netherite' }))
      expect(history.partial).toBe(true)
      expect(history.commits).toBe(2)
    } finally {
      await repo.cleanup()
      rmSync(target, { recursive: true, force: true })
    }
  })
})

describe('a workspace inside a larger repository', () => {
  test('only the workspace content is read', async () => {
    await withHistory(
      [
        at('2026-01-05', 'both', {
          'site/netherite/adr/ADR-00001-x.md': adr('ADR-00001', 'proposed'),
          'other/netherite/adr/ADR-00002-x.md': adr('ADR-00002', 'proposed'),
        }),
        at('2026-01-06', 'accept', {
          'site/netherite/adr/ADR-00001-x.md': adr('ADR-00001', 'accepted'),
        }),
      ],
      async (_history, repo, git) => {
        const history = await run(
          readHistory(git, join(repo.root, 'site'), { contentRoot: 'netherite' }),
        )
        expect([...history.items.keys()]).toEqual(['ADR-00001'])
        expect(decisionLog(history).map((t) => t.to)).toEqual(['proposed', 'accepted'])
      },
    )
  })
})

describe('fixtures/basic', () => {
  test('every item is created in the first commit by Ada', async () => {
    const repo = await createGitRepo({ fixture: 'basic', history: basicHistory })
    try {
      const git = await run(openGit(repo.root))
      const history = await run(readHistory(git, repo.root, { contentRoot: 'netherite' }))
      expect(history.items.size).toBe(16)
      expect(history.items.get('ADR-00002')?.created?.author.name).toBe('Ada Lovelace')
      expect(
        decisionLog(history)
          .map((t) => [t.id, t.to])
          .sort(),
      ).toEqual([
        ['ADR-00001', 'superseded'],
        ['ADR-00002', 'accepted'],
        ['ADR-00003', 'proposed'],
      ])
      expect(authorsOf(history, 'ADR-00002')).toMatchObject([{ name: 'Ada Lovelace', commits: 1 }])
    } finally {
      await repo.cleanup()
    }
  })
})

describe('commit dates with a time zone offset', () => {
  const lateSunday = (message: string, write: Record<string, string>): Commit => ({
    message,
    date: '2026-01-11T21:30:00-03:00',
    author: ada,
    write,
  })

  test('weeks, completions and progress are counted in UTC, whatever the commit offset', async () => {
    await withHistory(
      [
        {
          message: 'plan',
          date: '2026-01-05T10:00:00Z',
          author: ada,
          write: {
            'netherite/projects/PRJ-00001-x.md': project('PRJ-00001', ['GOAL-00001']),
            [taskFile(1)]: task('TASK-00001', 'backlog'),
          },
        },
        lateSunday('finish', { [taskFile(1)]: task('TASK-00001', 'done') }),
      ],
      async (history) => {
        const done = new Set(['done'])
        expect(completionsByWeek(history, done)).toEqual([{ week: '2026-01-12', count: 1 }])
        expect(progressSeries(history, done).projects.get('PRJ-00001')).toEqual([
          { week: '2026-01-05', done: 0, total: 1 },
          { week: '2026-01-12', done: 1, total: 1 },
        ])
        expect(weekStart('2026-01-11T21:30:00-03:00')).toBe('2026-01-12')
      },
    )
  })
})
