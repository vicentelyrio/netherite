import { Schema } from 'effect'
import { N, opt, S } from './common'
import { NodeStatus } from './graph'

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
  activityByDay: Schema.Array(Schema.Struct({ day: S, count: N })),
  approximate: Schema.Boolean,
})

export const TimelineQuery = { from: opt(S), to: opt(S) }
