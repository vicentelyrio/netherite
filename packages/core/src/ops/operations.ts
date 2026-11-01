import { outlineMarkdown } from '@netherite/markdown'
import { checkItem, type FieldIssue, type ItemType, ValidationError } from '@netherite/schema'
import { Clock, Effect, type FileSystem, type Path } from 'effect'
import {
  appendSection as appendSectionEdit,
  appendToList,
  appendToSection as appendToSectionEdit,
  type CheckSelector,
  type Json,
  removeFromList,
  renderFrontmatter,
  replaceSection as replaceSectionEdit,
  setField,
  toggleCheck as toggleCheckEdit,
  unsetField,
} from '../edit'
import {
  type AlreadyExists,
  AmbiguousId,
  ConflictError,
  type EditError,
  type IoError,
  NotFound,
  StillLinked,
} from '../errors'
import { itemRelativePath } from '../filenames'
import { nextId } from '../ids'
import { type ScannedItem, toScannedItem } from '../scanned-item'
import { type EdgeKind, extractRefs } from '../workspace-index'
import { contentHash } from './hash'
import { applyChanges, type Change, readText } from './io'
import type { Repo } from './repo'

export type OpError =
  | ValidationError
  | EditError
  | ConflictError
  | NotFound
  | AmbiguousId
  | AlreadyExists
  | StillLinked
  | IoError

export type OpEnv = FileSystem.FileSystem | Path.Path

export interface OpOptions {
  /**
   * Hash of the file the caller read (from a previous result or `contentHash`). If the file has
   * changed since, the operation fails with `ConflictError` instead of overwriting.
   */
  readonly baseHash?: string
}

export interface OpResult {
  /** The item the operation was about. */
  readonly id: string
  readonly path: string
  readonly item: ScannedItem
  /** Hash of the item's file now; pass it as `baseHash` to the next operation. */
  readonly hash: string
  /** Every file the operation wrote, created or deleted. */
  readonly changed: ReadonlyArray<string>
  /** `true` when the file already was as requested and nothing was written. */
  readonly unchanged: boolean
}

type Op<A = OpResult> = Effect.Effect<A, OpError, OpEnv>

const invalid = (path: ReadonlyArray<string | number>, message: string) =>
  new ValidationError({ issues: [{ path, message }] })

// ---------------------------------------------------------------------------------------------
// Shared steps

const locate = (repo: Repo, id: string): Effect.Effect<ScannedItem, NotFound | AmbiguousId> => {
  const found = repo.index.findById(id)
  if (found.length === 0) return Effect.fail(new NotFound({ id }))
  const [only] = found
  if (found.length > 1 || only === undefined) {
    return Effect.fail(new AmbiguousId({ id, paths: found.map((i) => i.path) }))
  }
  return Effect.succeed(only)
}

