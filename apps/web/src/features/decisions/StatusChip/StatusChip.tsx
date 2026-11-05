import { Icon } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { statusLabel, statusStyle } from '../lanes'
import './StatusChip.css'

export function StatusChip({
  status,
  faded,
}: {
  readonly status: string
  readonly faded?: boolean
}) {
  const { LL } = useI18nContext()
  const s = statusStyle[status] ?? { label: status, color: '#b9bcd3', icon: 'circle' }
  return (
    <span
      className="dl-chip"
      data-status={status}
      style={{ ['--dl' as string]: s.color, opacity: faded ? 0.7 : 1 }}
    >
      <Icon name={s.icon} size={13} /> {statusLabel(LL, status)}
    </span>
  )
}
