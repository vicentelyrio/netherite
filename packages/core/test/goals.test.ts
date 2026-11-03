import { describe, expect, test } from 'vitest'
import { boardOf, goalDetail, goalRows, graphOf, knowledgeRows, summaryOf } from '../src/index'
import { cleanFiles, world } from './ops-helpers'

const goal = (n: number, extra: string[] = [], title = `Goal ${n}`) => ({
  [`/repo/netherite/goals/GOAL-0000${n}-g.md`]: `---\nid: GOAL-0000${n}\naliases: [GOAL-0000${n}]\ntype: goal\ntitle: ${title}\nstatus: active\n${extra.join('\n')}${extra.length ? '\n' : ''}---\n\n# ${title}\n`,
})
const project = (n: number, goals: string[], extra: string[] = []) => ({
  [`/repo/netherite/projects/PRJ-0000${n}-p.md`]: `---\nid: PRJ-0000${n}\naliases: [PRJ-0000${n}]\ntype: project\ntitle: Project ${n}\ngoals: [${goals.join(', ')}]\nstatus: active\n${extra.join('\n')}${extra.length ? '\n' : ''}---\n\n# P\n`,
})
const task = (n: number, projectId: string, state: string) => ({
  [`/repo/netherite/tasks/TASK-0001${n}-t.md`]: `---\nid: TASK-0001${n}\naliases: [TASK-0001${n}]\ntype: task\ntitle: T${n}\nproject: ${projectId}\nstate: ${state}\n---\n\n# T\n`,
})

describe('goals for the overview', () => {
  test('are grouped by area, areas in name order, goals with no area last, each in ID order', async () => {
    const w = await world({
      ...cleanFiles(),
      ...goal(2, ['area: Life']),
      ...goal(3, ['area: Health']),
      ...goal(4),
      ...goal(5, ['area: Health']),
    })
    expect(goalRows(w.repo).map((g) => [g.id, g.area])).toEqual([
      ['GOAL-00003', 'Health'],
      ['GOAL-00005', 'Health'],
      ['GOAL-00002', 'Life'],
      ['GOAL-00001', undefined],
      ['GOAL-00004', undefined],
    ])
  })

  test('carry status, due date, tags, and the count of their projects', async () => {
    const w = await world({
      ...cleanFiles(),
      ...goal(2, ['area: Life', 'due: 2027-05-01', 'tags: [family, travel]']),
      ...project(7, ['GOAL-00002']),
      ...project(8, ['GOAL-00002', 'GOAL-00001']),
    })
    const row = goalRows(w.repo).find((g) => g.id === 'GOAL-00002')
    expect(row).toMatchObject({
      status: 'active',
      due: '2027-05-01',
      tags: ['family', 'travel'],
      projects: 2,
    })
    expect(goalRows(w.repo).find((g) => g.id === 'GOAL-00001')?.projects).toBe(2)
  })

  test('carry the horizon as written, and in days unless it is forever or not a horizon', async () => {
    const w = await world({
      ...cleanFiles(),
      ...goal(2, ['horizon: 5 years']),
      ...goal(3, ['horizon: forever']),
      ...goal(4, ['horizon: someday']),
    })
    const row = (id: string) => goalRows(w.repo).find((g) => g.id === id)
    expect(row('GOAL-00002')).toMatchObject({ horizon: '5 years', horizonDays: 1825 })
    expect(row('GOAL-00003')).toMatchObject({ horizon: 'forever', horizonDays: undefined })
    expect(row('GOAL-00004')).toMatchObject({ horizon: 'someday', horizonDays: undefined })
    expect(row('GOAL-00001')?.horizon).toBeUndefined()
  })

  test('progress is the done tasks over all tasks of all its projects, once each', async () => {
    const w = await world({
      ...cleanFiles(),
      ...goal(2),
      ...project(7, ['GOAL-00002']),
      ...project(8, ['GOAL-00002']),
      ...task(1, 'PRJ-00007', 'done'),
      ...task(2, 'PRJ-00007', 'backlog'),
      ...task(3, 'PRJ-00008', 'done'),
    })
    expect(goalRows(w.repo).find((g) => g.id === 'GOAL-00002')?.progress).toEqual({
      done: 2,
      total: 3,
    })
  })

  test('a goal with no tasks has no progress, not 0 of 0', async () => {
    const w = await world({ ...cleanFiles(), ...goal(2) })
    expect(goalRows(w.repo).find((g) => g.id === 'GOAL-00002')?.progress).toBeNull()
  })
})

