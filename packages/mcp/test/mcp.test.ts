import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gitHandle, openRepo, workspaceGit } from '@netherite/core'
import { basicHistory, cleanWorkspaceFiles, createGitRepo } from '@netherite/testing'
import { beforeAll, describe, expect, test } from 'vitest'
import { isolateGit, provide, withSession } from './helpers'

beforeAll(isolateGit)

const names = (tools: Array<{ name: string }>) => tools.map((t) => t.name)

describe('the protocol', () => {
  test('introduces itself and explains how to use the tools', async () => {
    await withSession(async (s) => {
      expect(s.client.getServerVersion()).toMatchObject({ name: 'netherite' })
      expect(s.client.getServerCapabilities()).toMatchObject({ tools: {}, resources: {} })
      const instructions = s.client.getInstructions() ?? ''
      expect(instructions).toContain('only by ID')
      expect(instructions).toContain('base_hash')
    })
  })

  test('offers exactly the tools in ADR-00012', async () => {
    await withSession(async (s) => {
      const { tools } = await s.client.listTools()
      expect(names(tools).sort()).toEqual(
        [
          'context',
          'create',
          'delete',
          'get',
          'link',
          'lint',
          'list',
          'mark_reviewed',
          'search',
          'set_state',
          'toggle_check',
          'unlink',
          'update',
        ].sort(),
      )
    })
  })

  test('every tool has a description and an object input schema', async () => {
    await withSession(async (s) => {
      for (const tool of (await s.client.listTools()).tools) {
        expect(tool.description?.length, tool.name).toBeGreaterThan(20)
        expect(tool.inputSchema.type, tool.name).toBe('object')
      }
    })
  })

  test('read tools say they are read-only, and delete says it is destructive', async () => {
    await withSession(async (s) => {
      const byName = Object.fromEntries((await s.client.listTools()).tools.map((t) => [t.name, t]))
      for (const name of ['search', 'get', 'list', 'lint', 'context'])
        expect(byName[name]?.annotations?.readOnlyHint, name).toBe(true)
      expect(byName.delete?.annotations?.destructiveHint).toBe(true)
      expect(byName.create?.annotations?.readOnlyHint).toBe(false)
    })
  })

  test('the create schema comes from the item schemas, per type', async () => {
    await withSession(async (s) => {
      const create = (await s.client.listTools()).tools.find((t) => t.name === 'create')
      const rules = (create as { inputSchema: any }).inputSchema.allOf as any[]
      expect(rules).toHaveLength(7)
      const task = rules.find((r) => r.if.properties.type.const === 'task').then
      expect(task.required).toEqual(['fields'])
      expect(task.properties.fields.required).toEqual(['project', 'state'])
      expect(task.properties.fields.properties.state.enum).toEqual([
        'backlog',
        'doing',
        'blocked',
        'done',
      ])
      expect(task.properties.fields.properties.project.pattern).toBe('^PRJ-\\d+$')
      expect(Object.keys(task.properties.fields.properties)).not.toContain('id')
      const doc = rules.find((r) => r.if.properties.type.const === 'doc').then
      expect(doc.required).toBeUndefined()
      const adr = rules.find((r) => r.if.properties.type.const === 'adr').then
      expect(adr.properties.fields.properties.status.enum).toEqual([
        'proposed',
        'accepted',
        'deprecated',
        'superseded',
      ])
    })
  })

  test('an unknown tool is a protocol error, not a tool result', async () => {
    await withSession(async (s) => {
      await expect(s.client.callTool({ name: 'nope', arguments: {} })).rejects.toThrow(
        /Unknown tool/,
      )
    })
  })
})