const data = (source: string): Record<string, unknown> | undefined => {
  const value = outlineMarkdown(source).frontmatter?.data
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const isoDateTime = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')

const key = (issue: FieldIssue) => `${issue.path.join('.')}\u0000${issue.message}`

/** Everything wrong with an item's frontmatter: schema problems, aliases, broken references. */
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

/** Fails if the new text has a problem the old text did not have. */
const validate = (
  repo: Repo,
  path: string,
  before: string | null,
  after: string,
): Effect.Effect<void, ValidationError> => {
  const existing = new Set((before === null ? [] : problems(repo, path, before)).map(key))
  const added = problems(repo, path, after).filter((issue) => !existing.has(key(issue)))
  return added.length === 0 ? Effect.void : Effect.fail(new ValidationError({ issues: added }))
}

const done = (
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

interface Step {
  readonly id: string
  readonly baseHash?: string | undefined
  readonly edit: (
    source: string,
    item: ScannedItem,
  ) => Effect.Effect<string, EditError | ValidationError>
}

/**
 * Edits one or more existing items as a unit: reads each from disk, applies its edit, checks the
 * result is not worse than before, and writes them all or none.
 */
const mutate = (repo: Repo, steps: ReadonlyArray<Step>): Op =>
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

/** Removes a value from a list field, and drops the field when that leaves it empty. */
const removeAndPrune = (source: string, field: string, value: string) =>
  Effect.flatMap(removeFromList(source, field, value), (next) => {
    const list = data(next)?.[field]
    return Array.isArray(list) && list.length === 0 ? unsetField(next, field) : Effect.succeed(next)
  })

const fold = <E>(
  source: string,
  edits: ReadonlyArray<(text: string) => Effect.Effect<string, E>>,
): Effect.Effect<string, E> =>
  Effect.gen(function* () {
    let text = source
    for (const edit of edits) text = yield* edit(text)
    return text
  })

// ---------------------------------------------------------------------------------------------
// createItem

export interface CreateInput {
  readonly type: ItemType
  readonly title: string
  /** Fields beyond the title, such as `project` for a task. Defaults are filled in. */
  readonly fields?: Readonly<Record<string, Json>>
  /** Text after the title heading. An ADR gets Context, Decision and Consequences by default. */
  readonly body?: string
  /** A git identity such as `@ada`, recorded as `created_by`. */
  readonly createdBy?: string
}

const reserved = ['id', 'type', 'aliases', 'title', 'created']

const adrTemplate = '## Context\n\n## Decision\n\n## Consequences'

/**
 * Creates a new item with the next free ID, in its type's folder. The result is validated as a
 * whole first, including that every item it points at exists.
 */
export const createItem = (repo: Repo, input: CreateInput): Op =>
  Effect.gen(function* () {
    const bad = Object.keys(input.fields ?? {}).filter((f) => reserved.includes(f))
    if (bad.length > 0) {
      return yield* new ValidationError({
        issues: bad.map((field) => ({
          path: [field],
          message: 'Is set by createItem and cannot be given',
        })),
      })
    }
    const now = yield* Clock.currentTimeMillis
    const id = nextId(repo.index.items(), input.type, repo.workspace.config.id_padding)

    const firstTodo = repo.workspace.config.states.find((s) => s.category === 'todo')
    const defaults: Record<string, Json> = {
      goal: { status: 'active' },
      project: { status: 'active' },
      task: { state: (firstTodo ?? repo.workspace.config.states[0])?.name ?? 'backlog' },
      adr: {
        status: 'proposed',
        date: isoDate(now),
        ...(input.createdBy === undefined ? {} : { deciders: [input.createdBy] }),
      },
      doc: {},
      context: {},
      runbook: {},
    }[input.type] as Record<string, Json>

    const all: Record<string, Json> = {
      id,
      aliases: [id],
      type: input.type,
      title: input.title,
      ...defaults,
      ...(input.fields ?? {}),
      created: isoDateTime(now),
      ...(input.createdBy === undefined ? {} : { created_by: input.createdBy }),
    }
    const order = repo.fieldOrder[input.type]
    const rank = (k: string) => (order.includes(k) ? order.indexOf(k) : order.length)
    const fields = Object.entries(all).sort(([a], [b]) => rank(a) - rank(b))

    const body = input.body ?? (input.type === 'adr' ? adrTemplate : '')
    const text = `${renderFrontmatter(fields)}\n# ${input.title}\n${body === '' ? '' : `\n${body.trim()}\n`}`
    const path = `${repo.contentRoot}/${itemRelativePath(id, input.title)}`

    yield* validate(repo, path, null, text)
    yield* applyChanges(repo, [{ path, content: text, before: null }])
    return done(repo, path, [path], false)
  })

// ---------------------------------------------------------------------------------------------
// updateFields, sections, checklist

export interface FieldPatch {
  readonly set?: Readonly<Record<string, Json>>
  readonly unset?: ReadonlyArray<string>
}

const immutable = ['id', 'type']

/** Sets and removes frontmatter fields. `id` and `type` cannot be changed this way. */
export const updateFields = (
  repo: Repo,
  id: string,
  patch: FieldPatch,
  options: OpOptions = {},
): Op => {
  const touched = [...Object.keys(patch.set ?? {}), ...(patch.unset ?? [])]
  const bad = touched.filter((f) => immutable.includes(f))
  if (bad.length > 0) {
    return Effect.fail(
      new ValidationError({
        issues: bad.map((field) => ({
          path: [field],
          message:
            field === 'id'
              ? 'The ID cannot be changed; use renumber'
              : 'The type cannot be changed',
        })),
      }),
    )
  }
  return mutate(repo, [
    {
      id,
      baseHash: options.baseHash,
      edit: (source, item) => {
        const order = repo.fieldOrder[item.type as ItemType] ?? []
        return fold(source, [
          ...Object.entries(patch.set ?? {}).map(
            ([name, value]) =>
              (text: string) =>
                setField(text, name, value, { order }),
          ),
          ...(patch.unset ?? []).map((name) => (text: string) => unsetField(text, name)),
        ])
      },
    },
  ])
}

/** Ticks or unticks one checklist item, by its position or its text. */
export const toggleChecklistItem = (
  repo: Repo,
  id: string,
  which: CheckSelector,
  checked?: boolean,
  options: OpOptions = {},
): Op =>
  mutate(repo, [
    { id, baseHash: options.baseHash, edit: (source) => toggleCheckEdit(source, which, checked) },
  ])

export interface SectionPatch {
  readonly heading: string
  readonly content: string
  /** `replace` (default) swaps the section's text; `append` adds to it; `create` adds a new section. */
  readonly mode?: 'replace' | 'append' | 'create'
  readonly depth?: 1 | 2 | 3 | 4 | 5 | 6
}

/** Changes one section of an item's body. */
export const updateSection = (
  repo: Repo,
  id: string,
  patch: SectionPatch,
  options: OpOptions = {},
): Op =>
  mutate(repo, [
    {
      id,
      baseHash: options.baseHash,
      edit: (source) =>
        patch.mode === 'create'
          ? appendSectionEdit(
              source,
              patch.heading,
              patch.content,
              patch.depth ? { depth: patch.depth } : {},
            )
          : patch.mode === 'append'
            ? appendToSectionEdit(source, patch.heading, patch.content)
            : replaceSectionEdit(source, patch.heading, patch.content),
    },
  ])

/** Sets `reviewed_at` on a doc, runbook or context item. Defaults to today. */
export const markReviewed = (
  repo: Repo,
  id: string,
  options: OpOptions & { readonly date?: string } = {},
): Op =>
  Effect.gen(function* () {
    const item = yield* locate(repo, id)
    if (!['doc', 'runbook', 'context'].includes(item.type ?? '')) {
      return yield* invalid(
        ['type'],
        `A ${item.type ?? 'item'} has no review date; only docs, runbooks and context do`,
      )
    }
    const now = yield* Clock.currentTimeMillis
    return yield* updateFields(
      repo,
      id,
      { set: { reviewed_at: options.date ?? isoDate(now) } },
      options,
    )
  })

// ---------------------------------------------------------------------------------------------
// States and supersession

const adrOrFail = (item: ScannedItem) =>
  item.type === 'adr'
    ? Effect.succeed(item)
    : Effect.fail(invalid(['type'], `${item.id} is not an ADR`))

/** Marks `old` as superseded by `by`, and records that `by` supersedes `old`: both files change. */
export const supersede = (
  repo: Repo,
  input: { readonly old: string; readonly by: string },
  options: OpOptions = {},
): Op =>
  Effect.gen(function* () {
    if (input.old === input.by)
      return yield* invalid(['superseded_by'], 'An ADR cannot supersede itself')
    yield* adrOrFail(yield* locate(repo, input.old))
    yield* adrOrFail(yield* locate(repo, input.by))
    return yield* mutate(repo, [
      {
        id: input.old,
        baseHash: options.baseHash,
        edit: (source) =>
          fold(source, [
            (t) => setField(t, 'status', 'superseded', { order: repo.fieldOrder.adr }),
            (t) => setField(t, 'superseded_by', input.by, { order: repo.fieldOrder.adr }),
          ]),
      },
      {
        id: input.by,
        edit: (source) =>
          appendToList(source, 'supersedes', input.old, { order: repo.fieldOrder.adr }),
      },
    ])
  })

/** Undoes `supersede`: the old ADR gets a new status, and the newer one stops listing it. */
const restore = (repo: Repo, oldId: string, status: string, options: OpOptions): Op =>
  Effect.gen(function* () {
    const item = yield* locate(repo, oldId)
    const by = data(yield* readText(repo, item.path))?.superseded_by
    const steps: Step[] = [
      {
        id: oldId,
        baseHash: options.baseHash,
        edit: (source) =>
          fold(source, [
            (t) => setField(t, 'status', status, { order: repo.fieldOrder.adr }),
            (t) => unsetField(t, 'superseded_by'),
          ]),
      },
    ]
    if (typeof by === 'string' && repo.index.findById(by).length === 1) {
      steps.push({ id: by, edit: (source) => removeAndPrune(source, 'supersedes', oldId) })
    }
    return yield* mutate(repo, steps)
  })

/**
 * Sets a task's state, or an ADR's status. Making an ADR `superseded` needs `supersededBy`, and
 * updates both ADRs. Moving an ADR out of `superseded` clears that link on both.
 */
export const setState = (
  repo: Repo,
  id: string,
  value: string,
  options: OpOptions & { readonly supersededBy?: string } = {},
): Op =>
  Effect.gen(function* () {
    const item = yield* locate(repo, id)
    if (item.type === 'task') {
      return yield* updateFields(repo, id, { set: { state: value } }, options)
    }
    if (item.type !== 'adr') {
      return yield* invalid(['state'], 'Only tasks have a state and ADRs a status')
    }
    const current = data(yield* readText(repo, item.path))?.status
    if (value === 'superseded') {
      if (options.supersededBy === undefined) {
        return yield* invalid(
          ['superseded_by'],
          'Required when the status is superseded: say which ADR replaces this one',
        )
      }
      return yield* supersede(repo, { old: id, by: options.supersededBy }, options)
    }
    if (current === 'superseded') return yield* restore(repo, id, value, options)
    return yield* updateFields(repo, id, { set: { status: value } }, options)
  })

// ---------------------------------------------------------------------------------------------
// Relationships

interface Relation {
  readonly field: string
  readonly many: boolean
}

const relations: Partial<Record<ItemType, Partial<Record<EdgeKind, Relation>>>> = {
  task: {
    belongs_to: { field: 'project', many: false },
    implements: { field: 'decisions', many: true },
    depends_on: { field: 'depends_on', many: true },
    related: { field: 'related', many: true },
  },
  project: {
    belongs_to: { field: 'goals', many: true },
    implements: { field: 'decisions', many: true },
  },
  adr: { belongs_to: { field: 'project', many: false } },
  doc: { explains: { field: 'explains', many: true } },
  runbook: { explains: { field: 'explains', many: true } },
  context: { explains: { field: 'explains', many: true } },
}

export interface LinkInput {
  readonly from: string
  readonly to: string
  readonly kind: EdgeKind
}

const relationFor = (repo: Repo, input: LinkInput) =>
  Effect.gen(function* () {
    const from = yield* locate(repo, input.from)
    yield* locate(repo, input.to)
    const relation = relations[from.type as ItemType]?.[input.kind]
    if (relation === undefined) {
      return yield* invalid(
        [input.kind],
        `A ${from.type ?? 'item'} cannot have a "${input.kind}" relationship${input.kind === 'reference' ? '; write a [[link]] in its text instead' : ''}`,
      )
    }
    return relation
  })

/**
 * Adds a typed relationship from one item to another by editing the right field. `supersedes`
 * updates both ADRs. A single-valued field such as a task's `project` is replaced.
 */
export const link = (repo: Repo, input: LinkInput, options: OpOptions = {}): Op =>
  Effect.gen(function* () {
    if (input.kind === 'supersedes') {
      return yield* supersede(repo, { old: input.to, by: input.from }, options)
    }
    const relation = yield* relationFor(repo, input)
    return yield* mutate(repo, [
      {
        id: input.from,
        baseHash: options.baseHash,
        edit: (source, item) => {
          const order = repo.fieldOrder[item.type as ItemType]
          return relation.many
            ? appendToList(source, relation.field, input.to, { order })
            : setField(source, relation.field, input.to, { order })
        },
      },
    ])
  })

/** Removes a typed relationship. Removing a required one, such as a task's project, is refused. */
export const unlink = (repo: Repo, input: LinkInput, options: OpOptions = {}): Op =>
  Effect.gen(function* () {
    if (input.kind === 'supersedes') {
      const older = yield* locate(repo, input.to)
      const status = data(yield* readText(repo, older.path))?.status
      return status === 'superseded'
        ? yield* restore(repo, input.to, 'accepted', options)
        : yield* mutate(repo, [
            {
              id: input.from,
              baseHash: options.baseHash,
              edit: (s) => removeAndPrune(s, 'supersedes', input.to),
            },
          ])
    }
    const relation = yield* relationFor(repo, input)
    return yield* mutate(repo, [
      {
        id: input.from,
        baseHash: options.baseHash,
        edit: (source) =>
          relation.many
            ? removeAndPrune(source, relation.field, input.to)
            : unsetField(source, relation.field),
      },
    ])
  })

// ---------------------------------------------------------------------------------------------
// deleteItem

/** Deletes an item's file. Refuses while other items link to it, unless `force` is set. */
export const deleteItem = (
  repo: Repo,
  id: string,
  options: OpOptions & { readonly force?: boolean } = {},
): Effect.Effect<{ readonly id: string; readonly path: string }, OpError, OpEnv> =>
  Effect.gen(function* () {
    const item = yield* locate(repo, id)
    const referrers = repo.index
      .incoming(item.path)
      .filter((edge) => edge.from !== item.path)
      .map((edge) => ({ path: edge.from, kind: edge.kind }))
    if (referrers.length > 0 && options.force !== true) {
      return yield* new StillLinked({ id, referrers })
    }
    const source = yield* readText(repo, item.path)
    if (options.baseHash !== undefined && contentHash(source) !== options.baseHash) {
      return yield* new ConflictError({
        path: item.path,
        expected: options.baseHash,
        actual: contentHash(source),
      })
    }
    yield* applyChanges(repo, [{ path: item.path, content: null, before: source }])
    return { id, path: item.path }
  })
