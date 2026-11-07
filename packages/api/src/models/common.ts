import { itemTypes } from '@netherite/schema'
import { Schema } from 'effect'

export const S = Schema.String

export const N = Schema.Number

export const opt: typeof Schema.optional = Schema.optional

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

export const Fields = Schema.Record(S, Schema.Unknown)

export const FieldValue = Schema.optional(Schema.Union([S, Schema.Array(S)]))

export const Author = Schema.Struct({ name: S, email: S })
