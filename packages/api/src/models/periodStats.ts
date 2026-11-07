import { Schema } from 'effect'
import { N, opt, S } from './common'

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
