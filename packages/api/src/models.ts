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

export const SearchHit = Schema.Struct({
  ...ItemSummary.fields,
  score: N,
  /** Where the words were found in the text, when they were not in the title. */
  snippet: opt(S),
  /** A doc or runbook that is drifting or stale against the code it covers. */
  stale: opt(Schema.Boolean),
})
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
  /** The checklist in order; `toggleCheck` takes an item's position in it. */
  checklist: Schema.Array(Schema.Struct({ text: S, checked: Schema.Boolean })),
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

export const NodeStatus = Schema.Literals(['backlog', 'progress', 'hold', 'done'])
export const GraphNode = Schema.Struct({
  id: S,
  type: S,
  title: S,
  path: S,
  /** Goals, projects and tasks: where they stand, and how much is done (0 to 1). */
  status: Schema.optionalKey(NodeStatus),
  progress: Schema.optionalKey(N),
  /** What it belongs to. */
  parent: Schema.optionalKey(S),
  /** When it reached this status, ISO 8601; needs git. */
  since: Schema.optionalKey(S),
  /** A doc whose code changed in many commits since it was reviewed. */
  stale: Schema.optionalKey(Schema.Boolean),
})
export const GraphEdge = Schema.Struct({ from: S, to: S, kind: EdgeKindName })
export const GraphQuery = {
  /** Rebuild the graph as it stood at this date (`YYYY-MM-DD` or ISO 8601). Needs git. */
  asOf: opt(S),
}
export const Graph = Schema.Struct({
  nodes: Schema.Array(GraphNode),
  edges: Schema.Array(GraphEdge),
  /** Set when the graph is a past state: the moment it shows, and whether history is incomplete. */
  asOf: Schema.optionalKey(S),
  approximate: Schema.optionalKey(Schema.Boolean),
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
export const Raised = Schema.Struct({
  /** Stable while the cause stays, so a dismissal or snooze can be remembered under it. */
  key: S,
  rule: Schema.Literals([
    'stale-doc',
    'proposed-adr',
    'orphan',
    'overdue-task',
    'closing-commit',
    'new-todo',
    'similar-tag',
  ]),
  title: S,
  detail: S,
  id: opt(S),
  path: opt(S),
  line: opt(N),
  date: opt(S),
  commit: opt(S),
})
export const CapturePayload = Schema.Struct({ text: S })
export const CaptureQuery = { text: S }
export const CaptureResult = Schema.Struct({ text: S })
export const CaptureRemoved = Schema.Struct({ removed: Schema.Boolean })
export const Inbox = Schema.Struct({
  /** Lines in `inbox.md`, oldest first, waiting to become items. */
  captures: Schema.Array(CaptureResult),
  /** What the repo raises, newest cause first. Rules can be switched off with `inbox.rules` in the config. */
  raised: Schema.Array(Raised),
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

const TimelineHold = Schema.Struct({ from: S, to: opt(S) })
const timelineItem = {
  id: S,
  title: S,
  status: NodeStatus,
  /** Done over all, 0 to 1. */
  progress: N,
  /** `YYYY-MM-DD` dates. */
  created: opt(S),
  started: opt(S),
  finished: opt(S),
  due: opt(S),
  /** Not done, and due before today. */
  overdue: Schema.Boolean,
  /** Not started yet. */
  planned: Schema.Boolean,
  holds: Schema.Array(TimelineHold),
  approximate: Schema.Boolean,
}
export const Timeline = Schema.Struct({
  from: S,
  to: S,
  today: S,
  goals: Schema.Array(Schema.Struct({ ...timelineItem, horizon: opt(S) })),
  projects: Schema.Array(Schema.Struct({ ...timelineItem, goal: opt(S), milestone: opt(S) })),
  tasks: Schema.Array(Schema.Struct({ ...timelineItem, project: opt(S) })),
  decisions: Schema.Array(
    Schema.Struct({
      id: S,
      title: S,
      status: S,
      project: opt(S),
      proposed: opt(S),
      accepted: opt(S),
      ended: opt(S),
    }),
  ),
  /** Commits per week over the window. */
  activity: Schema.Array(Schema.Struct({ week: S, count: N })),
  approximate: Schema.Boolean,
})
export const TimelineQuery = { from: opt(S), to: opt(S) }

const Delta = Schema.Struct({ value: N, previous: opt(N) })
export const Period = Schema.Literals(['30d', 'quarter', 'year'])
export const PeriodStats = Schema.Struct({
  period: Period,
  from: S,
  to: S,
  kpis: Schema.Struct({
    created: Delta,
    done: Delta,
    cycleDays: Schema.NullOr(Delta),
    commits: Delta,
    staleDocs: Delta,
  }),
  throughput: Schema.Array(Schema.Struct({ start: S, created: N, done: N })),
  areas: Schema.Array(
    Schema.Struct({
      area: S,
      goals: N,
      share: N,
      gained: N,
      achieved: N,
      idle: N,
      achievedGoals: Schema.Array(S),
      idleGoals: Schema.Array(S),
    }),
  ),
  projects: Schema.Array(Schema.Struct({ id: S, title: S, done: N, cycleDays: Schema.NullOr(N) })),
  heat: Schema.Struct({
    from: S,
    to: S,
    days: Schema.Array(Schema.Struct({ date: S, count: N })),
  }),
  knowledge: Schema.Struct({
    freshness: Schema.Struct({ fresh: N, drifting: N, stale: N, notTracked: N }),
    decisions: Schema.Record(S, N),
    undocumented: Schema.Array(Schema.Struct({ path: S, commits: N, last: S })),
  }),
  areaNames: Schema.Array(S),
  approximate: Schema.Boolean,
})
export const PeriodStatsQuery = { period: opt(S), area: opt(S) }

export const Health = Schema.Struct({
  name: Schema.Literal('netherite'),
  version: S,
  root: S,
  items: N,
  git: Schema.Boolean,
  /** The checked-out branch, when there is git and a branch. */
  branch: opt(S),
  /** The person running the server, as an `@handle`, from git. */
  user: opt(S),
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
  /** How far ahead the goal looks, as written (`forever`, `5 years`). */
  horizon: opt(S),
  /** The horizon in days; missing for `forever`. */
  horizonDays: opt(N),
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

// ---- knowledge -------------------------------------------------------------------------

export const KnowledgeRow = Schema.Struct({
  id: S,
  type: S,
  title: S,
  path: S,
  status: opt(S),
  projects: Schema.Array(S),
  tags: Schema.Array(S),
  freshness: Schema.NullOr(Schema.Literals(['fresh', 'drifting', 'stale', 'unknown'])),
  orphan: Schema.Boolean,
  commits: N,
  date: opt(S),
  supersedes: Schema.Array(S),
  supersededBy: Schema.Array(S),
})
export type KnowledgeRow = typeof KnowledgeRow.Type

export const KnowledgeList = Schema.Struct({ items: Schema.Array(KnowledgeRow) })

export const CoChangedFile = Schema.Struct({ path: S, commits: N, share: N, last: S })

export const CommitView = Schema.Struct({ hash: S, subject: S, date: S, author: S })

export const KnowledgePreview = Schema.Struct({
  id: S,
  /** The first plain paragraph of the text. */
  summary: S,
  backlinks: Schema.Array(LinkView),
  /** Files that change in the same commits as the item; `null` without git. */
  coChanged: Schema.NullOr(
    Schema.Struct({
      itemCommits: N,
      files: Schema.Array(CoChangedFile),
      partial: Schema.Boolean,
    }),
  ),
  /** The commit that last changed the file; missing without git or before its first commit. */
  lastCommit: opt(CommitView),
})
export type KnowledgePreview = typeof KnowledgePreview.Type

export const ChainLink = Schema.Struct({ id: S, title: S, status: opt(S) })

export const ContextTargetView = Schema.Struct({
  target: S,
  path: S,
  /** Whether this item is in the block written to the file. */
  included: Schema.Boolean,
  /** Wanted, but over the token budget. */
  omitted: Schema.Boolean,
  tokens: N,
  budget: N,
  /** Whether the file is out of date with the context items. */
  stale: Schema.Boolean,
})

/** What the doc, ADR and context views add to an item: the supersession chain, the commits since review, and where a context item is synced. */
export const KnowledgeView = Schema.Struct({
  id: S,
  chain: Schema.Array(ChainLink),
  /** Commits since the item was reviewed that touched what it covers; `null` when it covers nothing or there is no git. */
  changes: Schema.NullOr(
    Schema.Struct({
      since: Schema.NullOr(S),
      commits: Schema.Array(CommitView),
      covers: Schema.Array(S),
    }),
  ),
  /** Only for context items. */
  context: Schema.NullOr(
    Schema.Struct({
      include: Schema.Boolean,
      targets: Schema.Array(ContextTargetView),
    }),
  ),
})
export type KnowledgeView = typeof KnowledgeView.Type

// ---- tags and labels -------------------------------------------------------------------

export const TagField = Schema.Literals(['tags', 'labels'])

export const TagUse = Schema.Struct({
  field: TagField,
  name: S,
  total: N,
  /** How many items of each type carry it. */
  byType: Schema.Record(S, N),
  ids: Schema.Array(S),
})
export type TagUse = typeof TagUse.Type

export const TagList = Schema.Struct({ tags: Schema.Array(TagUse) })

const TagRef = Schema.Struct({ field: TagField, name: S })
export const TagMap = Schema.Struct({
  tags: Schema.Array(
    Schema.Struct({
      field: TagField,
      name: S,
      total: N,
      byType: Schema.Record(S, N),
      ids: Schema.Array(S),
      /** An area, or a group of tags used together. */
      cluster: S,
      /** Tags most often on the same items. */
      often: Schema.Array(Schema.Struct({ field: TagField, name: S, count: N })),
    }),
  ),
  /** Pairs on the same items, and how many items carry both. */
  edges: Schema.Array(Schema.Struct({ a: TagRef, b: TagRef, count: N })),
  clusters: Schema.Array(Schema.Struct({ name: S, tags: N })),
  /** Pairs that are probably one tag spelled two ways. */
  duplicates: Schema.Array(
    Schema.Struct({
      a: TagRef,
      b: TagRef,
      reason: Schema.Literals(['name', 'neighbours']),
      score: N,
    }),
  ),
})

export const RenameTagPayload = Schema.Struct({ field: TagField, from: S, to: S })

export const RenameTagResult = Schema.Struct({
  /** How many items changed. */
  renamed: N,
  /** Every file written. */
  changed: Schema.Array(S),
})
