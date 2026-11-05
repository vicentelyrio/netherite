import { Effect, Fiber, type FileSystem, type Path, Stream } from 'effect'
import { describe, expect, test } from 'vitest'
import {
  type ChangeEvent,
  createItem,
  updateFields,
  type WatchBackend,
  type Watcher,
  watchRepo,
} from '../src/index'
import { cleanFiles, type World, world } from './ops-helpers'

/** A backend that reports whatever the test tells it to, routed by folder like the real one. */
const fakeBackend = () => {
  const subs: Array<{
    dir: string
    onEvents: (events: Array<{ path: string }>) => void
    active: boolean
    ignore: ReadonlyArray<string>
  }> = []
  const backend: WatchBackend = {
    subscribe: async (dir, onEvents, options) => {
      const sub = { dir, onEvents, active: true, ignore: options.ignore }
      subs.push(sub)
      return {
        unsubscribe: async () => {
          sub.active = false
        },
      }
    },
  }
  return {
    backend,
    subs,
    emit: (...paths: string[]) => {
      for (const sub of subs) {
        if (!sub.active) continue
        const mine = paths.filter((p) => p.startsWith(`${sub.dir}/`))
        if (mine.length > 0) sub.onEvents(mine.map((path) => ({ path })))
      }
    },
  }
}

const tasks = '/repo/netherite/tasks'
const t1 = `${tasks}/TASK-00001-core.md`

const watching = async (
  debounceMs = 60_000,
  files: Record<string, string> = cleanFiles(),
  gitDir?: string,
) => {
  const w = await world(files)
  const fake = fakeBackend()
  const session = <A>(
    use: (
      watcher: Watcher,
      events: ChangeEvent[],
      w: World,
    ) => Effect.Effect<A, unknown, FileSystem.FileSystem | Path.Path>,
  ) =>
    w.run(
      Effect.scoped(
        Effect.gen(function* () {
          const watcher = yield* watchRepo(w.repo, {
            backend: fake.backend,
            debounceMs,
            ...(gitDir === undefined ? {} : { gitDir }),
          })
          const events: ChangeEvent[] = []
          watcher.listen((e) => events.push(e))
          return yield* use(watcher, events, w)
        }),
      ) as never,
    ) as Promise<A>
  return { w, fake, session }
}

