import type { ReactNode } from 'react'

export interface EmptyStateProps {
  readonly icon?: string
  readonly title: string
  readonly description?: ReactNode
  readonly actions?: ReactNode
}
