import { Icon } from '../Icon'
import { closeIcon, dismissLabel } from './Banner.constants'

export function BannerClose({ onClose }: { readonly onClose: () => void }) {
  return (
    <button type="button" className="nt-banner-close" aria-label={dismissLabel} onClick={onClose}>
      <Icon name={closeIcon} size="inline" />
    </button>
  )
}
