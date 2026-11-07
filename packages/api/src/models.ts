import { itemTypes } from '@netherite/schema'
import { Schema } from 'effect'

const S = Schema.String
const N = Schema.Number
const opt = Schema.optional

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
  snippet: opt(S),
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
  hash: S,
  frontmatter: Schema.Unknown,
  body: S,
  links: Schema.Array(LinkView),
  backlinks: Schema.Array(LinkView),
  unresolved: Schema.Array(Unresolved),
  checklist: Schema.Array(Schema.Struct({ text: S, checked: Schema.Boolean })),
  progress: Schema.NullOr(Progress),
  orphan: Schema.Boolean,
  freshness: Schema.NullOr(FreshnessView),
})
export type ItemDetail = typeof ItemDetail.Type

export const WriteResult = Schema.Struct({
  id: S,
  path: S,
  hash: S,
  changed: Schema.Array(S),
  unchanged: Schema.Boolean,
})
export type WriteResult = typeof WriteResult.Type

export const ItemSource = Schema.Struct({
  text: S,
  hash: S,
  head: Schema.NullOr(S),
})

export const SourcePayload = Schema.Struct({ text: S, baseHash: opt(S) })

export const LintTextPayload = Schema.Struct({ id: S, text: S })

export const DeleteResult = Schema.Struct({ deleted: S, path: S })

const Fields = Schema.Record(S, Schema.Unknown)

export const CreatePayload = Schema.Struct({
  type: ItemTypeName,
  title: S.check(Schema.isMinLength(1)),
  id: opt(S),
  fields: opt(Fields),
  body: opt(S),
  template: opt(Schema.Boolean),
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
  supersededBy: opt(S),
  baseHash: opt(S),
})

export const CheckPayload = Schema.Struct({
  item: opt(Schema.Union([Schema.Int, S])),
  items: opt(Schema.Array(Schema.Union([Schema.Int, S]))),
  all: opt(Schema.Boolean),
  checked: opt(Schema.Boolean),
  baseHash: opt(S),
})

export const LinkPayload = Schema.Struct({ to: S, kind: RelationKind, baseHash: opt(S) })
export const ReviewPayload = Schema.Struct({ date: opt(S), baseHash: opt(S) })

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

export const NodeStatus = Schema.Literals(['backlog', 'progress', 'hold', 'done'])
export const GraphNode = Schema.Struct({
  id: S,
  type: S,
  title: S,
  path: S,
  status: Schema.optionalKey(NodeStatus),
  progress: Schema.optionalKey(N),
  parent: Schema.optionalKey(S),
  since: Schema.optionalKey(S),
  stale: Schema.optionalKey(Schema.Boolean),
})
export const GraphEdge = Schema.Struct({ from: S, to: S, kind: EdgeKindName })
export const GraphQuery = {
  asOf: opt(S),
}
export const Graph = Schema.Struct({
  nodes: Schema.Array(GraphNode),
  edges: Schema.Array(GraphEdge),
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
  since: opt(S),
}
export const Raised = Schema.Struct({
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
  captures: Schema.Array(CaptureResult),
  raised: Schema.Array(Raised),
  changes: Schema.Array(
    Schema.Struct({
      path: S,
      change: S,
      id: opt(S),
      title: opt(S),
      type: opt(S),
    }),
  ),
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
  proposed: Schema.Array(ItemSummary),
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
  errors: Schema.Array(Diagnostic),
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
  completions: Schema.Array(Schema.Struct({ week: S, count: N })),
  adrs: Schema.Array(
    Schema.Struct({ week: S, proposed: N, accepted: N, deprecated: N, superseded: N }),
  ),
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
  progress: N,
  created: opt(S),
  started: opt(S),
  finished: opt(S),
  due: opt(S),
  overdue: Schema.Boolean,
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
    linked: Schema.optionalKey(
      Schema.Struct({ percent: N, total: N, previous: Schema.optionalKey(N) }),
    ),
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
      goalRows: Schema.Array(Schema.Struct({ title: S, share: N, gained: N })),
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
    decided: Schema.Record(S, N),
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
  branch: opt(S),
  user: opt(S),
})

const Tagged = <const T extends string, F extends Schema.Struct.Fields>(type: T, fields: F) =>
  Schema.Struct({ type: Schema.Literal(type), ...fields })

export const ServerEvent = Schema.Union([
  Tagged('ready', { version: S }),
  Tagged('items', {
    upserted: Schema.Array(S),
    removed: Schema.Array(S),
    affected: Schema.Array(S),
    ids: Schema.Array(S),
  }),
  Tagged('git', { head: opt(S), branch: opt(S), changes: N }),
  Tagged('lint', { error: N, warning: N, info: N }),
  Tagged('config', { requiresRestart: Schema.Boolean }),
  Tagged('config-invalid', { message: S }),
  Tagged('ping', {}),
])
export type ServerEvent = typeof ServerEvent.Type

const OptProgress = Schema.NullOr(Progress)

export const GoalRow = Schema.Struct({
  id: S,
  title: S,
  path: S,
  status: S,
  area: opt(S),
  due: opt(S),
  created: opt(S),
  horizon: opt(S),
  horizonDays: opt(N),
  tags: Schema.Array(S),
  progress: OptProgress,
  projects: N,
  rank: N,
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
  rank: N,
})
export type ProjectRow = typeof ProjectRow.Type

export const GoalDetail = Schema.Struct({
  ...GoalRow.fields,
  projectRows: Schema.Array(ProjectRow),
})
export type GoalDetail = typeof GoalDetail.Type

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
  waitingOn: Schema.Array(Schema.Struct({ id: S, title: S })),
  rank: N,
})
export type BoardCard = typeof BoardCard.Type

