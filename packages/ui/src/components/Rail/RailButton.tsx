import { Tooltip } from '@mantine/core'
import { Icon } from '../Icon'
import { Kbd } from '../Kbd'
import { useUiLabels } from '../UiLabels'
import type { RailItem } from './Rail.types'
import { RailBadge } from './RailBadge'

export function RailButton({
  item,
  current,
  onSelect,
}: {
  readonly item: RailItem
  readonly current: boolean
  readonly onSelect: (id: string) => void
}) {
  const { hint } = item
  const labels = useUiLabels()
  return (
    <div className="nt-rail-slot">
      <Tooltip
        label={
          <span className="nt-rail-tip">
            {item.label}
            {hint !== undefined && <Kbd>{hint}</Kbd>}
          </span>
        }
      >
        <button
          type="button"
          className="nt-rail-item"
          data-active={current || undefined}
          aria-current={current ? 'page' : undefined}
          aria-label={item.badge ? labels.waiting(item.label, item.badge) : item.label}
          {...(hint === undefined ? {} : { 'aria-keyshortcuts': hint })}
          onClick={() => onSelect(item.id)}
        >
          <Icon name={item.icon} size="rail" />
          {item.badge !== undefined && item.badge > 0 && <RailBadge count={item.badge} />}
        </button>
      </Tooltip>
    </div>
  )
}
