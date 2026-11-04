import { outlineMarkdown } from '@netherite/markdown'
import { checkItem, type FieldIssue, type ItemType, ValidationError } from '@netherite/schema'
import { Clock, Effect, type FileSystem, type Path } from 'effect'
import {
  appendSection as appendSectionEdit,
  appendToList,
  appendToSection as appendToSectionEdit,
  type CheckSelector,
  type CheckTarget,
  type Json,
  removeFromList,
  renderFrontmatter,
  replaceSection as replaceSectionEdit,
  setField,
  toggleChecks as toggleChecksEdit,
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

/**
 * Identifies a problem by its field, its message and the value in the field. The value matters:
 * a field that was invalid and is set to another invalid value has a new problem.
 */
const key = (issue: FieldIssue, source: string) => {
  const field = issue.path[0]
  const value = typeof field === 'string' ? data(source)?.[field] : undefined
  return `${issue.path.join('.')}\u0000${issue.message}\u0000${JSON.stringify(value)}`
}

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
  const existing = new Set(
    (before === null ? [] : problems(repo, path, before)).map((issue) => key(issue, before ?? '')),
  )
  const added = problems(repo, path, after).filter((issue) => !existing.has(key(issue, after)))
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

/** Keeps the first `# ` heading after the frontmatter in step with a new `title`. */
const retitleHeading = (text: string, title: string) => {
  const end = text.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/)?.[0].length ?? 0
  const rest = text.slice(end)
  const heading = /^# .*$/m
  return heading.test(rest) ? text.slice(0, end) + rest.replace(heading, () => `# ${title}`) : text
}

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
        const title = patch.set?.title
        const edited = fold(source, [
          ...Object.entries(patch.set ?? {}).map(
            ([name, value]) =>
              (text: string) =>
                setField(text, name, value, { order }),
          ),
          ...(patch.unset ?? []).map((name) => (text: string) => unsetField(text, name)),
        ])
        return typeof title === 'string'
          ? Effect.map(edited, (text) => retitleHeading(text, title))
          : edited
      },
    },
  ])
}

/**
 * Ticks or unticks checklist items, by position or text: one, several, or `{ all: true }`, in one
 * write with one hash check. With several or all and no `checked`, each item is flipped; the
 * caller that wants "finish them all" says `checked: true`.
 */
