import {
  Data,
  Effect,
  FileSystem,
  Path,
  PubSub,
  Stream as S,
  type Scope,
  type Stream,
} from 'effect'
import { type ConfigInvalid, ConfigReadError } from './errors'
import type { Repo } from './ops/repo'
import type { ParseOptions } from './parse-pool'
import { parseFiles } from './parse-pool'
import type { ScannedItem } from './scanned-item'
import { parseConfig } from './workspace'

/** What changed in the workspace on disk, after the index has been brought up to date. */
export type ChangeEvent =
  | {
      readonly _tag: 'ItemsChanged'
      /** Items that were added or whose text changed. */
      readonly upserted: ReadonlyArray<string>
      /** Items whose files are gone. */
      readonly removed: ReadonlyArray<string>
      /**
       * Every item that is different now: the ones above, plus items whose links resolve
       * differently because of them (for example a link that now has a target).
       */
      readonly affected: ReadonlyArray<string>
    }
  | {
      /** The current commit, the branch, the index or a ref changed: `git status` may differ. */
      readonly _tag: 'GitChanged'
    }
  | {
      readonly _tag: 'ConfigChanged'
      /** The `content` folder moved, which needs a restart. Nothing was applied. */
      readonly requiresRestart: boolean
    }
  | {
      readonly _tag: 'ConfigInvalid'
      /** The previous configuration stays in use. */
      readonly error: ConfigInvalid | ConfigReadError
    }

/** The file watcher could not start. */
export class WatchError extends Data.TaggedError('WatchError')<{
  readonly path: string
  readonly cause: unknown
}> {
  override get message() {
    return `Cannot watch ${this.path}: ${this.cause instanceof Error ? this.cause.message : String(this.cause)}`
  }
}

/** A raw file system event. Only the path matters: what to do is decided from the disk. */
export interface RawEvent {
  readonly path: string
}

/** Something that reports file changes under a folder. */
export interface WatchBackend {
  readonly subscribe: (
    dir: string,
    onEvents: (events: ReadonlyArray<RawEvent>) => void,
    options: { readonly ignore: ReadonlyArray<string> },
  ) => Promise<{ readonly unsubscribe: () => Promise<void> }>
}

/** The default backend: `@parcel/watcher` (FSEvents, inotify, ReadDirectoryChangesW). */
export const parcelBackend: WatchBackend = {
  subscribe: async (dir, onEvents, options) => {
    const module = await import('@parcel/watcher')
    const parcel = (module.default ?? module) as typeof import('@parcel/watcher')
    return parcel.subscribe(
      dir,
      (error, events) => {
        if (error === null) onEvents(events.map((event) => ({ path: event.path })))
      },
      { ignore: [...options.ignore] },
    )
  },
}

export interface WatchOptions {
  /** How long to wait after the last event before applying a batch. Default 100 ms. */
  readonly debounceMs?: number
  readonly backend?: WatchBackend
  /** Passed to the parser when a big batch (for example a branch switch) arrives. */
  readonly parse?: ParseOptions
  /**
   * The repository's `.git` folder. When given, changes to `HEAD`, `index` and the refs are
   * reported as `GitChanged`, so views of uncommitted changes and history can refresh.
   */
  readonly gitDir?: string
}

export interface Watcher {
  /** Change events as a stream. Subscribers only see events published after they subscribe. */
  readonly events: Stream.Stream<ChangeEvent>
  /** Calls `listener` for every event, immediately. Returns a function that stops listening. */
  readonly listen: (listener: (event: ChangeEvent) => void) => () => void
  /** Applies pending changes now instead of waiting for the debounce, and waits until done. */
  readonly flush: Effect.Effect<void>
}

const contentIgnore = ['**/.*/**', '**/.*', 'assets/**', '**/node_modules/**']
const configIgnore = ['local/**', '**/*.tmp']
// Inside `.git` only HEAD, the index and the refs matter; objects and logs change on every commit.
const gitIgnore = [
  'objects/**',
  'logs/**',
  'hooks/**',
  'info/**',
  'modules/**',
  '**/*.lock',
  '**/*.tmp',
]

