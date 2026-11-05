import { Schema } from 'effect'

/** A calendar date, `YYYY-MM-DD`. YAML dates are read as strings, so files stay byte-identical. */
export const IsoDate = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/u))

/** A UTC or offset date-time, such as `2026-01-04T09:00:00Z`. */
export const IsoDateTime = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/u),
)

/** A non-empty string. */
export const Text = Schema.NonEmptyString

/** A path glob relative to the repository root, used by `covers`. */
export const Glob = Schema.NonEmptyString

export const Strings = Schema.Array(Schema.String)

/** A link to design material on a project. */
export const DesignLink = Schema.Struct({
  label: Schema.NonEmptyString,
  url: Schema.NonEmptyString,
})
