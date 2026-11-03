import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanWorkspaceFiles } from '@netherite/testing'
import { Effect, PubSub } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import { commitAll, git, isolateGit, raw, withServer } from './helpers'

beforeAll(isolateGit)

const read = (dir: string, path: string) => readFileSync(join(dir, path), 'utf8')
const task1 = 'netherite/tasks/TASK-00001-core.md'

/** The error a call fails with, as a value. */
const failure = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<any> =>
  Effect.flip(effect) as Effect.Effect<any>

describe('health in a git repository', () => {
  test('names the checked-out branch', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const health = yield* s.client.meta.health()
          expect(health.git).toBe(true)
          expect(typeof health.branch).toBe('string')
        }),
      { git: true },
    )
  })
})

describe('meta', () => {
  test('health says what is being served', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const health = yield* s.client.meta.health()
        expect(health).toEqual({
          name: 'netherite',
          version: '9.9.9',
          root: s.dir,
          items: 8,
          git: false,
        })
      }),
    )
  })

  test('serves each type’s JSON Schema, and 404s for unknown types', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const task = await raw(s.url, '/api/schemas/task')
        expect(task.status).toBe(200)
        expect(task.body.properties.project).toBeDefined()
        const missing = await raw(s.url, '/api/schemas/nope')
        expect(missing.status).toBe(404)
        expect(missing.body._tag).toBe('NotFound')
      }),
    )
  })

  test('the OpenAPI document comes from the same definition', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const doc = await raw(s.url, '/api/openapi.json')
        expect(doc.status).toBe(200)
        expect(Object.keys(doc.body.paths)).toEqual(
          expect.arrayContaining([
            '/api/items',
            '/api/items/{id}',
            '/api/items/{id}/state',
            '/api/search',
            '/api/graph',
            '/api/lint',
            '/api/inbox',
            '/api/stats',
            '/api/history/decisions',
          ]),
        )
      }),
    )
  })
})

describe('reading items', () => {
  test('lists in ID order with filters and paging', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const all = yield* s.client.items.list({ query: {} })
        expect(all.total).toBe(8)
        expect(all.items.map((i) => i.id)).toEqual([
          'ADR-00001',
          'ADR-00002',
          'ADR-00003',
          'DOC-00001',
          'GOAL-00001',
          'PRJ-00001',
          'TASK-00001',
          'TASK-00002',
        ])
        const tasks = yield* s.client.items.list({ query: { type: 'task', status: 'doing' } })
        expect(tasks.items.map((i) => i.id)).toEqual(['TASK-00002'])
        const page = yield* s.client.items.list({ query: { limit: 2, offset: 6 } })
        expect(page.items.map((i) => i.id)).toEqual(['TASK-00001', 'TASK-00002'])
        expect(page.total).toBe(8)
      }),
    )
  })

  test('bad paging is a 422 that names the field', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const result = await raw(s.url, '/api/items?limit=0')
        expect(result.status).toBe(422)
        expect(result.body).toMatchObject({ _tag: 'Invalid', issues: [{ path: ['limit'] }] })
        // A value the API's own shape rejects is a 400; a well-formed request that is invalid is a 422.
        expect((await raw(s.url, '/api/items?type=banana')).status).toBe(400)
      }),
    )
  })

  test('get returns fields, text, links both ways, progress and a usable hash', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const item = yield* s.client.items.get({ params: { id: 'TASK-00001' } })
        expect(item).toMatchObject({
          id: 'TASK-00001',
          type: 'task',
          state: 'backlog',
          project: 'PRJ-00001',
          progress: { done: 1, total: 3 },
          orphan: false,
          freshness: null,
        })
        expect(item.body).toContain('- [ ] first')
        expect(item.links.map((l) => [l.kind, l.id])).toContainEqual(['belongs_to', 'PRJ-00001'])
        expect(item.backlinks.map((l) => l.id)).toContain('TASK-00002')
        expect(item.hash).toMatch(/^[0-9a-f]{64}$/)
      }),
    )
  })

  test('an unknown ID is a 404', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const error = yield* failure(s.client.items.get({ params: { id: 'TASK-09999' } }))
        expect(error).toMatchObject({ _tag: 'NotFound', id: 'TASK-09999' })
        expect((yield* Effect.promise(() => raw(s.url, '/api/items/TASK-09999'))).status).toBe(404)
      }),
    )
  })

  test('an ID shared by two items is a 409 that lists both files', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const error = yield* failure(s.client.items.get({ params: { id: 'TASK-00001' } }))
          expect(error).toMatchObject({ _tag: 'Refused', reason: 'ambiguous-id' })
          expect((error as { paths: string[] }).paths).toHaveLength(2)
        }),
      {
        files: (dir) => {
          const files = cleanWorkspaceFiles(dir)
          files[join(dir, 'netherite/tasks/TASK-00001-copy.md')] = files[join(dir, task1)] as string
          return files
        },
      },
    )
  })
})

