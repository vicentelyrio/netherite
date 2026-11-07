import type { BannerVariant } from '@netherite/ui'

export interface Notice {
  readonly id: number
  readonly variant: BannerVariant
  readonly title: string
  readonly text?: string
  readonly actions?: ReadonlyArray<{ readonly label: string; readonly run: () => void }>
  readonly persistent?: boolean
}

export interface Notices {
  readonly notify: (notice: Omit<Notice, 'id'>) => () => void
  readonly dismissAll: () => void
}
