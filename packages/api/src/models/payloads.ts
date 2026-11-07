import { Schema } from 'effect'
import { Fields, ItemTypeName, opt, RelationKind, S } from './common'

export const SourcePayload = Schema.Struct({ text: S, baseHash: opt(S) })

export const LintTextPayload = Schema.Struct({ id: S, text: S })

export const CreatePayload = Schema.Struct({
  type: ItemTypeName,
  title: S.check(Schema.isMinLength(1)),
  id: opt(S),
  fields: opt(Fields),
  body: opt(S),
  template: opt(Schema.Boolean),
  createdBy: opt(S),
})

export const UpdatePayload = Schema.Struct({
  set: opt(Fields),
  unset: opt(Schema.Array(S)),
  section: opt(
    Schema.Struct({
      heading: S,
      content: S,
      mode: opt(Schema.Literals(['replace', 'append', 'create'])),
    }),
  ),
  baseHash: opt(S),
})

export const StatePayload = Schema.Struct({
  state: S,
  supersededBy: opt(S),
  baseHash: opt(S),
})

export const CheckPayload = Schema.Struct({
  item: opt(Schema.Union([Schema.Int, S])),
  items: opt(Schema.Array(Schema.Union([Schema.Int, S]))),
  all: opt(Schema.Boolean),
  checked: opt(Schema.Boolean),
  baseHash: opt(S),
})

export const LinkPayload = Schema.Struct({ to: S, kind: RelationKind, baseHash: opt(S) })

export const ReviewPayload = Schema.Struct({ date: opt(S), baseHash: opt(S) })
