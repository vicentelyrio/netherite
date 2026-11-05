import { outlineMarkdown } from '@netherite/markdown'
import { type FieldIssue, type ItemType, ValidationError } from '@netherite/schema'
import { Clock, Effect, FileSystem, Path } from 'effect'
import type { Json } from '../edit'
import { classifySource, normalizeSource } from '../source'
import { rewriteLinks } from './import-links'
import { createItem, readSource, replaceSource, updateFields } from './operations'
import type { Repo } from './repo'

/** The types an import brings in: what a repository already has written down. */
export const importTypes = ['doc', 'runbook', 'context', 'adr'] as const
export type ImportType = (typeof importTypes)[number]

/** One candidate of a batch, as the agent and the person settled it. */
export interface ImportEntry {
  /** A file of the repository, as a path from its root, or a URL. The item records it. */
  readonly source: string
  readonly type: ImportType
  /** Default: the first heading of the source, else its file name. */
  readonly title?: string
  /** Keep an existing number, such as `ADR-00004`. Default: the next free one. */
  readonly id?: string
  /** Fields beyond the title, such as `covers` or an ADR's `status`. */
  readonly fields?: Readonly<Record<string, Json>>
  /** The text, when the source is not a file to read or the agent rewrote it. */
  readonly body?: string
  /** `copy` leaves the original alone; `move` removes it once the item is written. */
  readonly mode: 'copy' | 'move'
}

export interface ImportOptions {
  /** Bring an already imported item up to date with its source, instead of skipping it. */
  readonly update?: boolean
  /** Report what would happen; write nothing. */
  readonly dryRun?: boolean
  /** With `mode: move`, leave a one-line note where the original was. */
  readonly stub?: boolean
  /** A git identity such as `@ada`, recorded as `created_by`. */
  readonly createdBy?: string
  /** The `mode` of entries that do not say. Default `copy`. */
  readonly mode?: 'copy' | 'move'
}

export type EntryStatus = 'created' | 'updated' | 'skipped' | 'failed'

export interface EntryResult {
  /** The entry's place in the batch, from 1. */
  readonly entry: number
  readonly source: string | undefined
  readonly status: EntryStatus
  readonly id?: string
  /** The item's path, relative to the repository root. */
  readonly path?: string
  /** Why it was skipped or failed. */
  readonly reason?: string
  /** What the schema did not like, when that is why it failed. */
  readonly issues?: ReadonlyArray<FieldIssue>
  /** What happened to the original of a `move`. */
  readonly original?: 'removed' | 'stub' | 'kept'
}

export interface ImportReport {
  readonly dryRun: boolean
  readonly results: ReadonlyArray<EntryResult>
  readonly counts: Readonly<Record<EntryStatus, number>>
  /** Links between imported files that were rewritten as links between items. */
  readonly relinked: { readonly items: number; readonly links: number }
}

const reserved = ['id', 'type', 'aliases', 'title', 'created', 'source', 'imported_at']

type Parsed = { readonly entry: ImportEntry } | { readonly problem: string }

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseEntry = (raw: unknown, defaultMode: 'copy' | 'move'): Parsed => {
  if (!isObject(raw)) return { problem: 'An entry is an object with a source and a type' }
  const { source, type, title, id, fields, body, mode } = raw
  if (typeof source !== 'string' || source.trim() === '') {
    return { problem: '`source` is a path in the repository or a URL' }
  }
  if (typeof type !== 'string' || !(importTypes as ReadonlyArray<string>).includes(type)) {
    return { problem: `\`type\` is one of ${importTypes.join(', ')}` }
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return { problem: '`title` is a non-empty string' }
  }
  if (id !== undefined && typeof id !== 'string') return { problem: '`id` is a string' }
  if (body !== undefined && typeof body !== 'string') return { problem: '`body` is a string' }
  if (mode !== undefined && mode !== 'copy' && mode !== 'move') {
    return { problem: '`mode` is copy or move' }
  }
  if (fields !== undefined && !isObject(fields)) return { problem: '`fields` is an object' }
  const clash = Object.keys(fields ?? {}).filter((f) => reserved.includes(f))
  if (clash.length > 0) {
    return { problem: `${clash.map((f) => `\`${f}\``).join(', ')} are set by the import itself` }
  }
  return {
    entry: {
      source: source.trim(),
      type: type as ImportType,
      ...(title === undefined ? {} : { title: (title as string).trim() }),
      ...(id === undefined ? {} : { id: id as string }),
      ...(fields === undefined ? {} : { fields: fields as Record<string, Json> }),
      ...(body === undefined ? {} : { body: body as string }),
      mode: (mode as 'copy' | 'move' | undefined) ?? defaultMode,
    },
  }
}

/**
 * Text that Netherite wrote into a file itself, between `<!-- netherite:...:start -->` and
 * `<!-- netherite:...:end -->`, such as the context block in `CLAUDE.md`. It is not the file's own
 * writing, and `context sync` puts it back, so an import leaves it out.
 */
export const withoutManagedBlocks = (text: string): string =>
  text.replace(
    /<!-- netherite:[a-z-]+:start -->[\s\S]*?<!-- netherite:[a-z-]+:end -->[ \t]*\r?\n?/gu,
    '',
  )

/** The text of a source without its frontmatter and its first `# ` heading, and that heading. */
export const splitSource = (text: string): { readonly title?: string; readonly body: string } => {
  const end = text.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/)?.[0].length ?? 0
  const rest = text.slice(end)
  const heading = rest.match(/^\s*# (.+?)[ \t]*(?:\r?\n|$)/)
  if (heading === null) return { body: rest.trim() }
  return { title: heading[1] as string, body: rest.slice(heading[0].length).trim() }
}

/** A decision record's number in front of its title: `0062 — Use X`, `3. Use X`, `ADR-7: Use X`. */
const withoutNumber = (title: string) => {
  const rest = title.replace(/^(?:adr[-_ ]*)?\d+\s*[.:—–)-]\s*/iu, '').trim()
  return rest === '' ? title : rest
}

