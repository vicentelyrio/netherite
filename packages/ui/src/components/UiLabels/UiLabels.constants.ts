import { freshnessText } from '../FreshnessLabel/FreshnessLabel.constants'
import { typeLabels } from '../TypeBadge/TypeBadge.constants'
import type { UiLabels } from './UiLabels.types'

export const defaultUiLabels: UiLabels = {
  dismiss: 'Dismiss',
  waiting: (label, count) => `${label}, ${count} waiting`,
  progress: 'Progress',
  progressOf: (label, done, total) => `${label}: ${done} of ${total} done`,
  freshness: freshnessText,
  types: typeLabels,
  adrStatus: {
    proposed: 'Proposed',
    accepted: 'Accepted',
    deprecated: 'Deprecated',
    superseded: 'Superseded',
  },
  commits: (count, atLeast) =>
    `${count}${atLeast ? '+' : ''} ${count === 1 && !atLeast ? 'commit' : 'commits'}`,
  coveredSince: (commits, since) => `${commits} to covered files since ${since}`,
}
