import { Icon } from '../Icon'
import { orphanIcon, orphanIconSize, orphanLabel } from './OrphanTag.constants'

export function OrphanTag() {
  return (
    <span className="nt-orphan">
      <Icon name={orphanIcon} size={orphanIconSize} />
      {orphanLabel}
    </span>
  )
}
