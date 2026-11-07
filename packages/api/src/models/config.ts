import { Schema } from 'effect'
import { N, S } from './common'

export const WorkspaceSettings = Schema.Struct({
  states: Schema.Array(Schema.Struct({ name: S, category: S })),
  freshness: Schema.Struct({ drifting: N, stale: N }),
  context: Schema.Struct({ budget: N, targets: Schema.Array(S) }),
  inbox: Schema.Struct({ rules: Schema.Record(S, Schema.Boolean) }),
})

export const WorkspaceConfig = Schema.Struct({ hash: S, settings: WorkspaceSettings })

export const WorkspaceConfigPayload = Schema.Struct({
  baseHash: S,
  set: Schema.Record(S, Schema.Unknown),
})

export const WorkspaceConfigResult = Schema.Struct({
  hash: S,
  settings: WorkspaceSettings,
  unchanged: Schema.Boolean,
  requiresRestart: Schema.Boolean,
})
