import type { FreshnessState } from '@netherite/tokens'

export interface FreshnessLabelProps {
  readonly state: FreshnessState
  readonly commits?: number
  readonly atLeast?: boolean
  readonly since?: string | null
}
