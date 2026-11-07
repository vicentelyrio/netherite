import { Schema } from 'effect'
import { N, opt, S } from './common'
import { Progress } from './items'

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