describe('search', () => {
  test('finds items by ID, title and text, best first', async () => {
    await withSession(async (s) => {
      const byId = await s.call('search', { query: 'TASK-00002' })
      expect(byId.data.results[0]).toMatchObject({
        id: 'TASK-00002',
        type: 'task',
        title: 'CLI',
        state: 'doing',
        project: 'PRJ-00001',
      })
      expect((await s.call('search', { query: 'promises' })).data.results[0].id).toBe('ADR-00002')
      expect((await s.call('search', { query: 'Plain notes' })).data.results[0].id).toBe(
        'TASK-00001',
      )
    })
  })

  test('filters by type, status, project and tag', async () => {
    await withSession(async (s) => {
      const tasks = (await s.call('search', { query: 'core cli', types: ['task'] })).data.results
      expect(tasks.every((r: any) => r.type === 'task')).toBe(true)
      expect(
        (await s.call('search', { query: 'core cli', status: 'doing' })).data.results.map(
          (r: any) => r.id,
        ),
      ).toEqual(['TASK-00002'])
      expect(
        (await s.call('search', { query: 'core cli', project: 'PRJ-00001', types: ['task'] })).data
          .total,
      ).toBe(2)
      expect(
        (await s.call('search', { query: 'core', tag: 'backend' })).data.results.map(
          (r: any) => r.id,
        ),
      ).toEqual(['TASK-00001'])
    })
  })

  test('respects the limit; nothing found is an empty list', async () => {
    await withSession(async (s) => {
      expect(
        (await s.call('search', { query: 'the', limit: 2 })).data.results.length,
      ).toBeLessThanOrEqual(2)
      expect((await s.call('search', { query: 'zzzzqqqq' })).data).toEqual({
        total: 0,
        results: [],
      })
    })
  })

  test('a missing query is a field-level error', async () => {
    await withSession(async (s) => {
      const result = await s.call('search', {})
      expect(result).toMatchObject({
        isError: true,
        data: {
          error: { type: 'ValidationError', issues: [{ field: 'query', message: 'Required' }] },
        },
      })
    })
  })
})

describe('get', () => {
  test('returns the item with its fields, text, links, backlinks and derived values', async () => {
    await withSession(async (s) => {
      const { data } = await s.call('get', { id: 'TASK-00001' })
      expect(data).toMatchObject({
        id: 'TASK-00001',
        type: 'task',
        title: 'Core',
        path: 'netherite/tasks/TASK-00001-core.md',
        state: 'doing' === data.state ? 'doing' : 'backlog',
        frontmatter: { id: 'TASK-00001', project: 'PRJ-00001', labels: ['backend'] },
        progress: { done: 1, total: 3 },
        orphan: false,
        freshness: null,
      })
      expect(data.hash).toMatch(/^[0-9a-f]{64}$/)
      expect(data.body).toContain('- [ ] first')
      expect(data.body).not.toContain('id: TASK-00001')
      expect(data.links).toEqual([
        {
          kind: 'belongs_to',
          id: 'PRJ-00001',
          title: 'App',
          path: 'netherite/projects/PRJ-00001-app.md',
        },
      ])
      expect(data.backlinks.map((b: any) => [b.kind, b.id]).sort()).toEqual([
        ['depends_on', 'TASK-00002'],
        ['reference', 'TASK-00002'],
      ])
    })
  })

  test('the hash matches the file, so it works as base_hash', async () => {
    await withSession(async (s) => {
      const { data } = await s.call('get', { id: 'DOC-00001' })
      const result = await s.call('update', {
        id: 'DOC-00001',
        set: { owner: '@ada' },
        base_hash: data.hash,
      })
      expect(result.isError).toBe(false)
    })
  })

  test('unknown IDs and bad IDs are errors an agent can read', async () => {
    await withSession(async (s) => {
      expect(await s.call('get', { id: 'TASK-09999' })).toMatchObject({
        isError: true,
        data: { error: { type: 'NotFound', id: 'TASK-09999' } },
      })
      expect(await s.call('get', { id: 'banana' })).toMatchObject({
        isError: true,
        data: { error: { type: 'ValidationError', issues: [{ field: 'id' }] } },
      })
      expect((await s.call('get', {})).isError).toBe(true)
    })
  })
})

describe('list', () => {
  test('lists in ID order with filters and paging', async () => {
    await withSession(async (s) => {
      const all = (await s.call('list')).data
      expect(all.total).toBe(8)
      const tasks = (await s.call('list', { type: 'task' })).data
      expect(tasks.items.map((i: any) => i.id)).toEqual(['TASK-00001', 'TASK-00002'])
      expect(
        (await s.call('list', { type: 'adr', status: 'proposed' })).data.items.map(
          (i: any) => i.id,
        ),
      ).toEqual(['ADR-00003'])
      const page = (await s.call('list', { limit: 3, offset: 3 })).data
      expect(page).toMatchObject({ total: 8, offset: 3 })
      expect(page.items).toHaveLength(3)
      expect(page.items.map((i: any) => i.id)).toEqual(
        [...all.items.map((i: any) => i.id)].slice(3, 6),
      )
    })
  })

  test('bad filters are field-level errors', async () => {
    await withSession(async (s) => {
      const result = await s.call('list', { type: 'epic', limit: 0 })
      expect(result.isError).toBe(true)
      expect(result.data.error.issues.map((i: any) => i.field).sort()).toEqual(['limit', 'type'])
    })
  })
})