describe('search, graph, lint', () => {
  test('search finds by text, filters by type, and rejects unknown types', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const found = yield* s.client.search.search({ query: { q: 'promises' } })
        expect(found.results[0]?.id).toBe('ADR-00002')
        const onlyDocs = yield* s.client.search.search({ query: { q: 'Overview', types: 'doc' } })
        expect(onlyDocs.results.map((r) => r.id)).toEqual(['DOC-00001'])
        const none = yield* s.client.search.search({ query: { q: 'zzzzqqqq' } })
        expect(none).toEqual({ total: 0, results: [] })
        const bad = yield* failure(s.client.search.search({ query: { q: 'x', types: 'banana' } }))
        expect(bad).toMatchObject({ _tag: 'Invalid', issues: [{ path: ['types'] }] })
      }),
    )
  })

  test('graph has a node per item and typed edges, including text references', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const graph = yield* s.client.graph.graph({ query: {} })
        expect(graph.nodes).toHaveLength(8)
        const has = (from: string, to: string, kind: string) =>
          graph.edges.some((e) => e.from === from && e.to === to && e.kind === kind)
        expect(has('TASK-00001', 'PRJ-00001', 'belongs_to')).toBe(true)
        expect(has('TASK-00002', 'TASK-00001', 'depends_on')).toBe(true)
        expect(has('TASK-00002', 'TASK-00001', 'reference')).toBe(true)
      }),
    )
  })

  test('goals list with progress, and one goal has its projects', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const { goals } = yield* s.client.goals.list()
        expect(goals.length).toBeGreaterThan(0)
        const goal = goals[0]
        const detail = yield* s.client.goals.get({ params: { id: goal?.id as string } })
        expect(detail.id).toBe(goal?.id)
        expect(detail.projectRows.length).toBe(detail.projects)
        const notGoal = yield* failure(s.client.goals.get({ params: { id: 'TASK-00001' } }))
        expect(notGoal._tag).toBe('NotFound')
        const missing = yield* failure(s.client.goals.get({ params: { id: 'GOAL-09999' } }))
        expect(missing._tag).toBe('NotFound')
      }),
    )
  })

  test('projects list, and a board has the configured columns and the tasks', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const { projects } = yield* s.client.projects.list()
        expect(projects.map((p) => p.id)).toContain('PRJ-00001')
        const board = yield* s.client.projects.board({ params: { id: 'PRJ-00001' } })
        expect(board.columns.map((c) => c.name)).toEqual(['backlog', 'doing', 'blocked', 'done'])
        expect(board.tasks.map((t) => t.id)).toContain('TASK-00001')
        const notProject = yield* failure(s.client.projects.board({ params: { id: 'TASK-00001' } }))
        expect(notProject._tag).toBe('NotFound')
      }),
    )
  })

  test('knowledge lists ADRs and docs, and a preview has a summary and backlinks', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const { items } = yield* s.client.knowledge.list()
        expect(items.map((i) => i.id)).toEqual(
          expect.arrayContaining(['ADR-00001', 'ADR-00002', 'ADR-00003', 'DOC-00001']),
        )
        expect(items.some((i) => i.type === 'task')).toBe(false)
        const preview = yield* s.client.knowledge.preview({ params: { id: 'ADR-00002' } })
        expect(preview.summary).toBe('Text.')
        expect(preview.backlinks.map((b) => b.id)).toContain('PRJ-00001')
        expect(preview.coChanged).toBeNull()
        const missing = yield* failure(s.client.knowledge.preview({ params: { id: 'ADR-09999' } }))
        expect(missing._tag).toBe('NotFound')
      }),
    )
  })

  test('a knowledge view has the supersession chain, and for a context item where it is synced', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        yield* s.client.items.link({
          params: { id: 'ADR-00002' },
          payload: { to: 'ADR-00001', kind: 'supersedes' },
        })
        const view = yield* s.client.knowledge.view({ params: { id: 'ADR-00001' } })
        expect(view.chain.map((c) => c.id)).toEqual(['ADR-00001', 'ADR-00002'])
        expect(view.changes).toBeNull()
        expect(view.context).toBeNull()

        const made = yield* s.client.items.create({
          payload: { type: 'context', title: 'House rules', fields: { include_in_context: true } },
        })
        const context = yield* s.client.knowledge.view({ params: { id: made.id } })
        expect(context.context?.include).toBe(true)
        expect(context.context?.targets.map((t) => t.path)).toEqual(
          expect.arrayContaining(['CLAUDE.md']),
        )
        expect(context.context?.targets.every((t) => t.budget > 0)).toBe(true)
      }),
    )
  })

  test('a doc lists the commits since it was reviewed that touched what it covers', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const before = yield* s.client.knowledge.view({ params: { id: 'DOC-00001' } })
          expect(before.changes?.covers).toEqual(['src/**'])
          yield* Effect.sync(() => {
            mkdirSync(join(s.dir, 'src'), { recursive: true })
            writeFileSync(join(s.dir, 'src/a.ts'), 'export {}\n')
            commitAll(s.dir, 'add a')
          })
          s.state.invalidate()
          const after = yield* s.client.knowledge.view({ params: { id: 'DOC-00001' } })
          expect(after.changes?.since).toBe('2026-01-01')
          expect(after.changes?.commits.map((c) => c.subject)).toEqual(['add a'])
          expect(after.changes?.commits[0]?.author).toBe('Ada Lovelace')
        }),
      { git: true },
    )
  })

  test('tags list with counts, and renaming one changes every file that has it', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const { tags } = yield* s.client.tags.list()
        expect(tags.find((t) => t.field === 'labels' && t.name === 'backend')?.total).toBe(1)
        const result = yield* s.client.tags.rename({
          payload: { field: 'labels', from: 'backend', to: 'server' },
        })
        expect(result.renamed).toBe(1)
        expect(read(s.dir, task1)).toContain('labels: [server]')
        const after = yield* s.client.tags.list()
        expect(after.tags.some((t) => t.name === 'backend')).toBe(false)
        const bad = yield* failure(
          s.client.tags.rename({ payload: { field: 'labels', from: 'server', to: 'two words' } }),
        )
        expect(bad._tag).toBe('Invalid')
      }),
    )
  })

  test('lint reports the whole workspace or one item, and sees edits straight away', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const clean = yield* s.client.lint.lint({ query: {} })
        expect(clean.summary.error).toBe(0)
        yield* s.client.items.update({
          params: { id: 'TASK-00002' },
          payload: {
            section: { heading: 'Links', content: 'See [[TASK-09999]].', mode: 'create' },
          },
        })
        const broken = yield* s.client.lint.lint({ query: {} })
        expect(broken.diagnostics.map((d) => d.rule)).toContain('broken-link')
        const one = yield* s.client.lint.lint({ query: { id: 'DOC-00001' } })
        expect(
          one.diagnostics.every((d) => d.path === 'netherite/docs/DOC-00001-overview.md'),
        ).toBe(true)
        const missing = yield* failure(s.client.lint.lint({ query: { id: 'TASK-09999' } }))
        expect(missing._tag).toBe('NotFound')
      }),
    )
  })
})

