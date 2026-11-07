import { Effect } from 'effect'
import { InvalidGitArgument } from '../errors'

const refPattern = /^[A-Za-z0-9._/@^~-]+$/

export const datePattern = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:?\d{2})?)?$/

export const checkRef = (name: string, value: string) =>
  refPattern.test(value) && !value.startsWith('-') && !value.includes('..')
    ? Effect.void
    : Effect.fail(new InvalidGitArgument({ name, value }))
