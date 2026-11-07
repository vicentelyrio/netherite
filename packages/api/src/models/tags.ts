import { Schema } from 'effect'
import { N, S } from './common'

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
