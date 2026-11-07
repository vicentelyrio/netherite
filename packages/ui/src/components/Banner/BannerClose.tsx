import { Icon } from '../Icon'
import { useUiLabels } from '../UiLabels'
import { closeIcon } from './Banner.constants'

export function BannerClose({ onClose }: { readonly onClose: () => void }) {
  const { dismiss } = useUiLabels()
  return (
    <button type="button" className="nt-banner-close" aria-label={dismiss} onClick={onClose}>
      <Icon name={closeIcon} size="inline" />
    </button>
  )
}
