import { Icon } from '../Icon'
import { bannerIconSize, bannerIcons } from './Banner.constants'
import type { BannerProps } from './Banner.types'
import { BannerClose } from './BannerClose'
import { bannerRole } from './bannerRole'

export function Banner({
  variant = 'info',
  title,
  children,
  actions,
  onClose,
  className,
}: BannerProps) {
  return (
    <div
      className={className ? `nt-banner ${className}` : 'nt-banner'}
      data-variant={variant}
      role={bannerRole(variant)}
    >
      <Icon
        name={bannerIcons[variant]}
        size={bannerIconSize}
        filled={variant === 'warning'}
        className="nt-banner-icon"
      />
      <div className="nt-banner-body">
        {title !== undefined && <div className="nt-banner-title">{title}</div>}
        {children !== undefined && <div className="nt-banner-text">{children}</div>}
      </div>
      {actions !== undefined && <div className="nt-banner-actions">{actions}</div>}
      {onClose !== undefined && <BannerClose onClose={onClose} />}
    </div>
  )
}
