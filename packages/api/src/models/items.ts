import { Schema } from 'effect'
import { EdgeKindName, N, opt, S } from './common'

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

export const DeleteResult = Schema.Struct({ deleted: S, path: S })
