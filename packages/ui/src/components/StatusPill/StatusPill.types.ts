import type { AdrStatus, StateCategory } from '@netherite/tokens'

export interface AdrStatusPillProps {
  readonly status: AdrStatus
}

export interface TaskStatePillProps {
  readonly state: string
  readonly category: StateCategory
}

export type StatusPillProps =
  | ({ readonly kind: 'adr' } & AdrStatusPillProps)
  | ({ readonly kind: 'state' } & TaskStatePillProps)
