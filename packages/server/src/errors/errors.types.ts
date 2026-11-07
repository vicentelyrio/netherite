import type { Conflict, Failure, Invalid, NotFound, Refused } from '@netherite/api'

export type ApiFailure = Invalid | Conflict | NotFound | Refused | Failure

export interface TaggedError extends Record<string, unknown> {
  readonly _tag: string
  readonly message: string
}

export type ErrorStrategy = (error: TaggedError) => ApiFailure
