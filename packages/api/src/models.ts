import { itemTypes } from '@netherite/schema'
import { Schema } from 'effect'

const S = Schema.String
const N = Schema.Number
const opt = Schema.optional

/** Item type: goal, project, task, adr, doc, context or runbook. */
export const ItemTypeName = Schema.Literals(itemTypes)

export const relationKinds = [
  'belongs_to',
  'implements',
  'explains',
  'supersedes',
  'depends_on',
  'related',
] as const
export const RelationKind = Schema.Literals(relationKinds)
/** What links items: a typed relation, or a `[[wikilink]]` in the text (`reference`). */
export const EdgeKindName = Schema.Literals([...relationKinds, 'reference'])

export const ItemSummary = Schema.Struct({
  id: S,
  type: S,
  title: S,
  path: S,
  status: opt(S),
  state: opt(S),
  project: opt(S),
  labels: opt(Schema.Array(Schema.Unknown)),
})
export type ItemSummary = typeof ItemSummary.Type

export const ItemList = Schema.Struct({
  total: N,
  offset: N,
  items: Schema.Array(ItemSummary),
})

export const SearchHit = Schema.Struct({ ...ItemSummary.fields, score: N })
export const SearchResult = Schema.Struct({ total: N, results: Schema.Array(SearchHit) })

export const LinkView = Schema.Struct({
  kind: EdgeKindName,
  id: opt(S),
  title: opt(S),
  path: S,
})

export const Unresolved = Schema.Struct({
  target: S,
  field: opt(S),
  status: S,
})

export const Progress = Schema.Struct({ done: N, total: N })

export const FreshnessView = Schema.Struct({
  state: Schema.Literals(['fresh', 'drifting', 'stale', 'unknown']),
  commits: N,
  since: Schema.NullOr(S),
  atLeast: Schema.Boolean,
})

export const ItemDetail = Schema.Struct({
  ...ItemSummary.fields,
  /** Hash of the file; send it back as `baseHash` when editing. */
  hash: S,
  frontmatter: Schema.Unknown,
  body: S,
  links: Schema.Array(LinkView),
  backlinks: Schema.Array(LinkView),
  unresolved: Schema.Array(Unresolved),
  progress: Schema.NullOr(Progress),
  orphan: Schema.Boolean,
  freshness: Schema.NullOr(FreshnessView),
})
export type ItemDetail = typeof ItemDetail.Type

/** What a write did. `hash` is the file's hash now: pass it as `baseHash` to the next edit. */
export const WriteResult = Schema.Struct({
  id: S,
  path: S,
  hash: S,
  changed: Schema.Array(S),
  unchanged: Schema.Boolean,
})
export type WriteResult = typeof WriteResult.Type

/** An item's whole file, for an editor. `head` is the text as last committed, for the change gutter. */
export const ItemSource = Schema.Struct({
  text: S,
  /** Hash of `text`; send it back as `baseHash` when saving. */
  hash: S,
  /** The committed version, or `null` when there is no git or the file was never committed. */
  head: Schema.NullOr(S),
})

export const SourcePayload = Schema.Struct({ text: S, baseHash: opt(S) })

/** Text to lint without saving it: what an editor holds while someone types. */
export const LintTextPayload = Schema.Struct({ id: S, text: S })

export const DeleteResult = Schema.Struct({ deleted: S, path: S })

// ---- request bodies -------------------------------------------------------------------

const Fields = Schema.Record(S, Schema.Unknown)

export const CreatePayload = Schema.Struct({
  type: ItemTypeName,
  title: S.check(Schema.isMinLength(1)),
  fields: opt(Fields),
  body: opt(S),
  /** A `@handle`. Defaults to the person running the server. */
  createdBy: opt(S),
})

export const UpdatePayload = Schema.Struct({
  set: opt(Fields),
  unset: opt(Schema.Array(S)),
  section: opt(
    Schema.Struct({
      heading: S,
      content: S,
      mode: opt(Schema.Literals(['replace', 'append', 'create'])),
    }),
  ),
  baseHash: opt(S),
})

export const StatePayload = Schema.Struct({
  state: S,
  /** The ADR that replaces this one; required when making an ADR `superseded`. */
  supersededBy: opt(S),
  baseHash: opt(S),
})

export const CheckPayload = Schema.Struct({
  /** The checklist item's 0-based position, or its exact text. */
  item: Schema.Union([Schema.Int, S]),
  /** Omit to flip it. */
  checked: opt(Schema.Boolean),
  baseHash: opt(S),
})

