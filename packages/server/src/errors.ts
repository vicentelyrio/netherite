import { Conflict, Failure, Invalid, NotFound, Refused } from '@netherite/api'

export type ApiFailure = Invalid | Conflict | NotFound | Refused | Failure

interface Tagged {
  readonly _tag: string
  readonly message: string
}

const isTagged = (e: unknown): e is Tagged =>
  typeof e === 'object' && e !== null && '_tag' in e && 'message' in e

/**
 * Maps a failure from a core operation to the API's tagged errors, and so to a status (ADR-00010):
 * invalid input 422, a file that changed 409, no such item 404, a state that forbids it 409.
 * Anything else, such as a file that cannot be written, is a 500.
 */
export const toApiError = (error: unknown): ApiFailure => {
  if (!isTagged(error)) return new Failure({ message: String(error) })
  const e = error as Tagged & Record<string, unknown>
  switch (e._tag) {
    case 'ValidationError':
      return new Invalid({
        message: e.message,
        issues: (
          e.issues as ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>
        ).map((i) => ({ path: [...i.path], message: i.message })),
      })
    case 'EditError':
      return new Invalid({ message: e.message, issues: [{ path: [], message: e.message }] })
    case 'ConflictError':
      return new Conflict({
        message: e.message,
        path: e.path as string,
        expected: e.expected as string,
        ...(typeof e.actual === 'string' ? { actual: e.actual } : {}),
      })
    case 'NotFound':
      return new NotFound({ message: e.message, id: e.id as string })
    case 'AmbiguousId':
      return new Refused({
        message: e.message,
        reason: 'ambiguous-id',
        paths: [...(e.paths as ReadonlyArray<string>)],
      })
    case 'AlreadyExists':
      return new Refused({
        message: e.message,
        reason: 'already-exists',
        paths: [e.path as string],
      })
    case 'StillLinked':
      return new Refused({
        message: e.message,
        reason: 'still-linked',
        paths: (e.referrers as ReadonlyArray<{ path: string }>).map((r) => r.path),
      })
    default:
      return new Failure({ message: e.message })
  }
}
