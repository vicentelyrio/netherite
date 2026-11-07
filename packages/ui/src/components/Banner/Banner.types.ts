import type { ReactNode } from 'react'

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger'

export interface BannerProps {
  readonly variant?: BannerVariant
  readonly title?: string
  readonly children?: ReactNode
  readonly actions?: ReactNode
  readonly onClose?: () => void
  readonly className?: string
}
