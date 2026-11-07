import type { StateCategory } from '@netherite/schema'

export type Phase = StateCategory

export type LifecycleKind =
  | 'created'
  | 'started'
  | 'held'
  | 'resumed'
  | 'finished'
  | 'reopened'
  | 'rescheduled'
  | 'proposed'
  | 'accepted'
  | 'deprecated'
  | 'superseded'

export interface LifecycleEvent {
  readonly kind: LifecycleKind
  readonly date: string
  readonly hash: string
  readonly from?: string
  readonly to?: string
  readonly approximate: boolean
}

export interface Span {
  readonly phase: Phase
  readonly from: string
  readonly to?: string
}

export interface Lifecycle {
  readonly id: string
  readonly type: string | undefined
  readonly events: ReadonlyArray<LifecycleEvent>
  readonly spans: ReadonlyArray<Span>
  readonly created?: string
  readonly started?: string
  readonly finished?: string
  readonly ended?: string
  readonly waitingDays: number
  readonly due?: string
  readonly rescheduled: number
  readonly approximate: boolean
}

export interface LifecycleOptions {
  readonly states: ReadonlyArray<{ readonly name: string; readonly category: StateCategory }>
  readonly now?: string
}