describe('a goal in detail', () => {
  test('lists its projects with their progress, tags and the other goals each belongs to', async () => {
    const w = await world({
      ...cleanFiles(),
      ...goal(2, ['area: Knowledge'], 'Development'),
      ...goal(3, [], 'Design'),
      ...project(7, ['GOAL-00002', 'GOAL-00003'], ['tags: [web, writing]']),
      ...project(8, ['GOAL-00002']),
      ...task(1, 'PRJ-00007', 'done'),
      ...task(2, 'PRJ-00007', 'backlog'),
    })
    const item = w.repo.index.findById('GOAL-00002')[0]
    const detail = goalDetail(w.repo, item as never)
    expect(detail.id).toBe('GOAL-00002')
    expect(detail.projectRows.map((p) => p.id)).toEqual(['PRJ-00007', 'PRJ-00008'])
    expect(detail.projectRows[0]).toMatchObject({
      tags: ['web', 'writing'],
      progress: { done: 1, total: 2 },
      goals: [
        { id: 'GOAL-00002', title: 'Development' },
        { id: 'GOAL-00003', title: 'Design' },
      ],
    })
    expect(detail.projectRows[1]?.progress).toBeNull()
  })

  test('has no projects when none belong to it', async () => {
    const w = await world({ ...cleanFiles(), ...goal(2) })
    const detail = goalDetail(w.repo, w.repo.index.findById('GOAL-00002')[0] as never)
    expect(detail.projectRows).toEqual([])
    expect(detail.projects).toBe(0)
  })
})

describe('a project board', () => {
  test('puts tasks in columns by configured state, with checklist progress and what each waits on', async () => {
    const w = await world({
      ...cleanFiles(),
      ...goal(2),
      ...project(7, ['GOAL-00002']),
      ...task(1, 'PRJ-00007', 'done'),
      ...task(2, 'PRJ-00007', 'backlog'),
      '/repo/netherite/tasks/TASK-00013-w.md':
        '---\nid: TASK-00013\naliases: [TASK-00013]\ntype: task\ntitle: W\nproject: PRJ-00007\nstate: backlog\ndepends_on: [TASK-00011, TASK-00012]\nlabels: [a]\nassignees: ["@ada"]\n---\n\n# W\n\n- [x] one\n- [ ] two\n',
    })
    const board = boardOf(w.repo, w.repo.index.findById('PRJ-00007')[0] as never)
    expect(board.columns.map((c) => c.name)).toEqual(['backlog', 'doing', 'blocked', 'done'])
    expect(board.tasks.map((t) => [t.id, t.state])).toEqual([
      ['TASK-00011', 'done'],
      ['TASK-00012', 'backlog'],
      ['TASK-00013', 'backlog'],
    ])
    const waiting = board.tasks[2]
    expect(waiting?.waitingOn.map((d) => d.id)).toEqual(['TASK-00012'])
    expect(waiting).toMatchObject({
      labels: ['a'],
      assignees: ['@ada'],
      checklist: { done: 1, total: 2 },
    })
    expect(board.tasks[0]?.checklist).toBeNull()
  })
})

describe('the knowledge index', () => {
  test('lists ADRs, docs, context and runbooks with their projects, tags and orphan flag', async () => {
    const w = await world({
      ...cleanFiles(),
      '/repo/netherite/docs/DOC-00002-tagged.md':
        '---\nid: DOC-00002\naliases: [DOC-00002]\ntype: doc\ntitle: Tagged\ntags: [ops]\nreviewed_at: 2026-02-03\n---\n\n# Tagged\n\nNobody links here.\n',
    })
    const rows = knowledgeRows(w.repo, undefined)
    expect(rows.map((r) => r.type)).not.toContain('task')
    expect(rows.map((r) => r.id)).toEqual(
      expect.arrayContaining(['ADR-00001', 'ADR-00002', 'ADR-00003', 'DOC-00001', 'DOC-00002']),
    )
    const tagged = rows.find((r) => r.id === 'DOC-00002')
    expect(tagged).toMatchObject({
      tags: ['ops'],
      date: '2026-02-03',
      orphan: true,
      freshness: null,
    })
    expect(rows.find((r) => r.id === 'DOC-00001')?.projects).toEqual(['PRJ-00001'])
    expect(rows.find((r) => r.id === 'ADR-00002')).toMatchObject({
      status: 'accepted',
      projects: ['PRJ-00001'],
    })
  })
})