describe('writing items', () => {
  test('create answers 201 with the new ID, path and hash, and the file is on disk', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const made = yield* s.client.items.create({
          payload: {
            type: 'task',
            title: 'Write the docs',
            fields: { project: 'PRJ-00001', labels: ['docs'] },
            body: '- [ ] outline',
            createdBy: '@ada',
          },
        })
        expect(made).toMatchObject({
          id: 'TASK-00003',
          path: 'netherite/tasks/TASK-00003-write-the-docs.md',
          unchanged: false,
        })
        expect(read(s.dir, made.path)).toContain('created_by: "@ada"')
        const listed = yield* s.client.items.list({ query: { type: 'task' } })
        expect(listed.items.map((i) => i.id)).toContain('TASK-00003')

        const status = yield* Effect.promise(() =>
          raw(s.url, '/api/items', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-netherite-token': s.token },
            body: JSON.stringify({ type: 'doc', title: 'Raw' }),
          }),
        )
        expect(status.status).toBe(201)
      }),
    )
  })

  test('invalid input is a 422 with the field, and nothing is written', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const before = (yield* s.client.items.list({ query: {} })).total
        const error = yield* failure(
          s.client.items.create({ payload: { type: 'task', title: 'No project' } }),
        )
        expect(error._tag).toBe('Invalid')
        expect(
          (error as { issues: Array<{ path: string[] }> }).issues.map((i) => i.path),
        ).toContainEqual(['project'])
        expect((yield* s.client.items.list({ query: {} })).total).toBe(before)
        const malformed = yield* Effect.promise(() =>
          raw(s.url, '/api/items', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-netherite-token': s.token },
            body: JSON.stringify({ type: 'banana', title: 'x' }),
          }),
        )
        expect(malformed.status).toBe(400)
      }),
    )
  })

  test('update changes only the lines asked for, and its hash chains to the next edit', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const before = read(s.dir, task1)
        const first = yield* s.client.items.update({
          params: { id: 'TASK-00001' },
          payload: { set: { assignees: ['@ada'] }, unset: ['labels'] },
        })
        expect(read(s.dir, task1)).toBe(before.replace('labels: [backend]', 'assignees: ["@ada"]'))
        const second = yield* s.client.items.update({
          params: { id: 'TASK-00001' },
          payload: {
            section: { heading: 'Notes', content: 'Changed.', mode: 'replace' },
            baseHash: first.hash,
          },
        })
        expect(second.hash).not.toBe(first.hash)
        expect(read(s.dir, task1)).toContain('Changed.')
        const same = yield* s.client.items.update({
          params: { id: 'TASK-00001' },
          payload: { set: { assignees: ['@ada'] }, baseHash: second.hash },
        })
        expect(same.unchanged).toBe(true)
      }),
    )
  })

  test('a stale baseHash is a 409 Conflict with both hashes', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const item = yield* s.client.items.get({ params: { id: 'TASK-00001' } })
        yield* s.client.items.update({
          params: { id: 'TASK-00001' },
          payload: { set: { labels: ['x'] } },
        })
        const error = yield* failure(
          s.client.items.update({
            params: { id: 'TASK-00001' },
            payload: { set: { labels: ['y'] }, baseHash: item.hash },
          }),
        )
        expect(error).toMatchObject({ _tag: 'Conflict', path: task1, expected: item.hash })
        expect(read(s.dir, task1)).toContain('labels: [x]')
        const status = yield* Effect.promise(() =>
          raw(s.url, '/api/items/TASK-00001', {
            method: 'PATCH',
            headers: { 'content-type': 'application/json', 'x-netherite-token': s.token },
            body: JSON.stringify({ set: { labels: ['z'] }, baseHash: item.hash }),
          }),
        )
        expect(status.status).toBe(409)
      }),
    )
  })

  test('an empty update, and an update of a missing item, are refused', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const empty = yield* failure(
          s.client.items.update({ params: { id: 'TASK-00001' }, payload: {} }),
        )
        expect(empty._tag).toBe('Invalid')
        const missing = yield* failure(
          s.client.items.update({
            params: { id: 'TASK-09999' },
            payload: { set: { labels: ['x'] } },
          }),
        )
        expect(missing._tag).toBe('NotFound')
        const protectedField = yield* failure(
          s.client.items.update({
            params: { id: 'TASK-00001' },
            payload: { set: { id: 'TASK-00099' } },
          }),
        )
        expect(protectedField._tag).toBe('Invalid')
      }),
    )
  })

  test('setState moves a task, and supersedes an ADR on both files', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        yield* s.client.items.setState({
          params: { id: 'TASK-00001' },
          payload: { state: 'doing' },
        })
        expect(read(s.dir, task1)).toContain('state: doing')
        const bad = yield* failure(
          s.client.items.setState({ params: { id: 'TASK-00001' }, payload: { state: 'waiting' } }),
        )
        expect(bad._tag).toBe('Invalid')

        const result = yield* s.client.items.setState({
          params: { id: 'ADR-00001' },
          payload: { state: 'superseded', supersededBy: 'ADR-00002' },
        })
        expect([...result.changed].sort()).toEqual([
          'netherite/adr/ADR-00001-callbacks.md',
          'netherite/adr/ADR-00002-promises.md',
        ])
        expect(read(s.dir, 'netherite/adr/ADR-00002-promises.md')).toContain(
          'supersedes: [ADR-00001]',
        )
        const missing = yield* failure(
          s.client.items.setState({
            params: { id: 'ADR-00003' },
            payload: { state: 'superseded' },
          }),
        )
        expect(missing._tag).toBe('Invalid')
      }),
    )
  })

  test('toggleCheck ticks by position or by text', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        yield* s.client.items.toggleCheck({ params: { id: 'TASK-00001' }, payload: { item: 0 } })
        expect(read(s.dir, task1)).toContain('- [x] first')
        yield* s.client.items.toggleCheck({
          params: { id: 'TASK-00001' },
          payload: { item: 'second', checked: false },
        })
        expect(read(s.dir, task1)).toContain('- [ ] second')
        const missing = yield* failure(
          s.client.items.toggleCheck({ params: { id: 'TASK-00001' }, payload: { item: 9 } }),
        )
        expect(missing._tag).toBe('Invalid')
        const negative = yield* failure(
          s.client.items.toggleCheck({ params: { id: 'TASK-00001' }, payload: { item: -1 } }),
        )
        expect(negative._tag).toBe('Invalid')
      }),
    )
  })

  test('link and unlink', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        yield* s.client.items.unlink({
          params: { id: 'TASK-00002' },
          query: { to: 'TASK-00001', kind: 'depends_on' },
        })
        expect(read(s.dir, 'netherite/tasks/TASK-00002-cli.md')).not.toContain('depends_on')
        yield* s.client.items.link({
          params: { id: 'TASK-00002' },
          payload: { to: 'TASK-00001', kind: 'depends_on' },
        })
        expect(read(s.dir, 'netherite/tasks/TASK-00002-cli.md')).toContain(
          'depends_on: [TASK-00001]',
        )
        const missing = yield* failure(
          s.client.items.link({
            params: { id: 'TASK-00002' },
            payload: { to: 'TASK-09999', kind: 'related' },
          }),
        )
        expect(missing._tag).toBe('NotFound')
      }),
    )
  })

  test('markReviewed sets the date, and rejects a bad one', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        yield* s.client.items.markReviewed({
          params: { id: 'DOC-00001' },
          payload: { date: '2026-02-01' },
        })
        expect(read(s.dir, 'netherite/docs/DOC-00001-overview.md')).toContain(
          'reviewed_at: 2026-02-01',
        )
        const bad = yield* failure(
          s.client.items.markReviewed({
            params: { id: 'DOC-00001' },
            payload: { date: 'yesterday' },
          }),
        )
        expect(bad).toMatchObject({ _tag: 'Invalid', issues: [{ path: ['date'] }] })
      }),
    )
  })

  test('delete is refused while linked (409, lists who links), and works with force', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const refused = yield* failure(
          s.client.items.delete({ params: { id: 'TASK-00001' }, query: {} }),
        )
        expect(refused).toMatchObject({ _tag: 'Refused', reason: 'still-linked' })
        expect((refused as { paths: string[] }).paths).toContain(
          'netherite/tasks/TASK-00002-cli.md',
        )
        expect(existsSync(join(s.dir, task1))).toBe(true)

        const done = yield* s.client.items.delete({
          params: { id: 'TASK-00001' },
          query: { force: 'true' },
        })
        expect(done).toEqual({ deleted: 'TASK-00001', path: task1 })
        expect(existsSync(join(s.dir, task1))).toBe(false)
        const gone = yield* failure(s.client.items.get({ params: { id: 'TASK-00001' } }))
        expect(gone._tag).toBe('NotFound')
      }),
    )
  })

  test('parallel creates each get their own ID', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const made = yield* Effect.all(
          Array.from({ length: 15 }, (_, i) =>
            s.client.items.create({ payload: { type: 'doc', title: `Doc ${i}` } }),
          ),
          { concurrency: 'unbounded' },
        )
        expect(new Set(made.map((m) => m.id)).size).toBe(15)
        expect((yield* s.client.items.list({ query: { type: 'doc', limit: 100 } })).total).toBe(16)
      }),
    )
  })

  test('changes made outside the server are seen after the index is told', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const { toScannedItem } = yield* Effect.promise(() => import('@netherite/core'))
        const text = read(s.dir, task1).replace('state: backlog', 'state: doing')
        writeFileSync(join(s.dir, task1), text)
        s.state.repo.index.upsert(toScannedItem(task1, text))
        s.state.invalidate()
        const item = yield* s.client.items.get({ params: { id: 'TASK-00001' } })
        expect(item.state).toBe('doing')
      }),
    )
  })
})

