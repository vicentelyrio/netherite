import { Failure } from '@netherite/api'
import type { ApiFailure, TaggedError } from './errors.types'
import { errorStrategies } from './strategies'

const isTagged = (error: unknown): error is TaggedError =>
  typeof error === 'object' && error !== null && '_tag' in error && 'message' in error

export const toApiError = (error: unknown): ApiFailure => {
  if (!isTagged(error)) return new Failure({ message: String(error) })
  const strategy = errorStrategies[error._tag]
  return strategy === undefined ? new Failure({ message: error.message }) : strategy(error)
}
