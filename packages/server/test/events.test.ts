import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ServerEvent } from '@netherite/api'
import { Effect, Stream } from 'effect'
import { beforeAll, describe, expect, test } from 'vitest'
import { commitAll, git, isolateGit, type Running, raw, withServer } from './helpers'

beforeAll(isolateGit)

const task1 = 'netherite/tasks/TASK-00001-core.md'

const until = (condition: () => boolean, what: string, ms = 3000) =>
  Effect.gen(function* () {
    const start = Date.now()
    while (!condition()) {
      if (Date.now() - start > ms)
        return yield* Effect.die(new Error(`timed out waiting for ${what}`))
      yield* Effect.sleep(10)
    }
  })

/** Connects an event stream and collects what arrives, after `ready`. */
const connect = (s: Running) =>
  Effect.gen(function* () {
    const seen: ServerEvent[] = []
    const stream = yield* s.client.events.events()
    yield* stream.pipe(
      Stream.runForEach((e) => Effect.sync(() => void seen.push(e))),
      Effect.forkScoped,
    )
    yield* until(() => seen.length > 0, 'the ready event')
    return seen
  })

const ofType = <T extends ServerEvent['type']>(seen: ServerEvent[], type: T) =>
  seen.filter((e): e is Extract<ServerEvent, { type: T }> => e.type === type)

/** Changes a file on disk behind the server and tells the watcher, then waits for the index. */
const editOutside = (s: Running, path: string, change: (text: string) => string) =>
  Effect.gen(function* () {
    const file = join(s.dir, path)
    const text = change(readFileSync(file, 'utf8'))
    writeFileSync(file, text)
    s.emit(file)
    yield* until(() => s.state.repo.index.get(path)?.parsed.source === text, 'the index to follow')
  })

describe('the event stream', () => {
  test('starts with ready and the server version', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const seen = yield* connect(s)
        expect(seen[0]).toEqual({ type: 'ready', version: '9.9.9' })
      }),
    )
  })

  test('is text/event-stream, one data line per event', async () => {
    await withServer((s) =>
      Effect.promise(async () => {
        const controller = new AbortController()
        const response = await fetch(`${s.url}/api/events`, { signal: controller.signal })
        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toContain('text/event-stream')
        const reader = (response.body as ReadableStream<Uint8Array>).getReader()
        const chunk = await reader.read()
        const text = new TextDecoder().decode(chunk.value)
        expect(text).toContain('data: ')
        expect(JSON.parse(text.split('data: ')[1]?.split('\n')[0] as string)).toEqual({
          type: 'ready',
          version: '9.9.9',
        })
        controller.abort()
      }),
    )
  })

  test('a client that joins later does not get old events', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          yield* s.client.items.setState({
            params: { id: 'TASK-00001' },
            payload: { state: 'doing' },
          })
          const seen = yield* connect(s)
          yield* Effect.sleep(50)
          expect(seen.map((e) => e.type)).toEqual(['ready'])
        }),
      { live: true },
    )
  })

  test('every connected client gets every event', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const a = yield* connect(s)
          const b = yield* connect(s)
          yield* s.client.items.setState({
            params: { id: 'TASK-00001' },
            payload: { state: 'doing' },
          })
          yield* until(
            () => ofType(a, 'items').length > 0 && ofType(b, 'items').length > 0,
            'both clients',
          )
          expect(ofType(a, 'items')).toEqual(ofType(b, 'items'))
        }),
      { live: true },
    )
  })
})

describe('item changes', () => {
  test('a write through the API is announced with its paths and IDs', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)
          const made = yield* s.client.items.create({ payload: { type: 'doc', title: 'New doc' } })
          yield* until(() => ofType(seen, 'items').length > 0, 'an items event')
          expect(ofType(seen, 'items')[0]).toEqual({
            type: 'items',
            upserted: [made.path],
            removed: [],
            affected: [made.path],
            ids: [made.id],
          })
        }),
      { live: true },
    )
  })

  test('a delete is announced as removed, with no ID left', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)
          yield* s.client.items.delete({ params: { id: 'TASK-00002' }, query: {} })
          yield* until(() => ofType(seen, 'items').length > 0, 'an items event')
          expect(ofType(seen, 'items')[0]).toMatchObject({
            removed: ['netherite/tasks/TASK-00002-cli.md'],
            ids: [],
          })
        }),
      { live: true },
    )
  })

  test('an edit made outside, such as in an editor, is announced with what it affects', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)
          yield* editOutside(s, task1, (t) => t.replace('title: Core', 'title: Core library'))
          yield* until(() => ofType(seen, 'items').length > 0, 'an items event')
          const event = ofType(seen, 'items')[0]
          expect(event?.upserted).toEqual([task1])
          expect(event?.ids).toEqual(expect.arrayContaining(['TASK-00001', 'TASK-00002']))
          const item = yield* s.client.items.get({ params: { id: 'TASK-00001' } })
          expect(item.title).toBe('Core library')
        }),
      { live: true },
    )
  })

  test('an outside change is visible through the API straight after the event', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)
          yield* editOutside(s, task1, (t) => t.replace('state: backlog', 'state: blocked'))
          yield* until(() => ofType(seen, 'items').length > 0, 'an items event')
          const inbox = yield* s.client.inbox.inbox({ query: {} })
          expect(inbox.blocked.map((t) => t.id)).toEqual(['TASK-00001'])
        }),
      { live: true },
    )
  })
})

