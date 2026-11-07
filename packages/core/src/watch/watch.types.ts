import { Data, type Effect, type Scope, type Stream } from 'effect'
import type { ConfigInvalid, ConfigReadError } from '../errors'
import type { ParseOptions } from '../parse-pool'

export type ChangeEvent =
  | {
      readonly _tag: 'ItemsChanged'
      readonly upserted: ReadonlyArray<string>
      readonly removed: ReadonlyArray<string>
      readonly affected: ReadonlyArray<string>
    }
  | {
      readonly _tag: 'GitChanged'
    }
  | {
      readonly _tag: 'ConfigChanged'
      readonly requiresRestart: boolean
    }
  | {
      readonly _tag: 'ConfigInvalid'
      readonly error: ConfigInvalid | ConfigReadError
    }

export class WatchError extends Data.TaggedError('WatchError')<{
  readonly path: string
  readonly cause: unknown
}> {
  override get message() {
    return `Cannot watch ${this.path}: ${this.cause instanceof Error ? this.cause.message : String(this.cause)}`
  }
}

export interface RawEvent {
  readonly path: string
}

export interface WatchBackend {
  readonly subscribe: (
    dir: string,
    onEvents: (events: ReadonlyArray<RawEvent>) => void,
    options: { readonly ignore: ReadonlyArray<string> },
  ) => Promise<{ readonly unsubscribe: () => Promise<void> }>
}

export interface WatchOptions {
  readonly debounceMs?: number
  readonly backend?: WatchBackend
  readonly parse?: ParseOptions
  readonly gitDir?: string
}

export interface Watcher {
  readonly events: Stream.Stream<ChangeEvent>
  readonly listen: (listener: (event: ChangeEvent) => void) => () => void
  readonly flush: Effect.Effect<void>
}

export type WatchScope = Scope.Scope