describe('create', () => {
  test('creates a task, which is on disk and findable straight away', async () => {
    await withSession(async (s) => {
      const { isError, data } = await s.call('create', {
        type: 'task',
        title: 'Write the docs',
        fields: { project: 'PRJ-00001', labels: ['docs'] },
      })
      expect(isError).toBe(false)
      expect(data).toMatchObject({
        id: 'TASK-00003',
        path: 'netherite/tasks/TASK-00003-write-the-docs.md',
        unchanged: false,
      })
      expect(s.read(data.path)).toContain('labels: [docs]')
      expect((await s.call('search', { query: 'Write the docs' })).data.results[0].id).toBe(
        'TASK-00003',
      )
      expect((await s.call('lint')).data.summary.error).toBe(0)
    })
  })

  test('records the person running the server as creator', async () => {
    await withSession(
      async (s) => {
        const { data } = await s.call('create', { type: 'doc', title: 'By me' })
        expect(s.read(data.path)).toContain('created_by: "@ada"')
        const other = await s.call('create', {
          type: 'doc',
          title: 'By agent',
          created_by: '@claude',
        })
        expect(s.read(other.data.path)).toContain('created_by: "@claude"')
      },
      { createdBy: '@ada' },
    )
  })

  test('validation errors name each field, and nothing is written', async () => {
    await withSession(async (s) => {
      const before = (await s.call('list')).data.total
      const result = await s.call('create', {
        type: 'task',
        title: 'Bad',
        fields: { project: 'PRJ-00404', due: 'soon' },
      })
      expect(result.isError).toBe(true)
      expect(result.data.error).toMatchObject({ type: 'ValidationError' })
      expect(result.data.error.issues).toEqual(
        expect.arrayContaining([
          { field: 'project', message: 'PRJ-00404 does not match any item' },
          { field: 'due', message: expect.any(String) },
        ]),
      )
      expect((await s.call('list')).data.total).toBe(before)
    })
  })

  test('arguments are checked before anything runs', async () => {
    await withSession(async (s) => {
      const result = await s.call('create', { type: 'epic', title: '', fields: 'nope' })
      expect(result.data.error.issues.map((i: any) => i.field).sort()).toEqual([
        'fields',
        'title',
        'type',
      ])
    })
  })

  test('a project without goals says which field is missing', async () => {
    await withSession(async (s) => {
      const result = await s.call('create', { type: 'project', title: 'Lonely' })
      expect(result.data.error.issues[0].field).toBe('goals')
    })
  })

  test('parallel creates get distinct IDs', async () => {
    await withSession(async (s) => {
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => s.call('create', { type: 'doc', title: `Doc ${i}` })),
      )
      expect(results.every((r) => !r.isError)).toBe(true)
      const ids = results.map((r) => r.data.id).sort()
      expect(new Set(ids).size).toBe(10)
      expect(ids[0]).toBe('DOC-00002')
      expect(ids[9]).toBe('DOC-00011')
    })
  })
})

