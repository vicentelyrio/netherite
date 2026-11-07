import { Schema } from 'effect'
import { Conflict, Failure, Invalid, NotFound, Refused } from '../errors'

export const id = { id: Schema.String }

export const writes = [Invalid, Conflict, NotFound, Refused, Failure] as const