export const Board = Schema.Struct({
  ...ProjectRow.fields,
  columns: Schema.Array(Schema.Struct({ name: S, category: S })),
  tasks: Schema.Array(BoardCard),
  linked: Schema.Array(Schema.Struct({ id: S, type: S, title: S })),
})
export type Board = typeof Board.Type

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
  handle: opt(S),
  aiTokens: Schema.NullOr(N),
  explains: Schema.Record(S, N),
})
export type KnowledgeRow = typeof KnowledgeRow.Type

export const KnowledgeList = Schema.Struct({ items: Schema.Array(KnowledgeRow) })

export const CoChangedFile = Schema.Struct({ path: S, commits: N, share: N, last: S })

export const CommitView = Schema.Struct({ hash: S, subject: S, date: S, author: S })

export const KnowledgePreview = Schema.Struct({
  id: S,
  summary: S,
  backlinks: Schema.Array(LinkView),
  coChanged: Schema.NullOr(
    Schema.Struct({
      itemCommits: N,
      files: Schema.Array(CoChangedFile),
      partial: Schema.Boolean,
    }),
  ),
  lastCommit: opt(CommitView),
  source: opt(S),
  importedAt: opt(S),
})
export type KnowledgePreview = typeof KnowledgePreview.Type

export const ChainLink = Schema.Struct({ id: S, title: S, status: opt(S) })

export const ContextTargetView = Schema.Struct({
  target: S,
  path: S,
  included: Schema.Boolean,
  omitted: Schema.Boolean,
  tokens: N,
  budget: N,
  stale: Schema.Boolean,
})

export const KnowledgeView = Schema.Struct({
  id: S,
  chain: Schema.Array(ChainLink),
  changes: Schema.NullOr(
    Schema.Struct({
      since: Schema.NullOr(S),
      commits: Schema.Array(CommitView),
      covers: Schema.Array(S),
    }),
  ),
  context: Schema.NullOr(
    Schema.Struct({
      include: Schema.Boolean,
      targets: Schema.Array(ContextTargetView),
    }),
  ),
})
export type KnowledgeView = typeof KnowledgeView.Type

export const TagField = Schema.Literals(['tags', 'labels'])

export const TagUse = Schema.Struct({
  field: TagField,
  name: S,
  total: N,
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
      cluster: S,
      often: Schema.Array(Schema.Struct({ field: TagField, name: S, count: N })),
    }),
  ),
  edges: Schema.Array(Schema.Struct({ a: TagRef, b: TagRef, count: N })),
  clusters: Schema.Array(Schema.Struct({ name: S, tags: N })),
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
  renamed: N,
  changed: Schema.Array(S),
})

export const RenameAreaPayload = Schema.Struct({ from: S, to: S })
