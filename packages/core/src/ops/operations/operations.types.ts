import type { ValidationError } from '@netherite/schema'
import type { Effect, FileSystem, Path } from 'effect'
import type {
  AlreadyExists,
  AmbiguousId,
  ConflictError,
  EditError,
  IoError,
  NotFound,
  StillLinked,
} from '../../errors'
import type { ScannedItem } from '../../scanned-item'

export type OpError =
  | ValidationError
  | EditError
  | ConflictError
  | NotFound
  | AmbiguousId
  | AlreadyExists
  | StillLinked
  | IoError

export type OpEnv = FileSystem.FileSystem | Path.Path

export interface OpOptions {
  readonly baseHash?: string
}

export interface OpResult {
  readonly id: string
  readonly path: string
  readonly item: ScannedItem
  readonly hash: string
  readonly changed: ReadonlyArray<string>
  readonly unchanged: boolean
}

export type Op<A = OpResult> = Effect.Effect<A, OpError, OpEnv>

export interface Step {
  readonly id: string
  readonly baseHash?: string | undefined
  readonly edit: (
    source: string,
    item: ScannedItem,
  ) => Effect.Effect<string, EditError | ValidationError>
}