export const LinkPayload = Schema.Struct({ to: S, kind: RelationKind, baseHash: opt(S) })
export const ReviewPayload = Schema.Struct({ date: opt(S), baseHash: opt(S) })

// ---- queries --------------------------------------------------------------------------

/** Query strings are text; numbers and booleans travel as text and are read back by the schema. */
export const ListQuery = {
  type: opt(ItemTypeName),
  status: opt(S),
  project: opt(S),
  tag: opt(S),
  limit: opt(Schema.FiniteFromString),
  offset: opt(Schema.FiniteFromString),
}

export const SearchQuery = {
  q: S,
  /** Comma-separated item types. */
  types: opt(S),
  status: opt(S),
  project: opt(S),
  tag: opt(S),
  limit: opt(Schema.FiniteFromString),
}

export const DeleteQuery = {
  force: opt(Schema.Literals(['true', 'false'])),
  baseHash: opt(S),
}
export const UnlinkQuery = { to: S, kind: RelationKind, baseHash: opt(S) }

// ---- graph, lint, inbox, history, stats ------------------------------------------------

export const GraphNode = Schema.Struct({ id: S, type: S, title: S, path: S })
export const GraphEdge = Schema.Struct({ from: S, to: S, kind: EdgeKindName })
export const Graph = Schema.Struct({
  nodes: Schema.Array(GraphNode),
  edges: Schema.Array(GraphEdge),
})

export const Severity = Schema.Literals(['error', 'warning', 'info'])
export const Diagnostic = Schema.Struct({
  path: S,
  line: N,
  column: N,
  rule: S,
  severity: Severity,
  message: S,
})
export const LintReport = Schema.Struct({
  summary: Schema.Struct({ error: N, warning: N, info: N }),
  diagnostics: Schema.Array(Diagnostic),
})
export const LintQuery = { id: opt(S) }

export const InboxQuery = {
  /** Only agent activity after this time (ISO 8601), such as the last visit. */
  since: opt(S),
}
export const Inbox = Schema.Struct({
  /** Uncommitted changes to items, from `git status`. Empty without git. */
  changes: Schema.Array(
    Schema.Struct({
      path: S,
      /** `added`, `modified`, `deleted`, `renamed` or `untracked`. */
      change: S,
      id: opt(S),
      title: opt(S),
      type: opt(S),
    }),
  ),
  /** What agents changed through MCP, per item, most recent first. */
  activity: Schema.Array(
    Schema.Struct({
      id: S,
      path: S,
      count: N,
      tools: Schema.Array(S),
      first: S,
      last: S,
      deleted: Schema.Boolean,
    }),
  ),
  /** ADRs waiting for a decision. */
  proposed: Schema.Array(ItemSummary),
  /** Docs that are drifting or stale. */
  freshness: Schema.Array(
    Schema.Struct({
      id: S,
      title: S,
      path: S,
      state: Schema.Literals(['drifting', 'stale']),
      commits: N,
    }),
  ),
  orphans: Schema.Array(ItemSummary),
  /** Lint errors. */
  errors: Schema.Array(Diagnostic),
  /** Tasks in a `blocked` state. */
  blocked: Schema.Array(ItemSummary),
})

const FieldValue = Schema.optional(Schema.Union([S, Schema.Array(S)]))
export const Author = Schema.Struct({ name: S, email: S })
export const Transition = Schema.Struct({
  id: S,
  type: opt(S),
  field: S,
  from: FieldValue,
  to: FieldValue,
  kind: Schema.Literals(['created', 'changed', 'seen']),
  hash: S,
  date: S,
  author: Author,
})
export const DecisionLog = Schema.Struct({
  /** `true` when old history is missing (a shallow clone). */
  partial: Schema.Boolean,
  transitions: Schema.Array(Transition),
})
export const DecisionQuery = { project: opt(S) }

export const ItemHistory = Schema.Struct({
  id: S,
  paths: Schema.Array(S),
  commits: N,
  created: opt(Schema.Struct({ hash: S, date: S, author: Author })),
  deletedAt: opt(S),
  transitions: Schema.Array(Transition),
  authors: Schema.Array(Schema.Struct({ ...Author.fields, commits: N, first: S, last: S })),
})

