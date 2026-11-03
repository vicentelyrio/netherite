import { Icon } from '@netherite/ui'
import { statusStyle } from '../lanes'
import './StatusChip.css'

/** An ADR status as a small coloured chip; faded for the status it came from. */
export function StatusChip({
  status,
  faded,
}: {
  readonly status: string
  readonly faded?: boolean
}) {
  const s = statusStyle[status] ?? { label: status, color: '#b9bcd3', icon: 'circle' }
  return (
    <span
      className="dl-chip"
      data-status={status}
      style={{ ['--dl' as string]: s.color, opacity: faded ? 0.7 : 1 }}
    >
      <Icon name={s.icon} size={13} /> {s.label}
    </span>
  )
}