describe('a summary', () => {
  test('is the first plain paragraph, without headings, lists or link marks', () => {
    expect(
      summaryOf('# Title\n\n- a list\n\nUse **promises** and [[ADR-00001|callbacks]].\n\nSecond.'),
    ).toBe('Use promises and callbacks.')
    expect(summaryOf('# Only a heading')).toBe('')
  })
})

describe('knowledge rows and supersession', () => {
  test('say which ADRs each one replaces and is replaced by', async () => {
    const w = await world({
      ...cleanFiles(),
      '/repo/netherite/adr/ADR-00004-newer.md':
        '---\nid: ADR-00004\naliases: [ADR-00004]\ntype: adr\ntitle: Newer\nstatus: accepted\ndate: 2026-02-01\nsupersedes: [ADR-00001]\n---\n\n# Newer\n\nText.\n',
    })
    const rows = knowledgeRows(w.repo, undefined)
    expect(rows.find((r) => r.id === 'ADR-00004')?.supersedes).toEqual(['ADR-00001'])
    expect(rows.find((r) => r.id === 'ADR-00001')?.supersededBy).toEqual(['ADR-00004'])
    expect(rows.find((r) => r.id === 'ADR-00002')?.supersedes).toEqual([])
  })
})

describe('search snippets', () => {
  test('are the text around the first match, with ellipses where it was cut', async () => {
    const { snippetOf } = await import('../src/index')
    expect(snippetOf('The quick brown fox jumps over the lazy dog', 'fox')).toBe(
      'The quick brown fox jumps over the lazy dog',
    )
    const long = `${'a '.repeat(60)}needle${' b'.repeat(60)}`
    const snippet = snippetOf(long, 'needle') as string
    expect(snippet.startsWith('…')).toBe(true)
    expect(snippet.endsWith('…')).toBe(true)
    expect(snippet).toContain('needle')
    expect(snippetOf('nothing here', 'zzz')).toBeUndefined()
    expect(snippetOf('anything', '  ')).toBeUndefined()
  })
})

describe('graph nodes carry status', () => {
  const states = (w: Awaited<ReturnType<typeof world>>) =>
    Object.fromEntries(
      graphOf(w.repo)
        .nodes.filter((n) => n.status !== undefined)
        .map((n) => [n.id, [n.status, n.progress]]),
    )

  test('a task takes its status from the category of its state, a project and a goal from their tasks', async () => {
    const w = await world({
      ...cleanFiles(),
      ...goal(2),
      ...project(7, ['GOAL-00002']),
      ...project(8, ['GOAL-00002']),
      ...task(1, 'PRJ-00007', 'done'),
      ...task(2, 'PRJ-00007', 'backlog'),
      ...task(3, 'PRJ-00008', 'done'),
    })
    const found = states(w)
    expect(found['TASK-00011']).toEqual(['done', 1])
    expect(found['TASK-00012']).toEqual(['backlog', 0])
    expect(found['PRJ-00007']).toEqual(['progress', 0.5])
    expect(found['PRJ-00008']).toEqual(['done', 1])
    expect(found['GOAL-00002']).toEqual(['progress', 2 / 3])
  })

  test('a paused project is on hold, an achieved goal is done, and a node names its parent', async () => {
    const w = await world({
      ...cleanFiles(),
      ...task(1, 'PRJ-00007', 'backlog'),
      '/repo/netherite/goals/GOAL-00002-g.md': `---\nid: GOAL-00002\naliases: [GOAL-00002]\ntype: goal\ntitle: G\nstatus: achieved\n---\n\n# G\n`,
      '/repo/netherite/projects/PRJ-00007-p.md': `---\nid: PRJ-00007\naliases: [PRJ-00007]\ntype: project\ntitle: Project 7\ngoals: [GOAL-00002]\nstatus: paused\n---\n\n# P\n`,
    })
    const nodes = graphOf(w.repo).nodes
    expect(states(w)['PRJ-00007']?.[0]).toBe('hold')
    expect(nodes.find((n) => n.id === 'TASK-00011')?.parent).toBe('PRJ-00007')
    expect(nodes.find((n) => n.id === 'PRJ-00007')?.parent).toBe('GOAL-00002')
  })

  test('docs and the rest have no status', async () => {
    const w = await world({ ...cleanFiles(), ...goal(2) })
    const others = graphOf(w.repo).nodes.filter(
      (n) => !['goal', 'project', 'task'].includes(n.type),
    )
    expect(others.length).toBeGreaterThan(0)
    expect(others.filter((n) => n.status !== undefined || n.progress !== undefined)).toEqual([])
  })
})
