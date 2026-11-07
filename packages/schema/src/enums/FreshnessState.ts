export const FreshnessState = {
  Fresh: 'fresh',
  Drifting: 'drifting',
  Stale: 'stale',
  NotTracked: 'not-tracked',
} as const

export type FreshnessState = (typeof FreshnessState)[keyof typeof FreshnessState]