describe('update', () => {
  test('sets and unsets fields, changing only those lines', async () => {
    await withSession(async (s) => {
      const before = s.read('netherite/tasks/TASK-00001-core.md')
      const { data } = await s.call('update', {
        id: 'TASK-00001',
        set: { assignees: ['@ada'] },
        unset: ['labels'],
      })
      const after = s.read('netherite/tasks/TASK-00001-core.md')
      expect(after).toBe(before.replace('labels: [backend]', 'assignees: ["@ada"]'))
      expect(data).toMatchObject({
        id: 'TASK-00001',
        unchanged: false,
        changed: ['netherite/tasks/TASK-00001-core.md'],
      })
    })
  })

  test('replaces, appends to and creates a section; the hash chains between them', async () => {
    await withSession(async (s) => {
      const { data: item } = await s.call('get', { id: 'TASK-00001' })
      const result = await s.call('update', {
        id: 'TASK-00001',
        set: { due: '2026-06-01' },
        section: { heading: 'Notes', content: 'Rewritten.' },
        base_hash: item.hash,
      })
      expect(result.isError).toBe(false)
      expect(s.read('netherite/tasks/TASK-00001-core.md')).toContain('due: 2026-06-01')
      expect(
        s.read('netherite/tasks/TASK-00001-core.md').endsWith('## Notes\n\nRewritten.\n'),
      ).toBe(true)
      await s.call('update', {
        id: 'TASK-00001',
        section: { heading: 'Notes', content: 'More.', mode: 'append' },
      })
      await s.call('update', {
        id: 'TASK-00001',
        section: { heading: 'Log', content: 'Started.', mode: 'create' },
      })
      expect(
        s
          .read('netherite/tasks/TASK-00001-core.md')
          .endsWith('Rewritten.\n\nMore.\n\n## Log\n\nStarted.\n'),
      ).toBe(true)
    })
  })

  test('a stale base_hash is a conflict that says how to recover', async () => {
    await withSession(async (s) => {
      const result = await s.call('update', {
        id: 'TASK-00001',
        set: { title: 'x' },
        base_hash: 'f'.repeat(64),
      })
      expect(result.isError).toBe(true)
      expect(result.data.error).toMatchObject({
        type: 'ConflictError',
        path: 'netherite/tasks/TASK-00001-core.md',
      })
      expect(result.data.error.message).toContain('Read it again')
    })
  })

  test('an edit that changes nothing says so', async () => {
    await withSession(async (s) => {
      expect(
        (await s.call('update', { id: 'TASK-00001', set: { title: 'Core' } })).data,
      ).toMatchObject({ unchanged: true, changed: [] })
    })
  })

  test('invalid values, protected fields and missing sections are reported', async () => {
    await withSession(async (s) => {
      expect(
        (await s.call('update', { id: 'TASK-00001', set: { state: 'waiting' } })).data.error
          .issues[0].field,
      ).toBe('state')
      expect(
        (await s.call('update', { id: 'TASK-00001', set: { id: 'TASK-00009' } })).data.error
          .issues[0],
      ).toMatchObject({ field: 'id' })
      expect(
        (await s.call('update', { id: 'TASK-00001', section: { heading: 'Nope', content: 'x' } }))
          .data.error,
      ).toMatchObject({ type: 'EditError', reason: 'no-such-section' })
      expect((await s.call('update', { id: 'TASK-00001' })).data.error.issues[0].message).toContain(
        'at least one',
      )
      expect(
        (await s.call('update', { id: 'TASK-00001', section: { content: 'x' } })).data.error
          .issues[0].field,
      ).toBe('section.heading')
    })
  })
})

