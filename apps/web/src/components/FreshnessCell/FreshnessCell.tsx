import { Icon } from '@netherite/ui'
import './FreshnessCell.css'

export interface FreshnessCellProps {
  /** `null` for an item that is not tracked (an ADR that is not in force). */
  readonly freshness: 'fresh' | 'drifting' | 'stale' | 'unknown' | null
  /** How many commits touched what it covers since it was reviewed. */
  readonly commits: number
}

/** How current a doc is: fresh, a dot and the commits it is behind, or stale with a warning. */
export function FreshnessCell({ freshness, commits }: FreshnessCellProps) {
  if (freshness === 'stale') {
    return (
      <span className="kn-fresh kn-fresh--stale">
        <Icon name="warning" size={15} filled /> Stale · {commits} commits
      </span>
    )
  }
  if (freshness === 'drifting') {
    return (
      <span className="kn-fresh kn-fresh--drift">
        <span className="kn-dot kn-dot--ring" /> {commits} commits behind
      </span>
    )
  }
  if (freshness === 'fresh') {
    return (
      <span className="kn-fresh">
        <span className="kn-dot" /> Fresh
      </span>
    )
  }
  return <span className="kn-fresh kn-fresh--na">Not tracked</span>
}
