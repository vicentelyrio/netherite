import type { Thresholds } from './freshness.types'

export const stateFor = (
  commits: number,
  thresholds: Thresholds,
): 'fresh' | 'drifting' | 'stale' =>
  commits >= thresholds.stale ? 'stale' : commits >= thresholds.drifting ? 'drifting' : 'fresh'