describe('applying changes', () => {
  test('a changed file updates the index and is reported', async () => {
    const { w, fake, session } = await watching()
    const changed = await session((watcher, events) =>
      Effect.gen(function* () {
        const before = w.read(t1) as string
        w.write(t1, before.replace('title: Core', 'title: Core library'))
        fake.emit(t1)
        yield* watcher.flush
        return events
      }),
    )
    expect(changed).toEqual([
      {
        _tag: 'ItemsChanged',
        upserted: ['netherite/tasks/TASK-00001-core.md'],
        removed: [],
        affected: expect.arrayContaining(['netherite/tasks/TASK-00001-core.md']),
      },
    ])
    expect(w.repo.index.get('netherite/tasks/TASK-00001-core.md')?.title).toBe('Core library')
  })

  test('a new file is added, and links to it start to resolve', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.write(
          '/repo/netherite/tasks/TASK-00009-new.md',
          '---\nid: TASK-00009\naliases: [TASK-00009]\ntype: task\ntitle: New\nproject: PRJ-00001\nstate: backlog\n---\n\n# New\n',
        )
        w.write(
          '/repo/netherite/docs/DOC-00002-linker.md',
          '---\nid: DOC-00002\naliases: [DOC-00002]\ntype: doc\ntitle: Linker\n---\n\nSee [[TASK-00009]].\n',
        )
        fake.emit('/repo/netherite/docs/DOC-00002-linker.md')
        yield* watcher.flush
        // The link is broken until its target shows up.
        expect(w.repo.index.unresolved().map((u) => u.ref.target)).toEqual(['TASK-00009'])
        fake.emit('/repo/netherite/tasks/TASK-00009-new.md')
        yield* watcher.flush
        return list
      }),
    )
    expect(w.repo.index.unresolved()).toEqual([])
    expect(events).toHaveLength(2)
    expect(events[1]).toMatchObject({
      upserted: ['netherite/tasks/TASK-00009-new.md'],
      affected: ['netherite/docs/DOC-00002-linker.md', 'netherite/tasks/TASK-00009-new.md'],
    })
  })

  test('a deleted file is removed, and its referrers are reported as affected', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.remove(t1)
        fake.emit(t1)
        yield* watcher.flush
        return list
      }),
    )
    expect(events[0]).toMatchObject({
      upserted: [],
      removed: ['netherite/tasks/TASK-00001-core.md'],
    })
    expect((events[0] as unknown as { affected: string[] }).affected).toContain(
      'netherite/tasks/TASK-00002-cli.md',
    )
    expect(w.repo.index.findById('TASK-00001')).toEqual([])
  })

  test('removing a whole folder removes everything in it', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.remove(tasks)
        fake.emit(tasks)
        yield* watcher.flush
        return list
      }),
    )
    expect((events[0] as unknown as { removed: string[] }).removed).toEqual([
      'netherite/tasks/TASK-00001-core.md',
      'netherite/tasks/TASK-00002-cli.md',
    ])
    expect(w.repo.index.findById('TASK-00002')).toEqual([])
  })

  test('a folder that appears with files in it is scanned', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.write(
          '/repo/netherite/docs/more/DOC-00005-nested.md',
          '---\nid: DOC-00005\naliases: [DOC-00005]\ntype: doc\ntitle: Nested\n---\n',
        )
        fake.emit('/repo/netherite/docs/more')
        yield* watcher.flush
        return list
      }),
    )
    expect((events[0] as unknown as { upserted: string[] }).upserted).toEqual([
      'netherite/docs/more/DOC-00005-nested.md',
    ])
  })

  test('several events for one file become one change', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        const text = w.read(t1) as string
        w.write(t1, text.replace('state: backlog', 'state: doing'))
        fake.emit(t1, t1)
        fake.emit(t1)
        w.write(t1, text.replace('state: backlog', 'state: blocked'))
        fake.emit(t1)
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toHaveLength(1)
    expect(w.repo.index.get('netherite/tasks/TASK-00001-core.md')?.parsed.source).toContain(
      'state: blocked',
    )
  })

  test('a file created and deleted inside one window leaves no trace', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        const path = '/repo/netherite/docs/DOC-00007-flash.md'
        w.write(path, '---\nid: DOC-00007\naliases: [DOC-00007]\ntype: doc\ntitle: Flash\n---\n')
        fake.emit(path)
        w.remove(path)
        fake.emit(path)
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toEqual([])
    expect(w.repo.index.findById('DOC-00007')).toEqual([])
  })

  test('an unchanged file produces no event', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.write(t1, w.read(t1) as string)
        fake.emit(t1)
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toEqual([])
  })

  test('changes made through operations are not reported again', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        const created = yield* createItem(w.repo, { type: 'doc', title: 'Via op' })
        yield* updateFields(w.repo, 'TASK-00001', { set: { title: 'Changed by op' } })
        fake.emit(`/repo/${created.path}`, t1)
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toEqual([])
  })

  test('ignores files that are not items', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        for (const path of [
          '/repo/netherite/tasks/notes.txt',
          '/repo/netherite/.obsidian/workspace.md',
          '/repo/netherite/assets/readme.md',
          '/repo/netherite/tasks/.TASK-00001-core.md.1234.tmp',
          '/repo/netherite/tasks/.hidden.md',
        ]) {
          w.write(path, '---\nid: DOC-00099\n---\n')
          fake.emit(path)
        }
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toEqual([])
    expect(w.repo.index.size()).toBe(8)
  })
})

