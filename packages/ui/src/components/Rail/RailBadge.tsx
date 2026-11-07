import { maxBadge } from './Rail.constants'

export function RailBadge({ count }: { readonly count: number }) {
  return (
    <span className="nt-rail-badge" aria-hidden="true">
      {count > maxBadge ? `${maxBadge}+` : count}
    </span>
  )
}