describe('lint events', () => {
  test('are sent when the result changes, and only then', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)

          yield* editOutside(
            s,
            'netherite/tasks/TASK-00002-cli.md',
            (t) => `${t}\nSee [[TASK-09999]].\n`,
          )
          yield* until(() => ofType(seen, 'lint').length === 1, 'a lint event')
          expect(ofType(seen, 'lint')[0]).toMatchObject({ error: 1, warning: 0 })

          yield* editOutside(s, task1, (t) => t.replace('Plain notes.', 'Other notes.'))
          yield* until(() => ofType(seen, 'items').length === 2, 'the second items event')
          yield* Effect.sleep(100)
          expect(ofType(seen, 'lint')).toHaveLength(1)

          yield* editOutside(s, 'netherite/tasks/TASK-00002-cli.md', (t) =>
            t.replace('\nSee [[TASK-09999]].\n', ''),
          )
          yield* until(() => ofType(seen, 'lint').length === 2, 'the second lint event')
          expect(ofType(seen, 'lint')[1]).toMatchObject({ error: 0 })
        }),
      { live: true },
    )
  })

  test('follow writes through the API too', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)
          yield* s.client.items.update({
            params: { id: 'TASK-00002' },
            payload: { section: { heading: 'Links', content: '[[TASK-09999]]', mode: 'create' } },
          })
          yield* until(() => ofType(seen, 'lint').length === 1, 'a lint event')
          expect(ofType(seen, 'lint')[0]).toMatchObject({ error: 1 })
        }),
      { live: true },
    )
  })
})

describe('git events', () => {
  test('a change to HEAD or the index is announced with the branch, commit and change count', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)

          writeFileSync(
            join(s.dir, task1),
            readFileSync(join(s.dir, task1), 'utf8').replace('state: backlog', 'state: doing'),
          )
          s.emit(join(s.dir, '.git/index'))
          yield* until(() => ofType(seen, 'git').length === 1, 'a git event')
          const first = ofType(seen, 'git')[0]
          expect(first).toMatchObject({ branch: 'main', changes: 1 })
          expect(first?.head).toBe(git(s.dir, 'rev-parse', 'HEAD'))

          commitAll(s.dir, 'start core')
          s.emit(join(s.dir, '.git/HEAD'), join(s.dir, '.git/refs/heads/main'))
          yield* until(() => ofType(seen, 'git').length === 2, 'the second git event')
          const second = ofType(seen, 'git')[1]
          expect(second).toMatchObject({ changes: 0 })
          expect(second?.head).toBe(git(s.dir, 'rev-parse', 'HEAD'))
          expect(second?.head).not.toBe(first?.head)
        }),
      { git: true, live: true },
    )
  })

  test('history is read again after a commit', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)
          const before = yield* s.client.history.item({ params: { id: 'TASK-00001' } })
          expect(before.commits).toBe(1)
          yield* s.client.items.setState({
            params: { id: 'TASK-00001' },
            payload: { state: 'done' },
          })
          commitAll(s.dir, 'finish core')
          s.emit(join(s.dir, '.git/HEAD'))
          yield* until(() => ofType(seen, 'git').length === 1, 'a git event')
          const after = yield* s.client.history.item({ params: { id: 'TASK-00001' } })
          expect(after.commits).toBe(2)
        }),
      { git: true, live: true },
    )
  })

  test('files in .git other than HEAD, the index and refs are ignored', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)
          s.emit(join(s.dir, '.git/COMMIT_EDITMSG'), join(s.dir, '.git/objects/ab/cdef'))
          yield* Effect.sleep(100)
          expect(seen.map((e) => e.type)).toEqual(['ready'])
        }),
      { git: true, live: true },
    )
  })
})

describe('config events', () => {
  test('an invalid config is reported and the server keeps working', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)
          const file = join(s.dir, '.netherite/config.yml')
          writeFileSync(file, 'version: 1\nid_padding: banana\n')
          s.emit(file)
          yield* until(() => ofType(seen, 'config-invalid').length === 1, 'a config-invalid event')
          expect(ofType(seen, 'config-invalid')[0]?.message).toContain('config.yml')
          expect((yield* s.client.meta.health()).items).toBe(8)
        }),
      { live: true },
    )
  })

  test('a valid change is announced', async () => {
    await withServer(
      (s) =>
        Effect.gen(function* () {
          const seen = yield* connect(s)
          const file = join(s.dir, '.netherite/config.yml')
          writeFileSync(file, 'version: 1\nid_padding: 3\n')
          s.emit(file)
          yield* until(() => ofType(seen, 'config').length === 1, 'a config event')
          expect(ofType(seen, 'config')[0]).toEqual({ type: 'config', requiresRestart: false })
        }),
      { live: true },
    )
  })
})

describe('without a watcher', () => {
  test('API writes still reach clients, and the API still works', async () => {
    await withServer((s) =>
      Effect.gen(function* () {
        const seen = yield* connect(s)
        yield* s.client.items.setState({
          params: { id: 'TASK-00001' },
          payload: { state: 'doing' },
        })
        yield* until(() => ofType(seen, 'items').length === 1, 'an items event')
        expect(ofType(seen, 'lint')).toEqual([])
        expect((yield* Effect.promise(() => raw(s.url, '/api/health'))).status).toBe(200)
      }),
    )
  })
})