describe('debouncing', () => {
  test('nothing is applied until the quiet period passes', async () => {
    const { w, fake, session } = await watching(40)
    await session((watcher, events) =>
      Effect.gen(function* () {
        w.write(t1, (w.read(t1) as string).replace('title: Core', 'title: First'))
        fake.emit(t1)
        yield* Effect.promise(() => new Promise((r) => setTimeout(r, 15)))
        expect(events).toEqual([])
        // Another event inside the window pushes the deadline out.
        w.write(t1, (w.read(t1) as string).replace('title: First', 'title: Second'))
        fake.emit(t1)
        yield* Effect.promise(() => new Promise((r) => setTimeout(r, 30)))
        expect(events).toEqual([])
        yield* Effect.promise(() => new Promise((r) => setTimeout(r, 120)))
        expect(events).toHaveLength(1)
        yield* watcher.flush
      }),
    )
    expect(w.repo.index.get('netherite/tasks/TASK-00001-core.md')?.title).toBe('Second')
  })

  test('a batch started while another is running waits for it and reads the latest text', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.write(t1, (w.read(t1) as string).replace('title: Core', 'title: A'))
        fake.emit(t1)
        const first = Effect.runPromise(watcher.flush)
        w.write(t1, (w.read(t1) as string).replace('title: A', 'title: B'))
        fake.emit(t1)
        yield* Effect.promise(() => first)
        yield* watcher.flush
        return list
      }),
    )
    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(w.repo.index.get('netherite/tasks/TASK-00001-core.md')?.title).toBe('B')
  })
})

describe('configuration', () => {
  const config = '/repo/.netherite/config.yml'

  test('a valid change is applied', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.write(
          config,
          'version: 1\nstates:\n  - { name: open, category: todo }\n  - { name: shipped, category: done }\n',
        )
        fake.emit(config)
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toEqual([{ _tag: 'ConfigChanged', requiresRestart: false }])
    expect(w.repo.workspace.config.states.map((s) => s.name)).toEqual(['open', 'shipped'])
    expect(Object.keys(w.repo.schemas)).toContain('task')
    // The schemas follow: the old state names no longer validate.
    const issues = await w.fail(updateFields(w.repo, 'TASK-00001', { set: { state: 'doing' } }))
    expect(issues).toMatchObject({ _tag: 'ValidationError', issues: [{ path: ['state'] }] })
  })

  test('which states count as done follows the config', async () => {
    const { w, fake, session } = await watching()
    expect(w.repo.index.progress('netherite/projects/PRJ-00001-app.md')).toEqual({
      done: 0,
      total: 2,
    })
    await session((watcher) =>
      Effect.gen(function* () {
        w.write(
          config,
          'version: 1\nstates:\n  - { name: backlog, category: todo }\n  - { name: doing, category: done }\n',
        )
        fake.emit(config)
        yield* watcher.flush
      }),
    )
    expect(w.repo.index.progress('netherite/projects/PRJ-00001-app.md')).toEqual({
      done: 1,
      total: 2,
    })
  })

  test('an invalid config is reported and the old one stays', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.write(config, 'version: 1\nid_padding: 0\n')
        fake.emit(config)
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ _tag: 'ConfigInvalid', error: { _tag: 'ConfigInvalid' } })
    expect(w.repo.workspace.config.id_padding).toBe(5)
  })

  test('a deleted config is reported too', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.remove(config)
        fake.emit(config)
        yield* watcher.flush
        return list
      }),
    )
    expect(events[0]).toMatchObject({ _tag: 'ConfigInvalid', error: { _tag: 'ConfigReadError' } })
  })

  test('moving the content folder needs a restart and changes nothing', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.write(config, 'version: 1\ncontent: elsewhere\n')
        fake.emit(config)
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toEqual([{ _tag: 'ConfigChanged', requiresRestart: true }])
    expect(w.repo.workspace.config.content).toBe('netherite')
  })

  test('an edit that changes nothing in the config is not reported', async () => {
    const { w, fake, session } = await watching()
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.write(config, '# a comment\nversion: 1\n')
        fake.emit(config)
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toEqual([])
  })
})

