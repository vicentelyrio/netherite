/** A tool result the agent can read and act on. */
export interface ToolResult {
  [key: string]: unknown
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

export const ok = (value: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
})

export const failure = (error: Record<string, unknown>): ToolResult => ({
  isError: true,
  content: [{ type: 'text', text: JSON.stringify({ error }, null, 2) }],
})

interface Tagged {
  readonly _tag: string
  readonly message: string
}

const isTagged = (value: unknown): value is Tagged =>
  typeof value === 'object' && value !== null && '_tag' in value && 'message' in value

/**
 * Turns a failure from core into a structured error: a `type`, a `message`, and the details an
 * agent needs to correct itself. Validation errors list each field, so a bad value can be fixed
 * without guessing. Anything unexpected is reported plainly, without internals.
 */
export const describeError = (error: unknown): ToolResult => {
  if (!isTagged(error))
    return failure({ type: 'InternalError', message: 'Something went wrong. It has been logged.' })
  const detail = error as unknown as Record<string, unknown>
  switch (error._tag) {
    case 'ValidationError': {
      const issues = detail.issues as ReadonlyArray<{
        path: ReadonlyArray<string | number>
        message: string
      }>
      return failure({
        type: 'ValidationError',
        message: 'The request is not valid. Fix the listed fields and try again.',
        issues: issues.map((i) => ({ field: i.path.join('.') || '(item)', message: i.message })),
      })
    }
    case 'ConflictError':
      return failure({
        type: 'ConflictError',
        message: `${detail.path} changed since it was read. Read it again with \`get\`, check your change still applies, and retry with the new hash.`,
        path: detail.path,
        expected: detail.expected,
        actual: detail.actual,
      })
    case 'NotFound':
      return failure({ type: 'NotFound', message: error.message, id: detail.id })
    case 'AmbiguousId':
      return failure({
        type: 'AmbiguousId',
        message: error.message,
        id: detail.id,
        paths: detail.paths,
      })
    case 'StillLinked':
      return failure({
        type: 'StillLinked',
        message: `${error.message}`,
        id: detail.id,
        referrers: detail.referrers,
      })
    case 'EditError':
      return failure({ type: 'EditError', message: error.message, reason: detail.reason })
    case 'AlreadyExists':
      return failure({ type: 'AlreadyExists', message: error.message, path: detail.path })
    case 'IoError':
      return failure({ type: 'IoError', message: error.message })
    default:
      return failure({ type: error._tag, message: error.message })
  }
}
