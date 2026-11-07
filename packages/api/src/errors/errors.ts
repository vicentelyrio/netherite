import { Schema } from 'effect'

export const Issue = Schema.Struct({
  path: Schema.Array(Schema.Union([Schema.String, Schema.Number])),
  message: Schema.String,
})

export type Issue = typeof Issue.Type

export class Invalid extends Schema.TaggedError<Invalid>()(
  'Invalid',
  { message: Schema.String, issues: Schema.Array(Issue) },
  { httpApiStatus: 422 },
) {}

export class Conflict extends Schema.TaggedError<Conflict>()(
  'Conflict',
  {
    message: Schema.String,
    path: Schema.String,
    expected: Schema.String,
    actual: Schema.optional(Schema.String),
  },
  { httpApiStatus: 409 },
) {}

export class NotFound extends Schema.TaggedError<NotFound>()(
  'NotFound',
  { message: Schema.String, id: Schema.String },
  { httpApiStatus: 404 },
) {}

export class Refused extends Schema.TaggedError<Refused>()(
  'Refused',
  {
    message: Schema.String,
    reason: Schema.Literals(['still-linked', 'ambiguous-id', 'already-exists']),
    paths: Schema.Array(Schema.String),
  },
  { httpApiStatus: 409 },
) {}

export class Unavailable extends Schema.TaggedError<Unavailable>()(
  'Unavailable',
  { message: Schema.String },
  { httpApiStatus: 503 },
) {}

export class Failure extends Schema.TaggedError<Failure>()(
  'Failure',
  { message: Schema.String },
  { httpApiStatus: 500 },
) {}
