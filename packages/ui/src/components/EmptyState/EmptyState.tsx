import { Icon } from '../Icon'
import { defaultIcon, iconSize, iconWeight } from './EmptyState.constants'
import type { EmptyStateProps } from './EmptyState.types'

export function EmptyState({ icon = defaultIcon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="nt-empty">
      <Icon name={icon} size={iconSize} weight={iconWeight} className="nt-empty-icon" />
      <h3 className="nt-empty-title">{title}</h3>
      {description !== undefined && <p className="nt-empty-text">{description}</p>}
      {actions !== undefined && <div className="nt-empty-actions">{actions}</div>}
    </div>
  )
}