describe('state, checklist, links, review, delete', () => {
  test('set_state moves a task and validates the state', async () => {
    await withSession(async (s) => {
      expect((await s.call('set_state', { id: 'TASK-00001', state: 'doing' })).isError).toBe(false)
      expect(s.read('netherite/tasks/TASK-00001-core.md')).toContain('state: doing')
      expect(
        (await s.call('set_state', { id: 'TASK-00001', state: 'waiting' })).data.error.issues[0]
          .field,
      ).toBe('state')
    })
  })

  test('set_state supersedes an ADR and updates both files', async () => {
    await withSession(async (s) => {
      const result = await s.call('set_state', {
        id: 'ADR-00001',
        state: 'superseded',
        superseded_by: 'ADR-00002',
      })
      expect(result.data.changed.sort()).toEqual([
        'netherite/adr/ADR-00001-callbacks.md',
        'netherite/adr/ADR-00002-promises.md',
      ])
      expect(s.read('netherite/adr/ADR-00001-callbacks.md')).toContain('superseded_by: ADR-00002')
      expect(s.read('netherite/adr/ADR-00002-promises.md')).toContain('supersedes: [ADR-00001]')
      const missing = await s.call('set_state', { id: 'ADR-00003', state: 'superseded' })
      expect(missing.data.error.issues[0].field).toBe('superseded_by')
    })
  })

  test('toggle_check by position and by text', async () => {
    await withSession(async (s) => {
      await s.call('toggle_check', { id: 'TASK-00001', item: 0 })
      expect(s.read('netherite/tasks/TASK-00001-core.md')).toContain('- [x] first')
      await s.call('toggle_check', { id: 'TASK-00001', item: 'second', checked: false })
      expect(s.read('netherite/tasks/TASK-00001-core.md')).toContain('- [ ] second')
      expect(
        (await s.call('toggle_check', { id: 'TASK-00001', item: 9 })).data.error,
      ).toMatchObject({ type: 'EditError', reason: 'no-such-check' })
      expect(
        (await s.call('toggle_check', { id: 'TASK-00001', item: -1 })).data.error.issues[0].field,
      ).toBe('item')
    })
  })

  test('link and unlink', async () => {
    await withSession(async (s) => {
      await s.call('unlink', { from: 'TASK-00002', to: 'TASK-00001', kind: 'depends_on' })
      expect(s.read('netherite/tasks/TASK-00002-cli.md')).not.toContain('depends_on')
      await s.call('link', { from: 'TASK-00002', to: 'TASK-00001', kind: 'depends_on' })
      expect(s.read('netherite/tasks/TASK-00002-cli.md')).toContain('depends_on: [TASK-00001]')
      expect(
        (await s.call('link', { from: 'TASK-00002', to: 'TASK-09999', kind: 'related' })).data.error
          .type,
      ).toBe('NotFound')
      expect(
        (await s.call('link', { from: 'DOC-00001', to: 'TASK-00001', kind: 'depends_on' })).data
          .error.type,
      ).toBe('ValidationError')
      expect(
        (await s.call('link', { from: 'TASK-00002', to: 'TASK-00001', kind: 'friends' })).data.error
          .issues[0].field,
      ).toBe('kind')
    })
  })

  test('mark_reviewed sets today or a given date', async () => {
    await withSession(async (s) => {
      await s.call('mark_reviewed', { id: 'DOC-00001', date: '2026-02-01' })
      expect(s.read('netherite/docs/DOC-00001-overview.md')).toContain('reviewed_at: 2026-02-01')
      const today = new Date().toISOString().slice(0, 10)
      await s.call('mark_reviewed', { id: 'DOC-00001' })
      expect(s.read('netherite/docs/DOC-00001-overview.md')).toContain(`reviewed_at: ${today}`)
      expect((await s.call('mark_reviewed', { id: 'TASK-00001' })).isError).toBe(true)
      expect(
        (await s.call('mark_reviewed', { id: 'DOC-00001', date: 'yesterday' })).data.error.issues[0]
          .field,
      ).toBe('date')
    })
  })

  test('delete refuses while linked, lists who links, and works with force', async () => {
    await withSession(async (s) => {
      const refused = await s.call('delete', { id: 'TASK-00001' })
      expect(refused.data.error).toMatchObject({ type: 'StillLinked', id: 'TASK-00001' })
      expect(refused.data.error.referrers.map((r: any) => r.path)).toContain(
        'netherite/tasks/TASK-00002-cli.md',
      )
      expect(existsSync(join(s.dir, 'netherite/tasks/TASK-00001-core.md'))).toBe(true)
      const done = await s.call('delete', { id: 'TASK-00001', force: true })
      expect(done.data).toEqual({
        deleted: 'TASK-00001',
        path: 'netherite/tasks/TASK-00001-core.md',
      })
      expect(existsSync(join(s.dir, 'netherite/tasks/TASK-00001-core.md'))).toBe(false)
      expect((await s.call('get', { id: 'TASK-00001' })).data.error.type).toBe('NotFound')
    })
  })
})

describe('lint and context', () => {
  test('lint reports the whole workspace or one item', async () => {
    await withSession(async (s) => {
      await s.call('update', { id: 'TASK-00002', set: { title: 'CLI' } })
      const whole = await s.call('lint')
      expect(whole.data.summary).toEqual({ error: 0, warning: 0, info: expect.any(Number) })
      const one = await s.call('lint', { id: 'DOC-00001' })
      expect(
        one.data.diagnostics.every((d: any) => d.path === 'netherite/docs/DOC-00001-overview.md'),
      ).toBe(true)
      expect((await s.call('lint', { id: 'TASK-09999' })).data.error.type).toBe('NotFound')
    })
  })
})