describe('inbox', () => {
  test('without git: proposed ADRs, orphans and errors, and no working-tree changes', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const inbox = yield* s.client.inbox.inbox({ query: {} })
        expect(inbox.proposed.map((i) => i.id)).toEqual(['ADR-00003'])
        expect(inbox.changes).toEqual([])
        expect(inbox.freshness).toEqual([])
        expect(inbox.errors).toEqual([])
        expect(inbox.blocked).toEqual([])
      }),
    )
  })

  test('with git: uncommitted item changes show with their ID and kind of change', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          yield* s.client.items.setState({
            params: { id: 'TASK-00001' },
            payload: { state: 'doing' },
          })
          yield* s.client.items.create({ payload: { type: 'doc', title: 'Fresh doc' } })
          const inbox = yield* s.client.inbox.inbox({ query: {} })
          const byPath = Object.fromEntries(inbox.changes.map((c) => [c.path, c]))
          expect(byPath[task1]).toMatchObject({
            change: 'modified',
            id: 'TASK-00001',
            type: 'task',
          })
          expect(byPath['netherite/docs/DOC-00002-fresh-doc.md']).toMatchObject({
            change: 'untracked',
            id: 'DOC-00002',
          })
        }),
      { git: true },
    )
  })

  test('agent activity since a time, grouped per item', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const lines = [
          {
            time: '2026-03-01T10:00:00.000Z',
            tool: 'create',
            id: 'TASK-00001',
            path: task1,
            hash: 'a',
            changed: [task1],
          },
          {
            time: '2026-03-02T10:00:00.000Z',
            tool: 'set_state',
            id: 'TASK-00001',
            path: task1,
            hash: 'b',
            changed: [task1],
          },
          {
            time: '2026-03-03T10:00:00.000Z',
            tool: 'update',
            id: 'DOC-00001',
            path: 'netherite/docs/DOC-00001-overview.md',
            hash: 'c',
            changed: [],
          },
        ]
        const file = join(s.dir, '.netherite/local/activity.jsonl')
        yield* Effect.promise(async () => {
          const { mkdirSync } = await import('node:fs')
          mkdirSync(join(s.dir, '.netherite/local'), { recursive: true })
          writeFileSync(file, `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`)
        })
        const all = yield* s.client.inbox.inbox({ query: {} })
        expect(all.activity.map((a) => [a.id, a.count])).toEqual([
          ['DOC-00001', 1],
          ['TASK-00001', 2],
        ])
        const recent = yield* s.client.inbox.inbox({ query: { since: '2026-03-02T12:00:00Z' } })
        expect(recent.activity.map((a) => a.id)).toEqual(['DOC-00001'])
        const bad = yield* failure(s.client.inbox.inbox({ query: { since: 'last week' } }))
        expect(bad._tag).toBe('Invalid')
      }),
    )
  })

  test('blocked tasks and lint errors are listed', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        yield* s.client.items.setState({
          params: { id: 'TASK-00001' },
          payload: { state: 'blocked' },
        })
        yield* s.client.items.update({
          params: { id: 'TASK-00002' },
          payload: { section: { heading: 'Links', content: '[[TASK-09999]]', mode: 'create' } },
        })
        const inbox = yield* s.client.inbox.inbox({ query: {} })
        expect(inbox.blocked.map((t) => t.id)).toEqual(['TASK-00001'])
        expect(inbox.errors.map((d) => d.rule)).toContain('broken-link')
      }),
    )
  })
})

