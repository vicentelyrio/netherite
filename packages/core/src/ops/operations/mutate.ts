import { outlineMarkdown } from '@netherite/markdown'
import { checkItem, type FieldIssue, ValidationError } from '@netherite/schema'
import { Effect } from 'effect'
import { removeFromList, unsetField } from '../../edit'
import { AmbiguousId, ConflictError, NotFound } from '../../errors'
import { type ScannedItem, toScannedItem } from '../../scanned-item'
import { extractRefs } from '../../workspace-index'
import { contentHash } from '../hash'
import { applyChanges, type Change, readText } from '../io'
import type { Repo } from '../repo'
import type { Op, OpResult, Step } from './operations.types'

export const invalid = (path: ReadonlyArray<string | number>, message: string) =>
  new ValidationError({ issues: [{ path, message }] })

export const locate = (
  repo: Repo,
  id: string,
): Effect.Effect<ScannedItem, NotFound | AmbiguousId> => {
  const found = repo.index.findById(id)
  if (found.length === 0) return Effect.fail(new NotFound({ id }))
  const [only] = found
  if (found.length > 1 || only === undefined) {
    return Effect.fail(new AmbiguousId({ id, paths: found.map((i) => i.path) }))
  }
  return Effect.succeed(only)
}

export const data = (source: string): Record<string, unknown> | undefined => {
  const value = outlineMarkdown(source).frontmatter?.data
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export const isoDateTime = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')

export const key = (issue: FieldIssue, source: string) => {
  const field = issue.path[0]
  const value = typeof field === 'string' ? data(source)?.[field] : undefined
  return `${issue.path.join('.')}\u0000${issue.message}\u0000${JSON.stringify(value)}`
}

const problems = (repo: Repo, path: string, source: string): FieldIssue[] => {
  const item = toScannedItem(path, source)
  const fm = item.parsed.frontmatter
  if (fm === undefined || fm.errors.length > 0) {
    return [{ path: [], message: 'The frontmatter is missing or is not valid YAML' }]
  }
  const found: FieldIssue[] = [...checkItem(repo.schemas)(fm.data)]
  const aliases = data(source)?.aliases
  if (item.id !== undefined && Array.isArray(aliases) && !aliases.includes(item.id)) {
    found.push({ path: ['aliases'], message: `Must include the ID ${item.id}` })
  }
  for (const ref of extractRefs(item)) {
    if (ref.field === 'body') continue
    const resolution = repo.index.resolver.resolve(ref.target, ref.heading)
    if (resolution.status === 'broken') {
      found.push({ path: [ref.field], message: `${ref.target} does not match any item` })
    } else if (resolution.status === 'ambiguous') {
      found.push({ path: [ref.field], message: `${ref.target} matches several items` })
    }
  }
  return found
}

export const validate = (
  repo: Repo,
  path: string,
  before: string | null,
  after: string,
): Effect.Effect<void, ValidationError> => {
  const existing = new Set(
    (before === null ? [] : problems(repo, path, before)).map((issue) => key(issue, before ?? '')),
  )
  const added = problems(repo, path, after).filter((issue) => !existing.has(key(issue, after)))
  return added.length === 0 ? Effect.void : Effect.fail(new ValidationError({ issues: added }))
}

export const done = (
  repo: Repo,
  primary: string,
  changed: ReadonlyArray<string>,
  unchanged: boolean,
): OpResult => {
  const item = repo.index.get(primary) as ScannedItem
  return {
    id: item.id ?? '',
    path: primary,
    item,
    hash: contentHash(item.parsed.source),
    changed,
    unchanged,
  }
}

export const mutate = (repo: Repo, steps: ReadonlyArray<Step>): Op =>
  Effect.gen(function* () {
    const changes: Change[] = []
    let primary = ''
    for (const [i, step] of steps.entries()) {
      const item = yield* locate(repo, step.id)
      const source = yield* readText(repo, item.path)
      if (step.baseHash !== undefined && contentHash(source) !== step.baseHash) {
        return yield* new ConflictError({
          path: item.path,
          expected: step.baseHash,
          actual: contentHash(source),
        })
      }
      if (i === 0) primary = item.path
      const next = yield* step.edit(source, item)
      if (next === source) continue
      yield* validate(repo, item.path, source, next)
      changes.push({ path: item.path, content: next, before: source })
    }
    if (primary === '') return yield* new NotFound({ id: steps[0]?.id ?? '' })
    yield* applyChanges(repo, changes)
    return done(
      repo,
      primary,
      changes.map((c) => c.path),
      changes.length === 0,
    )
  })

export const removeAndPrune = (source: string, field: string, value: string) =>
  Effect.flatMap(removeFromList(source, field, value), (next) => {
    const list = data(next)?.[field]
    return Array.isArray(list) && list.length === 0 ? unsetField(next, field) : Effect.succeed(next)
  })

export const fold = <E>(
  source: string,
  edits: ReadonlyArray<(text: string) => Effect.Effect<string, E>>,
): Effect.Effect<string, E> =>
  Effect.gen(function* () {
    let text = source
    for (const edit of edits) text = yield* edit(text)
    return text
  })
