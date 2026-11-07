import { Conflict, Invalid, NotFound, Refused } from '@netherite/api'
import type { ErrorStrategy } from './errors.types'

const RefusedReason = {
  AmbiguousId: 'ambiguous-id',
  AlreadyExists: 'already-exists',
  StillLinked: 'still-linked',
} as const

type Issue = { readonly path: ReadonlyArray<string | number>; readonly message: string }

export const errorStrategies: Readonly<Record<string, ErrorStrategy>> = {
  ValidationError: (e) =>
    new Invalid({
      message: e.message,
      issues: (e.issues as ReadonlyArray<Issue>).map((i) => ({
        path: [...i.path],
        message: i.message,
      })),
    }),
  EditError: (e) => new Invalid({ message: e.message, issues: [{ path: [], message: e.message }] }),
  ConflictError: (e) =>
    new Conflict({
      message: e.message,
      path: e.path as string,
      expected: e.expected as string,
      ...(typeof e.actual === 'string' ? { actual: e.actual } : {}),
    }),
  NotFound: (e) => new NotFound({ message: e.message, id: e.id as string }),
  AmbiguousId: (e) =>
    new Refused({
      message: e.message,
      reason: RefusedReason.AmbiguousId,
      paths: [...(e.paths as ReadonlyArray<string>)],
    }),
  AlreadyExists: (e) =>
    new Refused({
      message: e.message,
      reason: RefusedReason.AlreadyExists,
      paths: [e.path as string],
    }),
  StillLinked: (e) =>
    new Refused({
      message: e.message,
      reason: RefusedReason.StillLinked,
      paths: (e.referrers as ReadonlyArray<{ path: string }>).map((r) => r.path),
    }),
}