describe('lifecycle', () => {
  test('watches the content folder and the config folder', async () => {
    const { fake, session } = await watching()
    await session(() =>
      Effect.sync(() =>
        expect(fake.subs.map((s) => s.dir)).toEqual(['/repo/netherite', '/repo/.netherite']),
      ),
    )
  })

  test('stops watching when the scope closes', async () => {
    const { fake, session } = await watching()
    await session(() => Effect.void)
    expect(fake.subs.every((s) => !s.active)).toBe(true)
  })

  test('a backend that fails to start is a WatchError', async () => {
    const w = await world()
    const failing: WatchBackend = {
      subscribe: async () => {
        throw new Error('no inotify watches left')
      },
    }
    const error = await w.fail(Effect.scoped(watchRepo(w.repo, { backend: failing })))
    expect(error).toMatchObject({ _tag: 'WatchError', path: '/repo/netherite' })
    expect(error.message).toContain('no inotify watches left')
  })

  test('listeners can stop listening', async () => {
    const { w, fake, session } = await watching()
    const seen: ChangeEvent[] = []
    await session((watcher) =>
      Effect.gen(function* () {
        const stop = watcher.listen((e) => seen.push(e))
        w.write(t1, (w.read(t1) as string).replace('title: Core', 'title: One'))
        fake.emit(t1)
        yield* watcher.flush
        stop()
        w.write(t1, (w.read(t1) as string).replace('title: One', 'title: Two'))
        fake.emit(t1)
        yield* watcher.flush
      }),
    )
    expect(seen).toHaveLength(1)
  })

  test('events can be read as a stream', async () => {
    const { w, fake, session } = await watching()
    const got = await session((watcher) =>
      Effect.gen(function* () {
        const fiber = yield* Effect.forkChild(Stream.runCollect(Stream.take(watcher.events, 1)))
        yield* Effect.promise(() => new Promise((r) => setTimeout(r, 20)))
        w.write(t1, (w.read(t1) as string).replace('title: Core', 'title: Streamed'))
        fake.emit(t1)
        yield* watcher.flush
        return yield* Fiber.join(fiber)
      }),
    )
    expect(got).toBeDefined()
  })
})

describe('git', () => {
  const gitFiles = () => ({ ...cleanFiles(), '/repo/.git/HEAD': 'ref: refs/heads/main\n' })

  test('watches the git folder when it is given and exists', async () => {
    const { fake, session } = await watching(60_000, gitFiles(), '/repo/.git')
    await session(() =>
      Effect.sync(() => expect(fake.subs.map((s) => s.dir)).toContain('/repo/.git')),
    )
    const without = await watching()
    await without.session(() =>
      Effect.sync(() => expect(without.fake.subs.map((s) => s.dir)).not.toContain('/repo/.git')),
    )
  })

  test('a change to HEAD, the index or a ref is one GitChanged event', async () => {
    const { fake, session } = await watching(60_000, gitFiles(), '/repo/.git')
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        fake.emit('/repo/.git/HEAD', '/repo/.git/index', '/repo/.git/refs/heads/main')
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toEqual([{ _tag: 'GitChanged' }])
  })

  test('other files in the git folder, and lock files, are not reported', async () => {
    const { fake, session } = await watching(60_000, gitFiles(), '/repo/.git')
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        fake.emit(
          '/repo/.git/COMMIT_EDITMSG',
          '/repo/.git/FETCH_HEAD',
          '/repo/.git/objects/ab/cdef',
        )
        yield* watcher.flush
        return list
      }),
    )
    expect(events).toEqual([])
  })

  test('git changes and item changes in one batch give both events', async () => {
    const { w, fake, session } = await watching(60_000, gitFiles(), '/repo/.git')
    const events = await session((watcher, list) =>
      Effect.gen(function* () {
        w.write(t1, (w.read(t1) as string).replace('title: Core', 'title: Core 2'))
        fake.emit(t1, '/repo/.git/index')
        yield* watcher.flush
        return list
      }),
    )
    expect(events.map((e) => e._tag)).toEqual(['ItemsChanged', 'GitChanged'])
  })
})