describe('history and stats', () => {
  test('period stats need git, take a period, and compare with the one before', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const none = yield* failure(s.client.stats.period({ query: {} }))
        expect(none._tag).toBe('Unavailable')
      }),
    )
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const month = yield* s.client.stats.period({ query: {} })
          expect(month.period).toBe('30d')
          expect(month.kpis.commits.value).toBeGreaterThan(0)
          expect(month.kpis.commits.previous).toBe(0)
          expect(month.heat.days.reduce((n, d) => n + d.count, 0)).toBeGreaterThan(0)
          expect(month.knowledge.decisions).toMatchObject({ accepted: 2 })
          const year = yield* s.client.stats.period({ query: { period: 'year' } })
          expect(year.throughput.length).toBeGreaterThanOrEqual(1)
          const bad = yield* failure(s.client.stats.period({ query: { period: 'decade' } }))
          expect(bad).toMatchObject({ _tag: 'Invalid', issues: [{ path: ['period'] }] })
        }),
      { git: true },
    )
  })

  test('the timeline needs git, takes a window, and counts commits per week', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const none = yield* failure(s.client.timeline.timeline({ query: {} }))
        expect(none._tag).toBe('Unavailable')
      }),
    )
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const tl = yield* s.client.timeline.timeline({ query: {} })
          expect(tl.tasks.length).toBeGreaterThan(0)
          expect(tl.activity.reduce((n, w) => n + w.count, 0)).toBeGreaterThan(0)
          expect(tl.goals[0]).toMatchObject({ id: 'GOAL-00001', overdue: false })
          const bad = yield* failure(s.client.timeline.timeline({ query: { from: 'soon' } }))
          expect(bad).toMatchObject({ _tag: 'Invalid', issues: [{ path: ['from'] }] })
          const early = yield* s.client.timeline.timeline({
            query: { from: '2000-01-01', to: '2000-02-01' },
          })
          expect(early.tasks).toEqual([])
        }),
      { git: true },
    )
  })

  test('the graph as of a date needs git and a valid date', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const none = yield* failure(s.client.graph.graph({ query: { asOf: '2026-01-01' } }))
        expect(none._tag).toBe('Unavailable')
        const bad = yield* failure(s.client.graph.graph({ query: { asOf: 'soon' } }))
        expect(bad).toMatchObject({ _tag: 'Invalid', issues: [{ path: ['asOf'] }] })
      }),
    )
  })

  test('the graph as of a date is empty before the first commit and live afterwards', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const before = yield* s.client.graph.graph({ query: { asOf: '2000-01-01' } })
          expect(before.nodes).toEqual([])
          expect(before.approximate).toBe(false)
          const live = yield* s.client.graph.graph({ query: {} })
          const later = yield* s.client.graph.graph({ query: { asOf: '2999-01-01' } })
          expect(later.nodes.map((n) => n.id).sort()).toEqual(live.nodes.map((n) => n.id).sort())
        }),
      { git: true },
    )
  })

  test('without git they are 503', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const decisions = yield* failure(s.client.history.decisions({ query: {} }))
        expect(decisions._tag).toBe('Unavailable')
        const stats = yield* failure(s.client.stats.stats({ query: {} }))
        expect(stats._tag).toBe('Unavailable')
        expect((yield* Effect.promise(() => raw(s.url, '/api/stats'))).status).toBe(503)
      }),
    )
  })

  test('decision log, item history and stats follow the commits', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          yield* s.client.items.setState({
            params: { id: 'ADR-00003' },
            payload: { state: 'accepted' },
          })
          yield* Effect.sync(() => commitAll(s.dir, 'accept logging'))
          yield* s.client.items.setState({
            params: { id: 'TASK-00001' },
            payload: { state: 'done' },
          })
          yield* Effect.sync(() => commitAll(s.dir, 'finish core'))
          s.state.invalidate()

          const log = yield* s.client.history.decisions({ query: {} })
          expect(log.partial).toBe(false)
          const accepted = log.transitions.find((t) => t.id === 'ADR-00003' && t.to === 'accepted')
          expect(accepted).toMatchObject({
            field: 'status',
            from: 'proposed',
            author: { name: 'Ada Lovelace' },
          })

          const forProject = yield* s.client.history.decisions({ query: { project: 'PRJ-00001' } })
          expect(forProject.transitions).toEqual([])

          const item = yield* s.client.history.item({ params: { id: 'TASK-00001' } })
          expect(item.commits).toBe(2)
          expect(item.transitions.map((t) => t.to)).toContain('done')
          expect(item.authors[0]).toMatchObject({ name: 'Ada Lovelace', commits: 2 })
          const none = yield* failure(s.client.history.item({ params: { id: 'TASK-09999' } }))
          expect(none._tag).toBe('NotFound')

          const stats = yield* s.client.stats.stats({ query: {} })
          expect(stats.completions.reduce((n, w) => n + w.count, 0)).toBe(1)
          // ADR-00001 and 00002 were created accepted; ADR-00003 was accepted later.
          expect(stats.adrs.reduce((n, w) => n + w.accepted, 0)).toBe(3)
          const weeks = stats.progress.projects['PRJ-00001'] ?? []
          expect(weeks.at(-1)).toMatchObject({ done: 1, total: 2 })
          expect(stats.progress.goals['GOAL-00001']?.at(-1)).toMatchObject({ done: 1, total: 2 })

          const bad = yield* failure(s.client.stats.stats({ query: { from: 'soon' } }))
          expect(bad).toMatchObject({ _tag: 'Invalid', issues: [{ path: ['from'] }] })
        }),
      { git: true },
    )
  })

  test('git state is untouched by reads', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const before = git(s.dir, 'status', '--porcelain')
          yield* s.client.history.decisions({ query: {} })
          yield* s.client.stats.stats({ query: {} })
          yield* s.client.inbox.inbox({ query: {} })
          expect(git(s.dir, 'status', '--porcelain')).toBe(before)
        }),
      { git: true },
    )
  })
})

