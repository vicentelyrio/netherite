import type { ToolResult } from './errors'
import { failure } from './errors'

type Detail = Record<string, unknown> & { readonly _tag: string; readonly message: string }

const isTagged = (value: unknown): value is Detail =>
  typeof value === 'object' && value !== null && '_tag' in value && 'message' in value

const validationMessage = 'The request is not valid. Fix the listed fields and try again.'
const internalMessage = 'Something went wrong. It has been logged.'
const wholeItem = '(item)'

const describers: Readonly<Record<string, (e: Detail) => ToolResult>> = {
  ValidationError: (e) =>
    failure({
      type: e._tag,
      message: validationMessage,
      issues: (
        e.issues as ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>
      ).map((i) => ({ field: i.path.join('.') || wholeItem, message: i.message })),
    }),
  ConflictError: (e) =>
    failure({
      type: e._tag,
      message: `${e.path} changed since it was read. Read it again with \`get\`, check your change still applies, and retry with the new hash.`,
      path: e.path,
      expected: e.expected,
      actual: e.actual,
    }),
  NotFound: (e) => failure({ type: e._tag, message: e.message, id: e.id }),
  AmbiguousId: (e) => failure({ type: e._tag, message: e.message, id: e.id, paths: e.paths }),
  StillLinked: (e) =>
    failure({ type: e._tag, message: e.message, id: e.id, referrers: e.referrers }),
  EditError: (e) => failure({ type: e._tag, message: e.message, reason: e.reason }),
  AlreadyExists: (e) => failure({ type: e._tag, message: e.message, path: e.path }),
}

export const describeError = (error: unknown): ToolResult => {
  if (!isTagged(error)) return failure({ type: 'InternalError', message: internalMessage })
  const describer = describers[error._tag]
  return describer === undefined
    ? failure({ type: error._tag, message: error.message })
    : describer(error)
}