/** Does a path inside the git folder show a change of commit, branch or staged content? */
const gitRelevant = (relative: string) =>
  relative === 'HEAD' ||
  relative === 'index' ||
  relative === 'packed-refs' ||
  relative.startsWith('refs/')

const asPosix = (p: string) => p.split('\\').join('/')

const notHidden = (relative: string) => !relative.split('/').some((part) => part.startsWith('.'))

/**
 * Keeps a repo's index in step with the files on disk, whoever changes them: an editor,
 * Obsidian, an agent, or a `git checkout`. Changes are collected for `debounceMs`, applied in
 * one batch (re-reading each file from disk, so event order does not matter), and reported as
 * typed events. Changes the repo's own operations already made produce no event. Watching stops
 * when the scope closes.
 */
export const watchRepo = (repo: Repo, options: WatchOptions = {}) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const context = yield* Effect.context<FileSystem.FileSystem | Path.Path>()
    const run = Effect.runPromiseWith(context)
    const backend = options.backend ?? parcelBackend
    const debounce = options.debounceMs ?? 100

    const root = repo.workspace.root
    const gitDir = options.gitDir === undefined ? undefined : path.resolve(options.gitDir)
    const contentDir = repo.workspace.contentRoot
    const configDir = path.dirname(repo.workspace.configPath)
    const configRelative = asPosix(path.relative(root, repo.workspace.configPath))

    const pubsub = yield* PubSub.unbounded<ChangeEvent>()
    const listeners = new Set<(event: ChangeEvent) => void>()
    const publish = (event: ChangeEvent) =>
      Effect.sync(() => {
        for (const listener of listeners) listener(event)
      }).pipe(Effect.andThen(PubSub.publish(pubsub, event)), Effect.asVoid)

    const relativeOf = (absolute: string) => asPosix(path.relative(root, absolute))

    // --- applying a batch ---------------------------------------------------------------

    const markdownUnder = (dir: string) =>
      Effect.gen(function* () {
        const entries = yield* fs
          .readDirectory(dir, { recursive: true })
          .pipe(Effect.orElseSucceed(() => [] as string[]))
        return entries
          .map((entry) => path.join(dir, entry))
          .map(relativeOf)
          .filter((relative) => relative.toLowerCase().endsWith('.md') && inContent(relative))
      })

    const contentPrefix = `${repo.contentRoot}/`
    const inContent = (relative: string) => {
      if (!relative.startsWith(contentPrefix)) return false
      const inside = relative.slice(contentPrefix.length)
      return notHidden(inside) && inside.split('/')[0] !== 'assets'
    }

    const reloadConfig = Effect.gen(function* () {
      const file = repo.workspace.configPath
      const text = yield* Effect.result(fs.readFileString(file))
      if (text._tag === 'Failure') {
        return yield* publish({
          _tag: 'ConfigInvalid',
          error: new ConfigReadError({ path: file, cause: text.failure }),
        })
      }
      const parsed = yield* Effect.result(parseConfig(text.success, file))
      if (parsed._tag === 'Failure')
        return yield* publish({ _tag: 'ConfigInvalid', error: parsed.failure })
      const current = repo.workspace.config
      if (JSON.stringify(parsed.success) === JSON.stringify(current)) return
      if (parsed.success.content !== current.content) {
        return yield* publish({ _tag: 'ConfigChanged', requiresRestart: true })
      }
      repo.applyConfig(parsed.success)
      yield* publish({ _tag: 'ConfigChanged', requiresRestart: false })
    })

    const processBatch = (paths: ReadonlyArray<string>) =>
      Effect.gen(function* () {
        let configChanged = false
        let gitChanged = false
        const candidates = new Set<string>()
        const gone = new Set<string>()

        for (const absolute of paths) {
          if (gitDir !== undefined && absolute.startsWith(`${gitDir}${path.sep}`)) {
            if (gitRelevant(asPosix(path.relative(gitDir, absolute)))) gitChanged = true
            continue
          }
          const relative = relativeOf(absolute)
          if (relative === configRelative) {
            configChanged = true
            continue
          }
          if (!inContent(relative)) continue
          if (relative.toLowerCase().endsWith('.md')) {
            candidates.add(relative)
            continue
          }
          // Not a Markdown file: it may be a folder that appeared or disappeared with files in it.
          const info = yield* fs.stat(absolute).pipe(Effect.option)
          if (info._tag === 'Some' && info.value.type === 'Directory') {
            for (const file of yield* markdownUnder(absolute)) candidates.add(file)
          } else if (info._tag === 'None') {
            for (const known of repo.index.paths())
              if (known.startsWith(`${relative}/`)) gone.add(known)
          }
        }

        // Read each candidate. A file that cannot be read is treated as gone.
        const sources: Array<{ path: string; source: string }> = []
        for (const relative of [...candidates].sort()) {
          const read = yield* fs.readFileString(path.join(root, relative)).pipe(Effect.option)
          if (read._tag === 'None') {
            if (repo.index.get(relative) !== undefined) gone.add(relative)
            continue
          }
          if (repo.index.get(relative)?.parsed.source === read.value) continue // nothing new
          sources.push({ path: relative, source: read.value })
        }

        const items: ScannedItem[] = yield* parseFiles(sources, options.parse)
        const upserted: string[] = []
        const removed: string[] = []
        const affected = new Set<string>()
        for (const item of items) {
          upserted.push(item.path)
          for (const changed of repo.index.upsert(item).changed) affected.add(changed)
        }
        for (const removedPath of [...gone].sort()) {
          if (repo.index.get(removedPath) === undefined) continue
          removed.push(removedPath)
          for (const changed of repo.index.remove(removedPath).changed) affected.add(changed)
        }
        if (upserted.length > 0 || removed.length > 0) {
          yield* publish({
            _tag: 'ItemsChanged',
            upserted,
            removed,
            affected: [...affected].sort(),
          })
        }

        if (configChanged) yield* reloadConfig
        if (gitChanged) yield* publish({ _tag: 'GitChanged' })
      })

    // --- collecting events ----------------------------------------------------------------

    const pending = new Set<string>()
    let timer: ReturnType<typeof setTimeout> | undefined
    let working: Promise<void> = Promise.resolve()

    const drain = () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      const batch = [...pending]
      pending.clear()
      if (batch.length === 0) return working
      working = working.then(() =>
        run(processBatch(batch).pipe(Effect.catchCause(() => Effect.void))),
      )
      return working
    }

    const onEvents = (events: ReadonlyArray<RawEvent>) => {
      for (const event of events) pending.add(event.path)
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(() => void drain(), debounce)
    }

    // --- watching ---------------------------------------------------------------------------

    const subscribe = (dir: string, ignore: ReadonlyArray<string>) =>
      Effect.acquireRelease(
        Effect.tryPromise({
          try: () => backend.subscribe(dir, onEvents, { ignore }),
          catch: (cause) => new WatchError({ path: dir, cause }),
        }),
        (subscription) => Effect.promise(() => subscription.unsubscribe()).pipe(Effect.ignore),
      )

    yield* subscribe(contentDir, contentIgnore)
    yield* subscribe(configDir, configIgnore)
    if (
      gitDir !== undefined &&
      (yield* fs.exists(gitDir).pipe(Effect.orElseSucceed(() => false)))
    ) {
      yield* subscribe(gitDir, gitIgnore)
    }
    yield* Effect.addFinalizer(() =>
      Effect.sync(() => {
        if (timer !== undefined) clearTimeout(timer)
        timer = undefined
        pending.clear()
      }),
    )

    const watcher: Watcher = {
      events: S.fromPubSub(pubsub),
      listen: (listener) => {
        listeners.add(listener)
        return () => void listeners.delete(listener)
      },
      flush: Effect.promise(() => drain()),
    }
    return watcher
  })

export type WatchScope = Scope.Scope
