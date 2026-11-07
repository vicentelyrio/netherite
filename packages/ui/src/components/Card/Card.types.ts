import type { CardProps as MantineCardProps } from '@mantine/core'
import type { ReactNode } from 'react'

export interface CardProps extends MantineCardProps {
  readonly selected?: boolean
  readonly dropTarget?: boolean
  readonly interactive?: boolean
  readonly onClick?: () => void
  readonly children?: ReactNode
}
