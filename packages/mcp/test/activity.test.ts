import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { activityFile, readActivity } from '@netherite/core'
import { beforeAll, describe, expect, test } from 'vitest'
import { isolateGit, provide, withSession } from './helpers'

beforeAll(isolateGit)

const log = (dir: string) => provide(readActivity({ root: dir }))

describe('the activity log', () => {
  test('each write is recorded with the tool, item, path, hash and files changed', async () => {
    await withSession(async (s) => {
      const created = await s.call('create', { type: 'doc', title: 'Logged' })
      const { entries } = await log(s.dir)
      expect(entries).toHaveLength(1)
      expect(entries[0]).toMatchObject({
        tool: 'create',
        id: created.data.id,
        path: created.data.path,
        hash: created.data.hash,
        changed: [created.data.path],
        actor: 'mcp',
      })
      expect(entries[0]?.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  test('the hash in the log is the file as it is on disk', async () => {
    await withSession(async (s) => {
      await s.call('update', { id: 'TASK-00001', set: { title: 'Renamed' } })
      const { data } = await s.call('get', { id: 'TASK-00001' })
      expect((await log(s.dir)).entries[0]?.hash).toBe(data.hash)
    })
  })

  test('every kind of write is recorded, newest first', async () => {
    await withSession(async (s) => {
      await s.call('create', { type: 'doc', title: 'A' })
      await s.call('update', { id: 'TASK-00001', set: { title: 'B' } })
      await s.call('set_state', { id: 'TASK-00001', state: 'doing' })
      await s.call('toggle_check', { id: 'TASK-00001', item: 0 })
      await s.call('link', { from: 'TASK-00001', to: 'DOC-00001', kind: 'related' })
      await s.call('unlink', { from: 'TASK-00001', to: 'DOC-00001', kind: 'related' })
      await s.call('mark_reviewed', { id: 'DOC-00001' })
      await s.call('delete', { id: 'DOC-00002' })
      expect((await log(s.dir)).entries.map((e) => e.tool)).toEqual([
        'delete',
        'mark_reviewed',
        'unlink',
        'link',
        'toggle_check',
        'set_state',
        'update',
        'create',
      ])
    })
  })

  test('reads, failures and writes that change nothing are not recorded', async () => {
    await withSession(async (s) => {
      await s.call('get', { id: 'TASK-00001' })
      await s.call('list')
      await s.call('search', { query: 'core' })
      await s.call('lint')
      await s.call('context')
      await s.call('update', { id: 'TASK-00001', set: { state: 'waiting' } }) // invalid
      await s.call('create', { type: 'task', title: 'x', fields: { project: 'PRJ-00404' } }) // invalid
      await s.call('delete', { id: 'TASK-00001' }) // still linked
      await s.call('update', { id: 'TASK-00001', set: { title: 'Core' } }) // already so
      await s.call('get', { id: 'TASK-09999' })
      expect((await log(s.dir)).entries).toEqual([])
    })
  })

  test('a write that touches two files is one entry listing both', async () => {
    await withSession(async (s) => {
      await s.call('set_state', {
        id: 'ADR-00001',
        state: 'superseded',
        superseded_by: 'ADR-00002',
      })
      const { entries } = await log(s.dir)
      expect(entries).toHaveLength(1)
      expect([...(entries[0]?.changed ?? [])].sort()).toEqual([
        'netherite/adr/ADR-00001-callbacks.md',
        'netherite/adr/ADR-00002-promises.md',
      ])
      expect(entries[0]?.id).toBe('ADR-00001')
    })
  })

  test('an update with fields and a section is one entry', async () => {
    await withSession(async (s) => {
      await s.call('update', {
        id: 'TASK-00001',
        set: { due: '2026-06-01' },
        section: { heading: 'Notes', content: 'x' },
      })
      expect((await log(s.dir)).entries).toHaveLength(1)
    })
  })

  test('a delete is recorded with no hash', async () => {
    await withSession(async (s) => {
      await s.call('delete', { id: 'TASK-00001', force: true })
      expect((await log(s.dir)).entries[0]).toMatchObject({
        tool: 'delete',
        id: 'TASK-00001',
        hash: null,
        path: 'netherite/tasks/TASK-00001-core.md',
      })
    })
  })

  test('parallel writes are all recorded, none mixed', async () => {
    await withSession(async (s) => {
      await Promise.all(
        Array.from({ length: 12 }, (_, i) => s.call('create', { type: 'doc', title: `Doc ${i}` })),
      )
      const { entries, skipped } = await log(s.dir)
      expect(skipped).toBe(0)
      expect(new Set(entries.map((e) => e.id)).size).toBe(12)
    })
  })

  test('can be turned off', async () => {
    await withSession(
      async (s) => {
        await s.call('create', { type: 'doc', title: 'Quiet' })
        expect((await log(s.dir)).entries).toEqual([])
      },
      { activity: false },
    )
  })

  test('is kept in the per-user folder', async () => {
    await withSession(async (s) => {
      await s.call('create', { type: 'doc', title: 'Where' })
      expect(s.read(activityFile).trim().split('\n')).toHaveLength(1)
      expect(activityFile.startsWith('.netherite/local/')).toBe(true)
    })
  })

  test('a log that cannot be written does not fail the write', async () => {
    await withSession(async (s) => {
      // Put a file where the log's folder should be.
      rmSync(join(s.dir, '.netherite/local'), { recursive: true, force: true })
      mkdirSync(join(s.dir, '.netherite'), { recursive: true })
      writeFileSync(join(s.dir, '.netherite/local'), 'in the way')
      const result = await s.call('create', { type: 'doc', title: 'Still works' })
      expect(result.isError).toBe(false)
      expect(s.read('netherite/docs/DOC-00002-still-works.md')).toContain('title: Still works')
    })
  })
})
