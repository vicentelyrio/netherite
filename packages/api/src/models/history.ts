import { Schema } from 'effect'
import { Author, FieldValue, N, opt, S } from './common'

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
