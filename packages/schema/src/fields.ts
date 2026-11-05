import { Schema } from 'effect'

export const IsoDate = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/u))

export const IsoDateTime = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/u),
)

export const Text = Schema.NonEmptyString

export const Glob = Schema.NonEmptyString

export const Strings = Schema.Array(Schema.String)

export const DesignLink = Schema.Struct({
  label: Schema.NonEmptyString,
  url: Schema.NonEmptyString,
})