export const toggleChecklistItem = (
  repo: Repo,
  id: string,
  which: CheckTarget,
  checked?: boolean,
  options: OpOptions = {},
): Op =>
  mutate(repo, [
    { id, baseHash: options.baseHash, edit: (source) => toggleChecksEdit(source, which, checked) },
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

const knowledgeTypes = ['doc', 'runbook', 'context']

/** The statuses an item type can be given: an ADR's lifecycle, or whether a doc is still current. */
const statusesOf = (type: string | undefined) =>
  type === 'adr'
    ? ['proposed', 'accepted', 'deprecated', 'superseded']
    : knowledgeTypes.includes(type ?? '')
      ? ['active', 'deprecated', 'superseded']
      : []

/** An item is replaced by one of its own type: an ADR by an ADR, a doc by a doc. */
const sameKind = (item: ScannedItem, other: ScannedItem) =>
  item.type === other.type && statusesOf(item.type).includes('superseded')
    ? Effect.succeed(item)
    : Effect.fail(
        invalid(
          ['superseded_by'],
          `${item.id} and ${other.id} must be the same kind of item, an ADR or a doc, runbook or context`,
        ),
      )

/** Marks `old` as superseded by `by`, and records that `by` supersedes `old`: both files change. */
export const supersede = (
  repo: Repo,
  input: { readonly old: string; readonly by: string },
  options: OpOptions = {},
): Op =>
  Effect.gen(function* () {
    if (input.old === input.by)
      return yield* invalid(['superseded_by'], 'An item cannot supersede itself')
    const old = yield* locate(repo, input.old)
    yield* sameKind(old, yield* locate(repo, input.by))
    const order = repo.fieldOrder[old.type as ItemType] ?? []
    return yield* mutate(repo, [
      {
        id: input.old,
        baseHash: options.baseHash,
        edit: (source) =>
          fold(source, [
            (t) => setField(t, 'status', 'superseded', { order }),
            (t) => setField(t, 'superseded_by', input.by, { order }),
          ]),
      },
      {
        id: input.by,
        edit: (source) => appendToList(source, 'supersedes', input.old, { order }),
      },
    ])
  })

/** Undoes `supersede`: the old item gets a new status, and the newer one stops listing it. */
const restore = (repo: Repo, oldId: string, status: string, options: OpOptions): Op =>
  Effect.gen(function* () {
    const item = yield* locate(repo, oldId)
    const by = data(yield* readText(repo, item.path))?.superseded_by
    const order = repo.fieldOrder[item.type as ItemType] ?? []
    const steps: Step[] = [
      {
        id: oldId,
        baseHash: options.baseHash,
        edit: (source) =>
          fold(source, [
            // A doc with no status is active, so that is how it is written.
            (t) =>
              status === 'active'
                ? unsetField(t, 'status')
                : setField(t, 'status', status, { order }),
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
 * Sets a task's state, or the status of an ADR, doc, runbook or context item. Making an item
 * `superseded` needs `supersededBy`, and updates both items. Moving an item out of `superseded`
 * clears that link on both. A doc made `active` loses its `status`, as a missing one means active.
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
    const allowed = statusesOf(item.type)
    if (allowed.length === 0) {
      return yield* invalid(['state'], 'Only tasks have a state; ADRs and docs have a status')
    }
    if (!allowed.includes(value)) {
      return yield* invalid(['state'], `A ${item.type} status is one of ${allowed.join(', ')}`)
    }
    const current = data(yield* readText(repo, item.path))?.status
    if (value === 'superseded') {
      if (options.supersededBy === undefined) {
        return yield* invalid(
          ['superseded_by'],
          'Required when the status is superseded: say which item replaces this one',
        )
      }
      return yield* supersede(repo, { old: id, by: options.supersededBy }, options)
    }
    if (current === 'superseded') return yield* restore(repo, id, value, options)
    return yield* value === 'active'
      ? updateFields(repo, id, { unset: ['status'] }, options)
      : updateFields(repo, id, { set: { status: value } }, options)
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

export interface ItemPatch {
  readonly set?: FieldPatch['set']
  readonly unset?: FieldPatch['unset']
  readonly section?: SectionPatch
}

/**
 * Sets and unsets fields and/or changes one section, as one request. Each step chains on the
 * hash the previous one left, so a stale `baseHash` is caught by the first. The result lists
 * every file written; `unchanged` is `true` only if no step changed anything. `undefined` when
 * the patch asked for nothing.
 */
export const updateItem = (repo: Repo, id: string, patch: ItemPatch, options: OpOptions = {}) =>
  Effect.gen(function* () {
    let result: OpResult | undefined
    let baseHash = options.baseHash
    const changed = new Set<string>()
    if (patch.set !== undefined || patch.unset !== undefined) {
      result = yield* updateFields(
        repo,
        id,
        {
          ...(patch.set ? { set: patch.set } : {}),
          ...(patch.unset ? { unset: patch.unset } : {}),
        },
        baseHash ? { baseHash } : {},
      )
      baseHash = result.hash
      for (const c of result.changed) changed.add(c)
    }
    if (patch.section !== undefined) {
      result = yield* updateSection(repo, id, patch.section, baseHash ? { baseHash } : {})
      for (const c of result.changed) changed.add(c)
    }
    return result === undefined
      ? undefined
      : ({ ...result, changed: [...changed], unchanged: changed.size === 0 } satisfies OpResult)
  })

/** The whole text of an item's file, as it is on disk now, and its hash. */
export const readSource = (repo: Repo, id: string) =>
  Effect.gen(function* () {
    const item = yield* locate(repo, id)
    const text = yield* readText(repo, item.path)
    return { path: item.path, text, hash: contentHash(text) }
  })

/**
 * Replaces an item's whole file, as an editor saves it. The new text goes through the same checks
 * as any other write: it may not have a problem the old text did not have. It must also stay the
 * same item: `id` and `type` cannot change this way.
 */
export const replaceSource = (repo: Repo, id: string, text: string, options: OpOptions = {}) =>
  mutate(repo, [
    {
      id,
      baseHash: options.baseHash,
      edit: (_source, item) =>
        Effect.gen(function* () {
          const front = outlineMarkdown(text).frontmatter?.data
          const fields =
            typeof front === 'object' && front !== null ? (front as Record<string, unknown>) : {}
          const issues: FieldIssue[] = []
          if (fields.id !== item.id)
            issues.push({ path: ['id'], message: `id cannot be changed (it is ${item.id})` })
          if (fields.type !== item.type) {
            issues.push({ path: ['type'], message: `type cannot be changed (it is ${item.type})` })
          }
          return issues.length > 0 ? yield* new ValidationError({ issues }) : text
        }),
    },
  ])

// ---- tags and labels across files --------------------------------------------------------------

export const tagFields = ['tags', 'labels'] as const
export type TagField = (typeof tagFields)[number]

export interface TagUse {
  readonly field: TagField
  readonly name: string
  readonly total: number
  /** How many items of each type carry it. */
  readonly byType: Readonly<Record<string, number>>
  readonly ids: ReadonlyArray<string>
}

const listOf = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

/** Every tag and label in use, most used first, with how many items of each type carry it. */
export const tagUsage = (repo: Repo): TagUse[] => {
  const uses = new Map<
    string,
    { field: TagField; name: string; byType: Record<string, number>; ids: string[] }
  >()
  for (const item of repo.index.items()) {
    if (item.id === undefined) continue
    const data = item.parsed.frontmatter?.data as Record<string, unknown> | undefined
    for (const field of tagFields) {
      for (const name of new Set(listOf(data?.[field]))) {
        const key = `${field}:${name}`
        const use = uses.get(key) ?? { field, name, byType: {}, ids: [] }
        const type = item.type ?? 'unknown'
        use.byType[type] = (use.byType[type] ?? 0) + 1
        use.ids.push(item.id)
        uses.set(key, use)
      }
    }
  }
  return [...uses.values()]
    .map((u) => ({ ...u, total: u.ids.length, ids: u.ids.sort() }))
    .sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name) || a.field.localeCompare(b.field),
    )
}

export interface RenameResult {
  /** How many items were changed. */
  readonly renamed: number
  /** Every file written. */
  readonly changed: ReadonlyArray<string>
}

/**
 * Renames a tag or label in every item that has it, one file at a time through `updateItem`, so
 * each file is checked against its schema and keeps its formatting. If the new name is already
 * on an item, the two merge into one. Nothing is written when the name is empty or unchanged.
 */
export const renameTag = (repo: Repo, input: { field: TagField; from: string; to: string }) =>
  Effect.gen(function* () {
    const to = input.to.trim()
    if (to === '') return yield* invalid(['to'], 'A tag needs a name')
    if (/\s/.test(to)) return yield* invalid(['to'], 'A tag cannot contain spaces')
    if (to === input.from) return { renamed: 0, changed: [] } satisfies RenameResult
    const changed = new Set<string>()
    let renamed = 0
    for (const use of tagUsage(repo).filter(
      (u) => u.field === input.field && u.name === input.from,
    )) {
      for (const id of use.ids) {
        const item = repo.index.findById(id)[0]
        const data = item?.parsed.frontmatter?.data as Record<string, unknown> | undefined
        const next = [
          ...new Set(listOf(data?.[input.field]).map((v) => (v === input.from ? to : v))),
        ]
        const result = yield* updateItem(repo, id, { set: { [input.field]: next } })
        if (result !== undefined && !result.unchanged) renamed++
        for (const c of result?.changed ?? []) changed.add(c)
      }
    }
    return { renamed, changed: [...changed] } satisfies RenameResult
  })

/**
 * Renames an area in every goal that has it, one file at a time through `updateItem`. If the new
 * name is already an area, the two merge. An empty `from` is the goals that have no area yet; an
 * empty `to` removes the area from its goals. Nothing is written when the name is unchanged.
 */
export const renameArea = (repo: Repo, input: { from: string; to: string }) =>
  Effect.gen(function* () {
    const to = input.to.trim()
    // Removing an area leaves its goals without one; the goals without one cannot be removed.
    if (to === '' && input.from === '') return yield* invalid(['to'], 'An area needs a name')
    if (to === input.from) return { renamed: 0, changed: [] } satisfies RenameResult
    const changed = new Set<string>()
    let renamed = 0
    for (const item of repo.index.items()) {
      if (item.id === undefined || item.type !== 'goal') continue
      const data = item.parsed.frontmatter?.data as Record<string, unknown> | undefined
      const area = typeof data?.area === 'string' && data.area !== '' ? data.area : ''
      if (area !== input.from) continue
      const result = yield* updateItem(
        repo,
        item.id,
        to === '' ? { unset: ['area'] } : { set: { area: to } },
      )
      if (result !== undefined && !result.unchanged) renamed++
      for (const c of result?.changed ?? []) changed.add(c)
    }
    return { renamed, changed: [...changed] } satisfies RenameResult
  })

/**
 * What a request to tick items asks for: one `item`, a list of `items`, or `all`. Exactly one must
 * be given, and each item is a 0-based position or its exact text. Returns the target and the
 * `checked` to use (`all` without `checked` ticks), or the problems with the request.
 */
export const checkTargetOf = (input: {
  readonly item?: number | string | undefined
  readonly items?: ReadonlyArray<number | string> | undefined
  readonly all?: boolean | undefined
  readonly checked?: boolean | undefined
}):
  | { readonly target: CheckTarget; readonly checked: boolean | undefined }
  | { readonly problem: string } => {
  const asked = [input.item !== undefined, input.items !== undefined, input.all === true].filter(
    Boolean,
  ).length
  if (asked !== 1) {
    return { problem: 'Give exactly one of item, items or all' }
  }
  const one = (v: number | string): CheckSelector | undefined =>
    typeof v === 'number'
      ? Number.isInteger(v) && v >= 0
        ? v
        : undefined
      : v === ''
        ? undefined
        : { text: v }
  if (input.all === true) return { target: { all: true }, checked: input.checked ?? true }
  const picked =
    input.items !== undefined ? input.items.map(one) : [one(input.item as number | string)]
  if (picked.length === 0 || picked.some((p) => p === undefined)) {
    return { problem: 'Give the 0-based position or the exact text of each checklist item' }
  }
  const selectors = picked as CheckSelector[]
  return {
    target: input.items === undefined ? (selectors[0] as CheckSelector) : selectors,
    checked: input.checked,
  }
}