const Point = Schema.Struct({ week: S, done: N, total: N })
export const Stats = Schema.Struct({
  partial: Schema.Boolean,
  /** Tasks that reached a done state, per week. */
  completions: Schema.Array(Schema.Struct({ week: S, count: N })),
  /** ADRs by the status they moved to, per week. */
  adrs: Schema.Array(
    Schema.Struct({ week: S, proposed: N, accepted: N, deprecated: N, superseded: N }),
  ),
  /** Done and total tasks at the end of each week, per project and per goal. */
  progress: Schema.Struct({
    projects: Schema.Record(S, Schema.Array(Point)),
    goals: Schema.Record(S, Schema.Array(Point)),
  }),
})
export const StatsQuery = { from: opt(S), to: opt(S) }

export const Health = Schema.Struct({
  name: Schema.Literal('netherite'),
  version: S,
  root: S,
  items: N,
  git: Schema.Boolean,
})

// ---- live events ---------------------------------------------------------------------

const Tagged = <const T extends string, F extends Schema.Struct.Fields>(type: T, fields: F) =>
  Schema.Struct({ type: Schema.Literal(type), ...fields })

/**
 * What the server pushes over `GET /api/events`. The app uses these to refresh what it shows;
 * each says what changed, not the new content.
 */
export const ServerEvent = Schema.Union([
  /** Sent first, so a client knows the stream is open and which server it is talking to. */
  Tagged('ready', { version: S }),
  /** Items were added, changed or removed (by an editor, a branch switch, an agent or the API). */
  Tagged('items', {
    upserted: Schema.Array(S),
    removed: Schema.Array(S),
    /** Every item that is different now, including ones whose links resolve differently. */
    affected: Schema.Array(S),
    /** The IDs of the affected items that still exist. */
    ids: Schema.Array(S),
  }),
  /** The commit, branch or index changed, so uncommitted changes and history may differ. */
  Tagged('git', { head: opt(S), branch: opt(S), changes: N }),
  /** The lint result is different from the last one sent. */
  Tagged('lint', { error: N, warning: N, info: N }),
  /** `.netherite/config.yml` changed. `requiresRestart` when the content folder moved. */
  Tagged('config', { requiresRestart: Schema.Boolean }),
  /** The config file is invalid; the previous one stays in use. */
  Tagged('config-invalid', { message: S }),
  /** Keeps idle connections open. */
  Tagged('ping', {}),
])
export type ServerEvent = typeof ServerEvent.Type

// ---- goals -----------------------------------------------------------------------------

const OptProgress = Schema.NullOr(Progress)

export const GoalRow = Schema.Struct({
  id: S,
  title: S,
  path: S,
  status: S,
  area: opt(S),
  due: opt(S),
  created: opt(S),
  tags: Schema.Array(S),
  progress: OptProgress,
  projects: N,
})
export type GoalRow = typeof GoalRow.Type

export const GoalList = Schema.Struct({ goals: Schema.Array(GoalRow) })

export const ProjectRow = Schema.Struct({
  id: S,
  title: S,
  path: S,
  status: opt(S),
  tags: Schema.Array(S),
  progress: OptProgress,
  goals: Schema.Array(Schema.Struct({ id: S, title: S })),
})
export type ProjectRow = typeof ProjectRow.Type

export const GoalDetail = Schema.Struct({
  ...GoalRow.fields,
  projectRows: Schema.Array(ProjectRow),
})
export type GoalDetail = typeof GoalDetail.Type

// ---- projects and their board ----------------------------------------------------------

export const ProjectList = Schema.Struct({ projects: Schema.Array(ProjectRow) })

export const BoardCard = Schema.Struct({
  id: S,
  title: S,
  path: S,
  state: S,
  labels: Schema.Array(S),
  assignees: Schema.Array(S),
  due: opt(S),
  checklist: Schema.NullOr(Progress),
  /** Tasks it depends on that are not done yet. */
  waitingOn: Schema.Array(Schema.Struct({ id: S, title: S })),
})
export type BoardCard = typeof BoardCard.Type

export const Board = Schema.Struct({
  ...ProjectRow.fields,
  /** The configured states, in order, each with its category (todo, active, blocked, done). */
  columns: Schema.Array(Schema.Struct({ name: S, category: S })),
  tasks: Schema.Array(BoardCard),
  /** Docs, ADRs and the like that link to the project. */
  linked: Schema.Array(Schema.Struct({ id: S, type: S, title: S })),
})
export type Board = typeof Board.Type
