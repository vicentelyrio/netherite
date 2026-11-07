import { Schema } from 'effect'
import { N, opt, S } from './common'
import { ProjectRow } from './goals'
import { Progress } from './items'

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