describe('workspace variations', () => {
  test('task states in the schema follow the workspace config', async () => {
    await withSession(
      async (s) => {
        const create = (await s.client.listTools()).tools.find((t) => t.name === 'create')
        const task = ((create as { inputSchema: any }).inputSchema.allOf as any[]).find(
          (r) => r.if.properties.type.const === 'task',
        ).then
        expect(task.properties.fields.properties.state.enum).toEqual(['open', 'shipped'])
        const setState = (await s.client.listTools()).tools.find((t) => t.name === 'set_state')
        expect(
          (setState as { inputSchema: any }).inputSchema.properties.state.description,
        ).toContain('open, shipped')
      },
      {
        files: (dir) => ({
          ...cleanWorkspaceFiles(dir),
          [`${dir}/.netherite/config.yml`]:
            'version: 1\nstates:\n  - { name: open, category: todo }\n  - { name: shipped, category: done }\n',
        }),
      },
    )
  })

  test('an ID shared by two items is reported as ambiguous, with both paths', async () => {
    await withSession(
      async (s) => {
        const result = await s.call('get', { id: 'TASK-00001' })
        expect(result.data.error).toMatchObject({ type: 'AmbiguousId', id: 'TASK-00001' })
        expect(result.data.error.paths.sort()).toEqual([
          'netherite/tasks/TASK-00001-copy.md',
          'netherite/tasks/TASK-00001-core.md',
        ])
        expect((await s.call('delete', { id: 'TASK-00001', force: true })).data.error.type).toBe(
          'AmbiguousId',
        )
        expect(
          (await s.call('update', { id: 'TASK-00001', set: { title: 'x' } })).data.error.type,
        ).toBe('AmbiguousId')
      },
      {
        files: (dir) => {
          const base = cleanWorkspaceFiles(dir)
          return {
            ...base,
            [`${dir}/netherite/tasks/TASK-00001-copy.md`]: base[
              `${dir}/netherite/tasks/TASK-00001-core.md`
            ] as string,
          }
        },
      },
    )
  })
})

