import { Effect, FileSystem, Path, type PlatformError } from 'effect'
import { AlreadyExists, ConflictError, IoError } from '../errors'
import { toScannedItem } from '../scanned-item'
import { contentHash } from './hash'
import type { Repo } from './repo'

export interface Change {
  readonly path: string
  readonly content: string | null
  readonly before: string | null
}

const io = (path: string, operation: string) => (cause: PlatformError.PlatformError) =>
  new IoError({ path, operation, cause })

export const absolute = (repo: Repo, path: string) =>
  Effect.gen(function* () {
    const p = yield* Path.Path
    return p.join(repo.workspace.root, path)
  })

export const readText = (repo: Repo, path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const file = yield* absolute(repo, path)
    return yield* fs.readFileString(file).pipe(Effect.mapError(io(path, 'read')))
  })

const current = (repo: Repo, path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const file = yield* absolute(repo, path)
    const exists = yield* fs.exists(file).pipe(Effect.mapError(io(path, 'check')))
    if (!exists) return null
    return yield* fs.readFileString(file).pipe(Effect.mapError(io(path, 'read')))
  })

export const applyChanges = (repo: Repo, changes: ReadonlyArray<Change>) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const p = yield* Path.Path
    if (changes.length === 0) return

    const staged: Array<{ change: Change; file: string; temp: string | undefined }> = []
    const applied: Array<{ file: string; previous: string | null; path: string }> = []

    const cleanup = Effect.forEach(staged, ({ temp }) =>
      temp === undefined ? Effect.void : fs.remove(temp, { force: true }).pipe(Effect.ignore),
    )

    const run = Effect.gen(function* () {
      for (const change of changes) {
        const file = yield* absolute(repo, change.path)
        if (change.content === null) {
          staged.push({ change, file, temp: undefined })
          continue
        }
        const dir = p.dirname(file)
        yield* fs
          .makeDirectory(dir, { recursive: true })
          .pipe(Effect.mapError(io(change.path, 'create folder for')))
        const temp = p.join(dir, `.${p.basename(file)}.${crypto.randomUUID()}.tmp`)
        staged.push({ change, file, temp })
        yield* fs
          .writeFileString(temp, change.content)
          .pipe(Effect.mapError(io(change.path, 'write')))
      }

      for (const { change } of staged) {
        const now = yield* current(repo, change.path)
        if (change.before === null) {
          if (now !== null) return yield* new AlreadyExists({ path: change.path })
        } else if (now !== change.before) {
          return yield* new ConflictError({
            path: change.path,
            expected: contentHash(change.before),
            actual: now === null ? undefined : contentHash(now),
          })
        }
      }

      for (const { change, file, temp } of staged) {
        const previous = change.before
        const undo = { file, previous, path: change.path }
        if (change.content === null) {
          yield* fs.remove(file).pipe(Effect.mapError(io(change.path, 'delete')))
        } else if (temp !== undefined) {
          yield* fs.rename(temp, file).pipe(Effect.mapError(io(change.path, 'replace')))
        }
        applied.push(undo)
      }
    })

    yield* run.pipe(
      Effect.tapError(() =>
        Effect.forEach(
          [...applied].reverse(),
          ({ file, previous }) =>
            previous === null
              ? fs.remove(file, { force: true }).pipe(Effect.ignore)
              : fs.writeFileString(file, previous).pipe(Effect.ignore),
          { discard: true },
        ),
      ),
      Effect.ensuring(cleanup),
    )

    for (const { content, path } of changes) {
      if (content === null) repo.index.remove(path)
      else repo.index.upsert(toScannedItem(path, content))
    }
  })