/** A title from a file name: `old-setup_guide.md` gives `Old setup guide`. */
const titleFromFile = (path: string, type: ImportType) => {
  const base = (path.split('/').pop() ?? path).replace(/\.[^.]*$/u, '').replace(/^\./u, '')
  const name = type === 'adr' ? base.replace(/^(?:adr[-_ ]*)?\d+[-_ ]+/iu, '') : base
  const words = name.replace(/[-_]+/gu, ' ').trim()
  return words === '' ? path : words.charAt(0).toUpperCase() + words.slice(1)
}

const frontmatterOf = (text: string): Record<string, unknown> => {
  const data = outlineMarkdown(text).frontmatter?.data
  return isObject(data) ? data : {}
}

const failed = (
  entry: number,
  source: string | undefined,
  reason: string,
  issues?: ReadonlyArray<FieldIssue>,
): EntryResult => ({
  entry,
  source,
  status: 'failed',
  reason,
  ...(issues === undefined ? {} : { issues }),
})

const describe = (error: unknown): { reason: string; issues?: ReadonlyArray<FieldIssue> } => {
  if (error instanceof ValidationError) {
    return {
      reason: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      issues: error.issues,
    }
  }
  const message = (error as { message?: unknown } | null)?.message
  return { reason: typeof message === 'string' ? message : String(error) }
}

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/**
 * Applies a batch of accepted candidates (ADR-00026): the agent classified them, this writes
 * them, through the same validated operations as every other write. An item is found again by its
 * `source`, so running a batch twice does not duplicate anything. An entry that fails does not
 * stop the others, and nothing is committed.
 */
