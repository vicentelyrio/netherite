import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NodeFileSystem, NodePath } from '@effect/platform-node'
import { withTempDir } from '@netherite/testing'
import { Effect, Layer } from 'effect'
import { describe, expect, test } from 'vitest'
import { type ChangeEvent, createItem, openRepo, type Repo, watchRepo } from '../src/index'

// These tests use the real file watcher (FSEvents, inotify or ReadDirectoryChangesW) on a
// temporary copy of fixtures/basic, so they cover what the fake backend cannot: that events
// really arrive, with the paths and timing the code expects.

const layer = Layer.merge(NodeFileSystem.layer, NodePath.layer)
const doc = (id: string, title: string, body = '') =>
  `---\nid: ${id}\naliases: [${id}]\ntype: doc\ntitle: ${title}\n---\n\n${body}\n`

const until = async (check: () => boolean, ms = 8000) => {
  const start = Date.now()
  while (!check()) {
    if (Date.now() - start > ms) throw new Error('Timed out waiting for the watcher')
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

const session = (use: (ctx: { dir: string; events: ChangeEvent[]; repo: Repo }) => Promise<void>) =>
  withTempDir('basic', async (dir) => {
    const { realpathSync } = await import('node:fs')
    const root = realpathSync(dir)
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const repo = yield* openRepo(root)
          const watcher = yield* watchRepo(repo, { debounceMs: 40 })
          const events: ChangeEvent[] = []
          watcher.listen((e) => events.push(e))
          // Give the OS watcher a moment to be ready before the test touches files.
          yield* Effect.promise(() => new Promise((r) => setTimeout(r, 200)))
          yield* Effect.promise(() => use({ dir: root, events, repo }))
        }),
      ).pipe(Effect.provide(layer)),
    )
  })

describe('with the real file watcher', () => {
  test('sees a new file, a change and a deletion', async () => {
    await session(async ({ dir, events, repo }) => {
      const file = join(dir, 'netherite', 'docs', 'DOC-00010-live.md')

      await writeFile(file, doc('DOC-00010', 'Live'))
      await until(() => repo.index.findById('DOC-00010').length === 1)

      await writeFile(file, doc('DOC-00010', 'Live edited', 'Now with text.'))
      await until(() => repo.index.get('netherite/docs/DOC-00010-live.md')?.title === 'Live edited')

      await rm(file)
      await until(() => repo.index.findById('DOC-00010').length === 0)

      const kinds = events.map((e) =>
        e._tag === 'ItemsChanged' ? (e.removed.length > 0 ? 'removed' : 'upserted') : e._tag,
      )
      expect(kinds[0]).toBe('upserted')
      expect(kinds.at(-1)).toBe('removed')
    })
  })

  test('sees a rename as a removal and an addition', async () => {
    await session(async ({ dir, repo }) => {
      const from = join(dir, 'netherite', 'docs', 'DOC-00002-orphan-notes.md')
      const to = join(dir, 'netherite', 'docs', 'DOC-00002-renamed.md')
      await rename(from, to)
      await until(() => repo.index.get('netherite/docs/DOC-00002-renamed.md') !== undefined)
      expect(repo.index.get('netherite/docs/DOC-00002-orphan-notes.md')).toBeUndefined()
      expect(repo.index.findById('DOC-00002')).toHaveLength(1)
    })
  })

  test('a burst of files, like a branch switch, ends with every file indexed', async () => {
    await session(async ({ dir, repo, events }) => {
      const folder = join(dir, 'netherite', 'docs')
      await Promise.all(
        Array.from({ length: 60 }, (_, i) => {
          const id = `DOC-${String(100 + i).padStart(5, '0')}`
          return writeFile(join(folder, `${id}-burst.md`), doc(id, `Burst ${i}`))
        }),
      )
      await until(() => repo.index.size() === 17 + 60)
      // Debouncing turned the burst into a few batches, not one event per file.
      expect(events.length).toBeLessThan(20)
    })
  })

  test('a folder moved in with files is picked up', async () => {
    await session(async ({ dir, repo }) => {
      const staging = join(dir, 'staging')
      await mkdir(join(staging, 'inner'), { recursive: true })
      await writeFile(join(staging, 'inner', 'DOC-00200-moved.md'), doc('DOC-00200', 'Moved'))
      await rename(staging, join(dir, 'netherite', 'imported'))
      await until(() => repo.index.findById('DOC-00200').length === 1)
    })
  })

  test('picks up a config change', async () => {
    await session(async ({ dir, repo, events }) => {
      await writeFile(join(dir, '.netherite', 'config.yml'), 'version: 1\nid_padding: 3\n')
      await until(() => repo.workspace.config.id_padding === 3)
      expect(events.some((e) => e._tag === 'ConfigChanged')).toBe(true)
    })
  })

  test('does not report its own repo operations again', async () => {
    await session(async ({ repo, events }) => {
      await Effect.runPromise(
        createItem(repo, { type: 'doc', title: 'By operation' }).pipe(Effect.provide(layer)),
      )
      await new Promise((r) => setTimeout(r, 600))
      expect(events).toEqual([])
      expect(repo.index.findById('DOC-00004')).toHaveLength(1)
    })
  })

  test('editing files outside the content folder is ignored', async () => {
    await session(async ({ dir, events }) => {
      await writeFile(join(dir, 'src', 'app.ts'), 'export const changed = true\n')
      await writeFile(join(dir, 'README.md'), '# not an item\n')
      await new Promise((r) => setTimeout(r, 500))
      expect(events).toEqual([])
    })
  })
})
