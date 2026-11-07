import { type FieldIssue, ItemType, ValidationError } from '@netherite/schema'
import { Clock, Effect, FileSystem, Path } from 'effect'
import { classifySource, normalizeSource } from '../../source'
import { rewriteLinks } from '../import-links'
import { createItem, readSource, replaceSource, updateFields } from '../operations'
import type { Repo } from '../repo'
import type { EntryResult, ImportOptions, ImportReport } from './import.types'
import { isObject, parseEntry } from './parseEntry'
import {
  frontmatterOf,
  splitSource,
  titleFromFile,
  withoutManagedBlocks,
  withoutNumber,
} from './splitSource'

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
          : entry.type === ItemType.Adr
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
        const updated =
          options.dryRun === true
            ? undefined
            : yield* Effect.result(
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
        if (updated?._tag === 'Failure') {
          const d = describe(updated.failure)
          results.push(failed(number, source, d.reason, d.issues))
          continue
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
