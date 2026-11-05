import { ValidationError } from '@netherite/schema'
import { Effect, FileSystem, Path } from 'effect'
import { IoError } from './errors'
import type { Repo } from './ops/repo'

/** The captures file, at the workspace root (ADR-00022). */
export const capturesFile = 'inbox.md'

export interface Capture {
  /** The line, without a list marker. */
  readonly text: string
}

const longest = 500

const invalid = (message: string) => new ValidationError({ issues: [{ path: ['text'], message }] })

/** A line as written in the file: one line, no list marker, no surrounding space. */
const clean = (text: string) =>
  text
    .replace(/\s*[\r\n]+\s*/g, ' ')
    .replace(/^\s*[-*]\s+/, '')
    .trim()

const file = (repo: Repo) =>
  Effect.gen(function* () {
    const p = yield* Path.Path
    return p.join(repo.workspace.root, capturesFile)
  })

const read = (repo: Repo) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* file(repo)
    const there = yield* fs.exists(path).pipe(Effect.orElseSucceed(() => false))
    if (!there) return ''
    return yield* fs
      .readFileString(path)
      .pipe(
        Effect.mapError((cause) => new IoError({ path: capturesFile, operation: 'read', cause })),
      )
  })

const write = (repo: Repo, text: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const p = yield* Path.Path
    const path = yield* file(repo)
    const temp = p.join(p.dirname(path), `.${capturesFile}.${crypto.randomUUID()}.tmp`)
    const fail = (operation: string) => (cause: unknown) =>
      new IoError({ path: capturesFile, operation, cause: cause as never })
    yield* fs.writeFileString(temp, text).pipe(Effect.mapError(fail('write')))
    yield* fs.rename(temp, path).pipe(Effect.mapError(fail('replace')))
  })

const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map(clean)
    .filter((l) => l !== '')

/** The captures, oldest first, one per non-empty line. A missing file has none. */
export const readCaptures = (repo: Repo) =>
  Effect.map(read(repo), (text): ReadonlyArray<Capture> => lines(text).map((t) => ({ text: t })))

/** Appends a line at the bottom. */
export const addCapture = (repo: Repo, input: string) =>
  Effect.gen(function* () {
    const text = clean(input)
    if (text === '') return yield* invalid('Write something to capture')
    if (text.length > longest) return yield* invalid(`Keep it under ${longest} characters`)
    const before = yield* read(repo)
    const base = before === '' || before.endsWith('\n') ? before : `${before}\n`
    yield* write(repo, `${base}- ${text}\n`)
    return { text } satisfies Capture
  })

/**
 * Removes the first line that reads `input` (after the same cleaning). Returns whether one was
 * there: a capture archived in another window is already gone, which is not an error.
 */
export const removeCapture = (repo: Repo, input: string) =>
  Effect.gen(function* () {
    const text = clean(input)
    const before = yield* read(repo)
    const rows = before.split(/\r?\n/)
    const at = rows.findIndex((row) => clean(row) === text && text !== '')
    if (at === -1) return false
    rows.splice(at, 1)
    yield* write(repo, rows.join('\n'))
    return true
  })
