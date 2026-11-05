import { Schema } from 'effect'

/** One thing wrong with a request, with the field it is about when there is one. */
export const Issue = Schema.Struct({
  path: Schema.Array(Schema.Union([Schema.String, Schema.Number])),
  message: Schema.String,
})
export type Issue = typeof Issue.Type

/** The request was understood but its content is not valid (422). */
export class Invalid extends Schema.TaggedError<Invalid>()(
  'Invalid',
  { message: Schema.String, issues: Schema.Array(Issue) },
  { httpApiStatus: 422 },
) {}

/** The file changed since the caller read it (409). Reload, then try again. */
export class Conflict extends Schema.TaggedError<Conflict>()(
  'Conflict',
  {
    message: Schema.String,
    path: Schema.String,
    /** Hash the edit was based on. */
    expected: Schema.String,
    /** Hash found on disk; absent if the file is gone. */
    actual: Schema.optional(Schema.String),
  },
  { httpApiStatus: 409 },
) {}

/** No item has the ID (404). */
export class NotFound extends Schema.TaggedError<NotFound>()(
  'NotFound',
  { message: Schema.String, id: Schema.String },
  { httpApiStatus: 404 },
) {}

/** The request is valid but the workspace's state forbids it (409). */
export class Refused extends Schema.TaggedError<Refused>()(
  'Refused',
  {
    message: Schema.String,
    reason: Schema.Literals(['still-linked', 'ambiguous-id', 'already-exists']),
    /** Who links to the item (`still-linked`) or which files share the ID (`ambiguous-id`). */
    paths: Schema.Array(Schema.String),
  },
  { httpApiStatus: 409 },
) {}

/** The data needs something this workspace does not have, such as git history (503). */
export class Unavailable extends Schema.TaggedError<Unavailable>()(
  'Unavailable',
  { message: Schema.String },
  { httpApiStatus: 503 },
) {}

/** A file could not be read or written, or something else went wrong inside the server (500). */
export class Failure extends Schema.TaggedError<Failure>()(
  'Failure',
  { message: Schema.String },
  { httpApiStatus: 500 },
) {}
