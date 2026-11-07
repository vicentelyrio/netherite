import { Schema } from 'effect'
import { ItemTypeName, opt, RelationKind, S } from './common'

export const ListQuery = {
  type: opt(ItemTypeName),
  status: opt(S),
  project: opt(S),
  tag: opt(S),
  limit: opt(Schema.FiniteFromString),
  offset: opt(Schema.FiniteFromString),
}

export const SearchQuery = {
  q: S,
  types: opt(S),
  status: opt(S),
  project: opt(S),
  tag: opt(S),
  limit: opt(Schema.FiniteFromString),
}

export const DeleteQuery = {
  force: opt(Schema.Literals(['true', 'false'])),
  baseHash: opt(S),
}

export const UnlinkQuery = { to: S, kind: RelationKind, baseHash: opt(S) }
