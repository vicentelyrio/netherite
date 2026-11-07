import type { BannerVariant } from './Banner.types'

export const bannerRole = (variant: BannerVariant) =>
  variant === 'danger' || variant === 'warning' ? 'alert' : 'status'