describe('editing a whole file', () => {
  test('source is the whole file with its hash, and no committed version without git', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const source = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
        expect(source.text).toBe(read(s.dir, task1))
        expect(source.text.startsWith('---\nid: TASK-00001')).toBe(true)
        const item = yield* s.client.items.get({ params: { id: 'TASK-00001' } })
        expect(source.hash).toBe(item.hash)
        expect(source.head).toBeNull()
        const missing = yield* failure(s.client.items.source({ params: { id: 'TASK-09999' } }))
        expect(missing._tag).toBe('NotFound')
      }),
    )
  })

  test('with git, head is the committed text, which stays put while the file is edited', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const committed = read(s.dir, task1)
          const first = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
          expect(first.head).toBe(committed)
          yield* s.client.items.setState({
            params: { id: 'TASK-00001' },
            payload: { state: 'doing' },
          })
          const after = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
          expect(after.text).toContain('state: doing')
          expect(after.head).toBe(committed)
        }),
      { git: true },
    )
  })

  test('a file never committed has no head', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const made = yield* s.client.items.create({
            payload: { type: 'doc', title: 'Brand new' },
          })
          expect((yield* s.client.items.source({ params: { id: made.id } })).head).toBeNull()
        }),
      { git: true },
    )
  })

  test('replaceSource saves the whole file and returns the new hash', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const source = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
        const text = source.text.replace('Plain notes.', 'Written in the editor.')
        const saved = yield* s.client.items.replaceSource({
          params: { id: 'TASK-00001' },
          payload: { text, baseHash: source.hash },
        })
        expect(read(s.dir, task1)).toBe(text)
        const again = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
        expect(again.hash).toBe(saved.hash)
      }),
    )
  })

  test('a stale baseHash is a 409 and the file is not touched', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const source = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
        yield* s.client.items.update({
          params: { id: 'TASK-00001' },
          payload: { set: { labels: ['x'] } },
        })
        const before = read(s.dir, task1)
        const error = yield* failure(
          s.client.items.replaceSource({
            params: { id: 'TASK-00001' },
            payload: { text: `${source.text}\nmine\n`, baseHash: source.hash },
          }),
        )
        expect(error).toMatchObject({ _tag: 'Conflict', path: task1 })
        expect(read(s.dir, task1)).toBe(before)
      }),
    )
  })

  test('text that breaks the schema, or changes the ID, is a 422 with the field', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const { text } = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
        const badState = yield* failure(
          s.client.items.replaceSource({
            params: { id: 'TASK-00001' },
            payload: { text: text.replace('state: backlog', 'state: nonsense') },
          }),
        )
        expect(badState).toMatchObject({ _tag: 'Invalid', issues: [{ path: ['state'] }] })
        const renamed = yield* failure(
          s.client.items.replaceSource({
            params: { id: 'TASK-00001' },
            payload: { text: text.replace('id: TASK-00001', 'id: TASK-00099') },
          }),
        )
        expect(renamed).toMatchObject({ _tag: 'Invalid', issues: [{ path: ['id'] }] })
        expect(read(s.dir, task1)).toBe(text)
      }),
    )
  })

  test('saving needs the session token, like every write', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const reply = await raw(s.url, '/api/items/TASK-00001/source', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: 'x' }),
        })
        expect(reply.status).toBe(401)
      }),
    )
  })

  test('a save is announced to other open pages', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const events: string[] = []
        const sub = yield* PubSub.subscribe(s.state.events)
        const source = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
        yield* s.client.items.replaceSource({
          params: { id: 'TASK-00001' },
          payload: { text: source.text.replace('Plain notes.', 'Announced.') },
        })
        const event = yield* PubSub.take(sub)
        events.push(event.type)
        expect(events).toEqual(['items'])
      }),
    )
  })
})