describe('lint and context (more)', () => {
  test('lint shows a problem with its position, rule and severity', async () => {
    await withSession(
      async (s) => {
        const { data } = await s.call('lint', { id: 'TASK-00001' })
        expect(data.summary.error).toBe(1)
        expect(data.diagnostics[0]).toMatchObject({
          rule: 'broken-link',
          severity: 'error',
          line: 6,
          path: 'netherite/tasks/TASK-00001-core.md',
        })
      },
      {
        files: (dir) => {
          const base = cleanWorkspaceFiles(dir)
          const key = `${dir}/netherite/tasks/TASK-00001-core.md`
          return {
            ...base,
            [key]: (base[key] as string).replace('project: PRJ-00001', 'project: PRJ-00404'),
          }
        },
      },
    )
  })

  test('context returns the bundle, highest priority first', async () => {
    const ctx = (id: string, priority: string, body: string) =>
      `---\nid: ${id}\naliases: [${id}]\ntype: context\ntitle: ${id} rules\ninclude_in_context: true\npriority: ${priority}\n---\n\n# ${id}\n\n${body}\n`
    await withSession(
      async (s) => {
        const { data } = await s.call('context')
        expect(data.included.map((i: any) => i.id)).toEqual(['CTX-00002', 'CTX-00001'])
        expect(data.text.indexOf('High priority rule.')).toBeLessThan(
          data.text.indexOf('Low priority rule.'),
        )
        expect(data).toMatchObject({ budget: 8000, omitted: [] })
        const resource = await s.client.readResource({ uri: 'netherite://context' })
        expect((resource.contents[0] as any).text).toBe(data.text)
      },
      {
        files: (dir) => ({
          ...cleanWorkspaceFiles(dir),
          [`${dir}/netherite/context/CTX-00001-low.md`]: ctx(
            'CTX-00001',
            'low',
            'Low priority rule.',
          ),
          [`${dir}/netherite/context/CTX-00002-high.md`]: ctx(
            'CTX-00002',
            'high',
            'High priority rule.',
          ),
        }),
      },
    )
  })

  test('items over the budget are listed as omitted', async () => {
    const ctx = (id: string, priority: string, body: string) =>
      `---\nid: ${id}\naliases: [${id}]\ntype: context\ntitle: ${id}\ninclude_in_context: true\npriority: ${priority}\n---\n\n${body}\n`
    await withSession(
      async (s) => {
        const { data } = await s.call('context')
        expect(data.included.map((i: any) => i.id)).toEqual(['CTX-00001'])
        expect(data.omitted.map((i: any) => i.id)).toEqual(['CTX-00002'])
        const resource = await s.client.readResource({ uri: 'netherite://context' })
        expect((resource.contents[0] as any).text).toContain(
          'Left out for the token budget: CTX-00002',
        )
      },
      {
        files: (dir) => ({
          ...cleanWorkspaceFiles(dir),
          [`${dir}/.netherite/config.yml`]: 'version: 1\ncontext:\n  budget: 40\n',
          [`${dir}/netherite/context/CTX-00001-short.md`]: ctx('CTX-00001', 'high', 'Short.'),
          [`${dir}/netherite/context/CTX-00002-long.md`]: ctx(
            'CTX-00002',
            'low',
            'A much longer rule. '.repeat(30),
          ),
        }),
      },
    )
  })

  test('freshness shows up in get and lint when the server has git', async () => {
    const repo = await createGitRepo({ fixture: 'basic', history: basicHistory })
    try {
      const opened = await provide(openRepo(repo.root))
      const git = await provide(workspaceGit(opened.workspace))
      const createdBy = await provide(gitHandle(git))
      expect(createdBy).toBeUndefined() // the isolated git config has no identity
      await withSession(
        async (s) => {
          const doc = (await s.call('get', { id: 'DOC-00001' })).data
          expect(doc.freshness).toEqual({
            state: 'drifting',
            commits: 3,
            since: '2026-01-10',
            atLeast: false,
          })
          const runbook = (await s.call('get', { id: 'RUN-00001' })).data
          expect(runbook.freshness).toEqual({
            state: 'fresh',
            commits: 0,
            since: '2026-01-15',
            atLeast: false,
          })
          expect((await s.call('get', { id: 'DOC-00002' })).data.freshness).toBeNull()
          const rules = (await s.call('lint')).data.diagnostics.map((d: any) => d.rule)
          expect(rules.filter((r: string) => r === 'drifting')).toHaveLength(2)
        },
        { existing: repo.root, git },
      )
    } finally {
      await repo.cleanup()
    }
  })

  test('as_of rebuilds the state at a date from git history', async () => {
    const repo = await createGitRepo({ fixture: 'basic', history: basicHistory })
    try {
      const opened = await provide(openRepo(repo.root))
      const git = await provide(workspaceGit(opened.workspace))
      await withSession(
        async (s) => {
          const before = (await s.call('list', { as_of: '2000-01-01' })).data
          expect(before).toMatchObject({ total: 0, items: [], approximate: false })
          const live = (await s.call('list', { limit: 500 })).data
          const after = (await s.call('list', { as_of: '2999-01-01', limit: 500 })).data
          expect(after.total).toBe(live.total)
          const tasks = (await s.call('list', { as_of: '2999-01-01', type: 'task' })).data
          expect(tasks.items.every((i: any) => i.type === 'task')).toBe(true)

          const gone = (await s.call('get', { id: 'DOC-00001', as_of: '2000-01-01' })).data
          expect(gone).toMatchObject({ id: 'DOC-00001', existed: false, events: [] })
          const here = (await s.call('get', { id: 'DOC-00001', as_of: '2999-01-01' })).data
          expect(here.existed).toBe(true)

          const bad = await s.call('list', { as_of: 'soon' })
          expect(bad.isError).toBe(true)
          const tagged = await s.call('list', { as_of: '2999-01-01', tag: 'x' })
          expect(tagged.isError).toBe(true)
        },
        { existing: repo.root, git },
      )
    } finally {
      await repo.cleanup()
    }
  })

  test('as_of without git says so', async () => {
    await withSession(async (s) => {
      const result = await s.call('list', { as_of: '2026-01-01' })
      expect(result.isError).toBe(true)
      expect(result.data.error.type).toBe('Unavailable')
    })
  })

  test('without git there is no freshness', async () => {
    await withSession(async (s) => {
      expect(
        (await s.call('lint')).data.diagnostics.some(
          (d: any) => d.rule === 'drifting' || d.rule === 'stale',
        ),
      ).toBe(false)
    })
  })
})

describe('after changes made outside the server', () => {
  test('freshness is recomputed when told files changed', async () => {
    const repo = await createGitRepo({ fixture: 'basic', history: basicHistory })
    try {
      const opened = await provide(openRepo(repo.root))
      const git = await provide(workspaceGit(opened.workspace))
      await withSession(
        async (s) => {
          expect((await s.call('get', { id: 'RUN-00001' })).data.freshness.state).toBe('fresh')
          writeFileSync(join(repo.root, 'src/util.ts'), 'export const util = () => "changed"\n')
          // Cached until the server is told.
          expect((await s.call('get', { id: 'RUN-00001' })).data.freshness.state).toBe('fresh')
          s.invalidate()
          expect((await s.call('get', { id: 'RUN-00001' })).data.freshness).toMatchObject({
            state: 'drifting',
            commits: 1,
          })
        },
        { existing: repo.root, git },
      )
    } finally {
      await repo.cleanup()
    }
  })
})

