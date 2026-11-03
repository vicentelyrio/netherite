import { devNull } from 'node:os'
import { NodeServices } from '@effect/platform-node'
import { openGit } from '@netherite/git'
import { defaultConfig } from '@netherite/schema'
import { type Commit, createGitRepo } from '@netherite/testing'
import { Effect } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import { lifecycles, readHistory } from '../src/index'

beforeAll(() => {
  process.env.GIT_CONFIG_GLOBAL = devNull
  process.env.GIT_CONFIG_SYSTEM = devNull
})

const run = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) =>
  Effect.runPromise(effect.pipe(Effect.provide(NodeServices.layer)))

const ada = { name: 'Ada Lovelace', email: 'ada@example.com' }
const at = (date: string, write: Record<string, string>): Commit => ({
  message: `on ${date}`,
  date: `${date}T10:00:00Z`,
  author: ada,
  write,
  remove: [],
})

const task = (state: string, due = '') =>
  `---\nid: TASK-00001\naliases: [TASK-00001]\ntype: task\ntitle: T\nproject: PRJ-00001\nstate: ${state}\n${due}---\n\n# T\n`
const adr = (status: string) =>
  `---\nid: ADR-00001\naliases: [ADR-00001]\ntype: adr\ntitle: A\nstatus: ${status}\ndate: 2026-01-01\n---\n\n# A\n`
const project = (status: string) =>
  `---\nid: PRJ-00001\naliases: [PRJ-00001]\ntype: project\ntitle: P\ngoals: [GOAL-00001]\nstatus: ${status}\n---\n`
const goal = `---\nid: GOAL-00001\naliases: [GOAL-00001]\ntype: goal\ntitle: G\nstatus: active\n---\n`

const taskFile = 'netherite/tasks/TASK-00001-t.md'
const adrFile = 'netherite/adr/ADR-00001-a.md'
const projectFile = 'netherite/projects/PRJ-00001-p.md'
const goalFile = 'netherite/goals/GOAL-00001-g.md'

const read = async (commits: Commit[], options: { limit?: number } = {}) => {
  const repo = await createGitRepo({ history: commits })
  try {
    const git = await run(openGit(repo.root))
    const history = await run(readHistory(git, repo.root, { contentRoot: 'netherite', ...options }))
    return lifecycles(history, { states: defaultConfig.states, now: '2026-02-01T00:00:00Z' })
  } finally {
    await repo.cleanup()
  }
}

describe('lifecycle of a task', () => {
  const commits = [
    at('2026-01-01', { [goalFile]: goal, [projectFile]: project('active') }),
    at('2026-01-02', { [taskFile]: task('backlog', 'due: 2026-01-20\n') }),
    at('2026-01-05', { [taskFile]: task('doing', 'due: 2026-01-20\n') }),
    at('2026-01-10', { [taskFile]: task('blocked', 'due: 2026-01-20\n') }),
    at('2026-01-14', { [taskFile]: task('doing', 'due: 2026-01-25\n') }),
    at('2026-01-18', { [taskFile]: task('done', 'due: 2026-01-25\n') }),
    at('2026-01-22', { [taskFile]: task('doing', 'due: 2026-01-25\n') }),
    at('2026-01-24', { [taskFile]: task('done', 'due: 2026-01-25\n') }),
  ]

  test('is told as created, started, held, resumed, finished, reopened and finished again', async () => {
    const life = (await read(commits)).get('TASK-00001')
    expect(life?.events.map((e) => [e.kind, e.date.slice(0, 10)])).toEqual([
      ['created', '2026-01-02'],
      ['started', '2026-01-05'],
      ['held', '2026-01-10'],
      ['resumed', '2026-01-14'],
      ['rescheduled', '2026-01-14'],
      ['finished', '2026-01-18'],
      ['reopened', '2026-01-22'],
      ['finished', '2026-01-24'],
    ])
    expect(life?.created?.slice(0, 10)).toBe('2026-01-02')
    expect(life?.started?.slice(0, 10)).toBe('2026-01-05')
    expect(life?.finished?.slice(0, 10)).toBe('2026-01-24')
    expect(life?.approximate).toBe(false)
  })

  test('counts the days it waited and how often its due date moved', async () => {
    const life = (await read(commits)).get('TASK-00001')
    expect(life?.waitingDays).toBe(4)
    expect(life?.rescheduled).toBe(1)
    expect(life?.due).toBe('2026-01-25')
    expect(life?.spans.map((s) => s.phase)).toEqual([
      'todo',
      'active',
      'blocked',
      'active',
      'done',
      'active',
      'done',
    ])
  })

  test('is open while the last state is not done', async () => {
    const life = (await read(commits.slice(0, 5))).get('TASK-00001')
    expect(life?.finished).toBeUndefined()
    const held = (await read(commits.slice(0, 4))).get('TASK-00001')
    expect(held?.waitingDays).toBe(21.6)
  })

  test('a project starts with its first task, a goal with its first project', async () => {
    const all = await read(commits)
    expect(all.get('PRJ-00001')?.started?.slice(0, 10)).toBe('2026-01-05')
    expect(all.get('GOAL-00001')?.started?.slice(0, 10)).toBe('2026-01-05')
  })

  test('is flagged as approximate when only a window of history is read', async () => {
    const life = (await read(commits, { limit: 3 })).get('TASK-00001')
    expect(life?.approximate).toBe(true)
  })
})

describe('lifecycle of an ADR', () => {
  test('is proposed, accepted, then superseded', async () => {
    const life = (
      await read([
        at('2026-01-03', { [adrFile]: adr('proposed') }),
        at('2026-01-09', { [adrFile]: adr('accepted') }),
        at('2026-01-20', { [adrFile]: adr('superseded') }),
      ])
    ).get('ADR-00001')
    expect(life?.events.map((e) => [e.kind, e.date.slice(0, 10)])).toEqual([
      ['proposed', '2026-01-03'],
      ['accepted', '2026-01-09'],
      ['superseded', '2026-01-20'],
    ])
    expect(life?.started?.slice(0, 10)).toBe('2026-01-03')
    expect(life?.finished?.slice(0, 10)).toBe('2026-01-09')
    expect(life?.ended?.slice(0, 10)).toBe('2026-01-20')
  })
})
