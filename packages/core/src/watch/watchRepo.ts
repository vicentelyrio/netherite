import { settingDefaults } from '@netherite/schema'
import { Effect, FileSystem, Path, PubSub, Stream as S } from 'effect'
import { ConfigReadError } from '../errors'
import type { Repo } from '../ops/repo'
import { parseFiles } from '../parse-pool'
import { inReservedFolder } from '../reserved'
import type { ScannedItem } from '../scanned-item'
import { parseConfig } from '../workspace'
import { asPosix, configIgnore, contentIgnore, gitIgnore, gitRelevant, notHidden } from './ignores'
import { parcelBackend } from './parcelBackend'
import {
  type ChangeEvent,
  type RawEvent,
  WatchError,
  type Watcher,
  type WatchOptions,
} from './watch.types'

export const watchRepo = (repo: Repo, options: WatchOptions = {}) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const context = yield* Effect.context<FileSystem.FileSystem | Path.Path>()
    const run = Effect.runPromiseWith(context)
    const backend = options.backend ?? parcelBackend
    const debounce = options.debounceMs ?? settingDefaults.watch.debounceMs

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
      return notHidden(inside) && !inReservedFolder(inside)
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
          const info = yield* fs.stat(absolute).pipe(Effect.option)
          if (info._tag === 'Some' && info.value.type === 'Directory') {
            for (const file of yield* markdownUnder(absolute)) candidates.add(file)
          } else if (info._tag === 'None') {
            for (const known of repo.index.paths())
              if (known.startsWith(`${relative}/`)) gone.add(known)
          }
        }

        const sources: Array<{ path: string; source: string }> = []
        for (const relative of [...candidates].sort()) {
          const read = yield* fs.readFileString(path.join(root, relative)).pipe(Effect.option)
          if (read._tag === 'None') {
            if (repo.index.get(relative) !== undefined) gone.add(relative)
            continue
          }
          if (repo.index.get(relative)?.parsed.source === read.value) continue
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
