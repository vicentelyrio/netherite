import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { describe, expect, test } from 'vitest'
import {
  type ActivityEntry,
  activityFile,
  appendActivity,
  groupActivity,
  readActivity,
} from '../src/index'
import { world } from './ops-helpers'

const entry = (over: Partial<ActivityEntry> = {}) => ({
  tool: 'create',
  id: 'TASK-00001',
  path: 'netherite/tasks/TASK-00001-core.md',
  hash: 'a'.repeat(64),
  changed: ['netherite/tasks/TASK-00001-core.md'],
  ...over,
})

describe('appendActivity', () => {
  test('creates the log and its folder, one JSON line per entry, timed by the clock', async () => {
    const w = await world()
    await w.run(appendActivity(w.repo.workspace, entry()))
    await w.run(appendActivity(w.repo.workspace, entry({ tool: 'update', actor: 'mcp' })))
    const lines = (w.read(activityFile) ?? '').split('\n')
    expect(lines.at(-1)).toBe('')
    expect(lines).toHaveLength(3)
    expect(JSON.parse(lines[0] as string)).toEqual({ time: '2026-03-05T10:30:00.000Z', ...entry() })
    expect(JSON.parse(lines[1] as string)).toMatchObject({ tool: 'update', actor: 'mcp' })
  })

  test('returns the entry as written', async () => {
    const w = await world()
    expect(await w.run(appendActivity(w.repo.workspace, entry()))).toMatchObject({
      time: '2026-03-05T10:30:00.000Z',
      tool: 'create',
    })
  })

  test('a failure is an IoError', async () => {
    const w = await world(undefined, {
      failWhen: (method, path) =>
        method === 'writeFileString' && path.endsWith('activity.jsonl') ? 'disk full' : undefined,
    })
    expect(await w.fail(appendActivity(w.repo.workspace, entry()))).toMatchObject({
      _tag: 'IoError',
    })
  })

  test('many appends at once all land, whole', async () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'netherite-activity-')))
    try {
      const layer = Layer.merge(NodeFileSystem.layer, NodePath.layer)
      await Effect.runPromise(
        Effect.forEach(
          Array.from({ length: 60 }, (_, i) => i),
          (i) => appendActivity({ root: dir }, entry({ id: `TASK-${String(i).padStart(5, '0')}` })),
          { concurrency: 'unbounded' },
        ).pipe(Effect.provide(layer)),
      )
      const lines = readFileSync(join(dir, activityFile), 'utf8').trim().split('\n')
      expect(lines).toHaveLength(60)
      expect(new Set(lines.map((l) => JSON.parse(l).id)).size).toBe(60)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('readActivity', () => {
  const seed = async () => {
    const lines = [
      { time: '2026-03-01T09:00:00.000Z', ...entry({ tool: 'create', id: 'TASK-00001' }) },
      { time: '2026-03-02T09:00:00.000Z', ...entry({ tool: 'update', id: 'TASK-00001' }) },
      {
        time: '2026-03-03T09:00:00.000Z',
        ...entry({ tool: 'create', id: 'DOC-00001', path: 'netherite/docs/DOC-00001-x.md' }),
      },
      {
        time: '2026-03-04T09:00:00.000Z',
        ...entry({ tool: 'delete', id: 'TASK-00001', hash: null }),
      },
    ]
    return world({
      ...(await import('@netherite/testing')).cleanWorkspaceFiles('/repo'),
      [`/repo/${activityFile}`]: `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`,
    })
  }

  test('lists entries newest first', async () => {
    const w = await seed()
    const log = await w.run(readActivity(w.repo.workspace))
    expect(log.skipped).toBe(0)
    expect(log.entries.map((e) => [e.tool, e.id])).toEqual([
      ['delete', 'TASK-00001'],
      ['create', 'DOC-00001'],
      ['update', 'TASK-00001'],
      ['create', 'TASK-00001'],
    ])
  })

  test('filters by time, item, tool and count', async () => {
    const w = await seed()
    const read = (o = {}) =>
      w
        .run(readActivity(w.repo.workspace, o))
        .then((l) => l.entries.map((e) => `${e.tool}:${e.id}`))
    expect(await read({ since: '2026-03-02T09:00:00.000Z' })).toEqual([
      'delete:TASK-00001',
      'create:DOC-00001',
    ])
    expect(await read({ ids: ['DOC-00001'] })).toEqual(['create:DOC-00001'])
    expect(await read({ tools: ['create'] })).toEqual(['create:DOC-00001', 'create:TASK-00001'])
    expect(await read({ limit: 2 })).toEqual(['delete:TASK-00001', 'create:DOC-00001'])
    expect(await read({ limit: 0 })).toEqual([])
    expect(await read({ since: '2030-01-01T00:00:00Z' })).toEqual([])
  })

  test('a missing log is an empty one', async () => {
    const w = await world()
    expect(await w.run(readActivity(w.repo.workspace))).toEqual({ entries: [], skipped: 0 })
  })

  test('unreadable lines are skipped and counted, not fatal', async () => {
    const good = JSON.stringify({ time: '2026-03-01T09:00:00.000Z', ...entry() })
    const w = await world({
      ...(await import('@netherite/testing')).cleanWorkspaceFiles('/repo'),
      [`/repo/${activityFile}`]: `${good}\nnot json\n{"time":1}\n\n${good.slice(0, 20)}`,
    })
    const log = await w.run(readActivity(w.repo.workspace))
    expect(log.entries).toHaveLength(1)
    expect(log.skipped).toBe(3)
  })

  test('an entry is not lost to a line cut short before it', async () => {
    const w = await world()
    await w.run(appendActivity(w.repo.workspace, entry({ id: 'TASK-00001' })))
    await w.write(activityFile, `${w.read(activityFile)}{"time":"2026-03-05`)
    await w.run(appendActivity(w.repo.workspace, entry({ id: 'TASK-00002' })))
    const log = await w.run(readActivity(w.repo.workspace))
    expect(log.entries.map((e) => e.id)).toContain('TASK-00001')
    expect(log.skipped).toBeGreaterThanOrEqual(1)
  })
})

describe('groupActivity', () => {
  const at = (day: number, over: Partial<ActivityEntry>): ActivityEntry => ({
    time: `2026-03-0${day}T09:00:00.000Z`,
    ...entry(over),
  })

  test('sums up each item, most recently active first', () => {
    const groups = groupActivity([
      at(1, { id: 'TASK-00001', tool: 'create' }),
      at(2, { id: 'DOC-00001', tool: 'create', path: 'd.md' }),
      at(3, { id: 'TASK-00001', tool: 'update' }),
      at(3, { id: 'TASK-00001', tool: 'update' }),
    ])
    expect(groups).toEqual([
      {
        id: 'TASK-00001',
        path: 'netherite/tasks/TASK-00001-core.md',
        count: 3,
        tools: ['create', 'update'],
        first: '2026-03-01T09:00:00.000Z',
        last: '2026-03-03T09:00:00.000Z',
        deleted: false,
      },
      {
        id: 'DOC-00001',
        path: 'd.md',
        count: 1,
        tools: ['create'],
        first: '2026-03-02T09:00:00.000Z',
        last: '2026-03-02T09:00:00.000Z',
        deleted: false,
      },
    ])
  })

  test('works whatever order the entries come in, and notes deletions', () => {
    const groups = groupActivity([
      at(4, { id: 'TASK-00001', tool: 'delete', hash: null }),
      at(1, { id: 'TASK-00001' }),
    ])
    expect(groups[0]).toMatchObject({ deleted: true, count: 2, tools: ['create', 'delete'] })
  })

  test('nothing in, nothing out', () => {
    expect(groupActivity([])).toEqual([])
  })
})
