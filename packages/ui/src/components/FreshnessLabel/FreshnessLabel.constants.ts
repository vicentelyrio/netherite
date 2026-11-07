import type { FreshnessState } from '@netherite/tokens'

export const freshnessText: Record<FreshnessState, string> = {
  fresh: 'Fresh',
  drifting: 'Drifting',
  stale: 'Stale',
  unknown: 'Not tracked',
}

export const staleIcon = 'warning'