describe('linting text that is not saved', () => {
  test('reports a problem in the buffer, at its line, without writing anything', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const { text } = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
        const report = yield* s.client.lintText.lintText({
          payload: { id: 'TASK-00001', text: text.replace('state: backlog', 'state: nonsense') },
        })
        expect(report.summary.error).toBeGreaterThan(0)
        const problem = report.diagnostics.find((d) => d.rule === 'schema')
        expect(problem).toMatchObject({ path: task1, severity: 'error' })
        expect(problem?.line).toBeGreaterThan(1)
        expect(read(s.dir, task1)).toBe(text)
      }),
    )
  })

  test('clean text has no errors; a broken link made in the buffer is found', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const { text } = yield* s.client.items.source({ params: { id: 'TASK-00001' } })
        const clean = yield* s.client.lintText.lintText({ payload: { id: 'TASK-00001', text } })
        expect(clean.summary.error).toBe(0)
        const broken = yield* s.client.lintText.lintText({
          payload: { id: 'TASK-00001', text: `${text}\nSee [[TASK-09999]].\n` },
        })
        expect(broken.diagnostics.map((d) => d.rule)).toContain('broken-link')
      }),
    )
  })

  test('an unknown item is a 404, and linting needs the token (it is a POST)', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const missing = yield* failure(
          s.client.lintText.lintText({ payload: { id: 'TASK-09999', text: 'x' } }),
        )
        expect(missing._tag).toBe('NotFound')
        const noToken = yield* Effect.promise(() =>
          raw(s.url, '/api/lint/text', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{}',
          }),
        )
        expect(noToken.status).toBe(401)
      }),
    )
  })
})