describe('resources', () => {
  test('lists the context and a schema per type, and offers templates for items', async () => {
    await withSession(async (s) => {
      const { resources } = await s.client.listResources()
      expect(resources.map((r) => r.uri)).toEqual([
        'netherite://context',
        'netherite://timeline',
        'netherite://stats',
        'netherite://schema/goal',
        'netherite://schema/project',
        'netherite://schema/task',
        'netherite://schema/adr',
        'netherite://schema/doc',
        'netherite://schema/context',
        'netherite://schema/runbook',
      ])
      const { resourceTemplates } = await s.client.listResourceTemplates()
      expect(resourceTemplates.map((t) => t.uriTemplate)).toEqual([
        'netherite://item/{id}',
        'netherite://stats/{period}',
        'netherite://schema/{type}',
      ])
    })
  })

  test('reads the timeline and stats from git history, and refuses without git', async () => {
    const repo = await createGitRepo({ fixture: 'basic', history: basicHistory })
    try {
      const opened = await provide(openRepo(repo.root))
      const git = await provide(workspaceGit(opened.workspace))
      await withSession(
        async (s) => {
          const tl = await s.client.readResource({ uri: 'netherite://timeline' })
          const timeline = JSON.parse((tl.contents[0] as { text: string }).text)
          expect(timeline.tasks.length).toBeGreaterThan(0)
          const st = await s.client.readResource({ uri: 'netherite://stats/year' })
          expect(JSON.parse((st.contents[0] as { text: string }).text).period).toBe('year')
          await expect(s.client.readResource({ uri: 'netherite://stats/decade' })).rejects.toThrow(
            /Period must be/,
          )
        },
        { existing: repo.root, git },
      )
    } finally {
      await repo.cleanup()
    }
    await withSession(async (s) => {
      await expect(s.client.readResource({ uri: 'netherite://timeline' })).rejects.toThrow(
        /needs a workspace in a git repository/,
      )
    })
  })

  test('reads an item as its raw file', async () => {
    await withSession(async (s) => {
      const { contents } = await s.client.readResource({ uri: 'netherite://item/ADR-00002' })
      expect(contents[0]).toMatchObject({
        uri: 'netherite://item/ADR-00002',
        mimeType: 'text/markdown',
      })
      expect((contents[0] as any).text).toBe(s.read('netherite/adr/ADR-00002-promises.md'))
    })
  })

  test('reads a schema, matching what create validates', async () => {
    await withSession(async (s) => {
      const { contents } = await s.client.readResource({ uri: 'netherite://schema/task' })
      const schema = JSON.parse((contents[0] as any).text)
      expect(schema.type).toBe('object')
      expect(schema.required).toEqual(expect.arrayContaining(['id', 'project', 'state']))
      expect(schema.properties.state.enum).toEqual(['backlog', 'doing', 'blocked', 'done'])
    })
  })

  test('reads the context, even when empty', async () => {
    await withSession(async (s) => {
      const { contents } = await s.client.readResource({ uri: 'netherite://context' })
      expect(contents[0]).toMatchObject({ mimeType: 'text/markdown', text: '' })
    })
  })

  test('unknown resources are errors', async () => {
    await withSession(async (s) => {
      await expect(s.client.readResource({ uri: 'netherite://item/TASK-09999' })).rejects.toThrow(
        /No single item/,
      )
      await expect(s.client.readResource({ uri: 'netherite://schema/epic' })).rejects.toThrow(
        /No schema/,
      )
      await expect(s.client.readResource({ uri: 'https://example.com' })).rejects.toThrow(
        /Unknown resource/,
      )
    })
  })

  test('items created through a tool can be read straight away', async () => {
    await withSession(async (s) => {
      const { data } = await s.call('create', { type: 'doc', title: 'Fresh' })
      const { contents } = await s.client.readResource({ uri: `netherite://item/${data.id}` })
      expect((contents[0] as any).text).toContain('title: Fresh')
    })
  })
})
