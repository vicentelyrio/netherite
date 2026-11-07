import { Schema } from 'effect'
import { N, opt, S } from './common'

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