export const importBatch = (
  repo: Repo,
  rawEntries: ReadonlyArray<unknown>,
  options: ImportOptions = {},
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const now = yield* Clock.currentTimeMillis
    const today = isoDate(now)
    const results: EntryResult[] = []
    const root = repo.workspace.root

    const existingFor = (source: string) =>
      repo.index.items().find((item) => {
        const data = item.parsed.frontmatter?.data
        const recorded = isObject(data) ? data.source : undefined
        return typeof recorded === 'string' && normalizeSource(recorded) === source
      })

    for (const [i, raw] of rawEntries.entries()) {
      const number = i + 1
      const parsed = parseEntry(raw, options.mode ?? 'copy')
      if ('problem' in parsed) {
        const source = isObject(raw) && typeof raw.source === 'string' ? raw.source : undefined
        results.push(failed(number, source, parsed.problem))
        continue
      }
      const { entry } = parsed
      const where = classifySource(entry.source)
      if (where.kind === 'outside') {
        results.push(
          failed(
            number,
            entry.source,
            'The source must be a path from the repository root, without `..`, or a URL',
          ),
        )
        continue
      }
      const source = where.kind === 'path' ? where.path : where.url
      if (where.kind === 'url' && entry.mode === 'move') {
        results.push(failed(number, source, 'A URL cannot be moved; use copy'))
        continue
      }
      if (where.kind === 'url' && entry.body === undefined) {
        results.push(failed(number, source, 'A URL needs a `body`: it is not read from there'))
        continue
      }

      let text: string | undefined
      if (where.kind === 'path') {
        const file = path.join(root, where.path)
        const read = yield* Effect.result(fs.readFileString(file))
        if (read._tag === 'Failure') {
          results.push(failed(number, source, `Cannot read ${where.path}: not found or unreadable`))
          continue
        }
        text = read.success
      }
      const split = splitSource(withoutManagedBlocks(entry.body ?? text ?? ''))
      const title =
        entry.title ??
        (split.title === undefined
          ? undefined
          : entry.type === 'adr'
            ? withoutNumber(split.title)
            : split.title) ??
        (where.kind === 'path' ? titleFromFile(where.path, entry.type) : source)
      const body = split.body

      const existing = existingFor(source)
      if (existing !== undefined) {
        const id = existing.id as string
        if (options.update !== true) {
          results.push({
            entry: number,
            source,
            status: 'skipped',
            id,
            path: existing.path,
            reason: `Already imported as ${id}; use --update to bring it up to date`,
          })
          continue
        }
        const current = yield* readSource(repo, id).pipe(Effect.result)
        if (current._tag === 'Failure') {
          results.push(failed(number, source, describe(current.failure).reason))
          continue
        }
        const had = splitSource(current.success.text)
        const front = frontmatterOf(current.success.text)
        const sameFields = Object.entries(entry.fields ?? {}).every(
          ([k, v]) => JSON.stringify(front[k]) === JSON.stringify(v),
        )
        if (had.body === body && front.title === title && sameFields) {
          results.push({
            entry: number,
            source,
            status: 'skipped',
            id,
            path: existing.path,
            reason: 'Already up to date',
          })
          continue
        }
        if (options.dryRun !== true) {
          const updated = yield* Effect.result(
            Effect.gen(function* () {
              yield* updateFields(repo, id, {
                set: { title, ...(entry.fields ?? {}), imported_at: today },
              })
              const latest = yield* readSource(repo, id)
              const head =
                latest.text.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/)?.[0] ?? ''
              const rest = splitSource(latest.text)
              const next = `${head}${head.endsWith('\n') ? '' : '\n'}\n# ${title}\n${body === '' ? '' : `\n${body}\n`}`
              if (rest.body !== body) yield* replaceSource(repo, id, next)
            }),
          )
          if (updated._tag === 'Failure') {
            const d = describe(updated.failure)
            results.push(failed(number, source, d.reason, d.issues))
            continue
          }
        }
        results.push({ entry: number, source, status: 'updated', id, path: existing.path })
        continue
      }

      if (options.dryRun === true) {
        if (entry.id !== undefined && repo.index.findById(entry.id).length > 0) {
          results.push(failed(number, source, `${entry.id} is already in use`))
          continue
        }
        results.push({
          entry: number,
          source,
          status: 'created',
          ...(entry.id ? { id: entry.id } : {}),
        })
        continue
      }
      const made = yield* Effect.result(
        createItem(repo, {
          type: entry.type as ItemType,
          title,
          ...(entry.id === undefined ? {} : { id: entry.id }),
          fields: { ...(entry.fields ?? {}), source, imported_at: today },
          body,
          ...(options.createdBy === undefined ? {} : { createdBy: options.createdBy }),
          deciders: [],
        }),
      )
      if (made._tag === 'Failure') {
        const d = describe(made.failure)
        results.push(failed(number, source, d.reason, d.issues))
        continue
      }
      const result: EntryResult = {
        entry: number,
        source,
        status: 'created',
        id: made.success.id,
        path: made.success.path,
      }

      if (entry.mode === 'move' && where.kind === 'path') {
        const file = path.join(root, where.path)
        const moved = yield* Effect.result(
          options.stub === true
            ? fs.writeFileString(file, `Moved to ${made.success.path} (${made.success.id}).\n`)
            : fs.remove(file),
        )
        results.push({
          ...result,
          original: moved._tag === 'Failure' ? 'kept' : options.stub === true ? 'stub' : 'removed',
          ...(moved._tag === 'Failure'
            ? {
                reason: `Imported, but the original could not be ${options.stub ? 'replaced' : 'removed'}`,
              }
            : {}),
        })
        continue
      }
      results.push(result)
    }

    const relinked = { items: 0, links: 0 }
    if (options.dryRun !== true) {
      const ids = new Map<string, string>()
      const imported: Array<{ id: string; from: string }> = []
      for (const item of repo.index.items()) {
        const data = item.parsed.frontmatter?.data
        const recorded = isObject(data) ? data.source : undefined
        if (typeof recorded !== 'string' || item.id === undefined) continue
        const kind = classifySource(recorded)
        if (kind.kind !== 'path') continue
        ids.set(kind.path, item.id)
        imported.push({ id: item.id, from: kind.path })
      }
      for (const { id, from } of imported) {
        const current = yield* Effect.result(readSource(repo, id))
        if (current._tag === 'Failure') continue
        const next = rewriteLinks(current.success.text, from, ids)
        if (next.count === 0 || next.text === current.success.text) continue
        const written = yield* Effect.result(replaceSource(repo, id, next.text))
        if (written._tag === 'Success') {
          relinked.items++
          relinked.links += next.count
        }
      }
    }

    const counts = { created: 0, updated: 0, skipped: 0, failed: 0 }
    for (const r of results) counts[r.status]++
    return { dryRun: options.dryRun === true, results, counts, relinked } satisfies ImportReport
  })
