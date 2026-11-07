import type { ActionIconProps as MantineActionIconProps } from '@mantine/core'
import type { ComponentPropsWithoutRef } from 'react'

export interface ActionIconProps
  extends Omit<MantineActionIconProps, 'children'>,
    Omit<ComponentPropsWithoutRef<'button'>, keyof MantineActionIconProps | 'aria-label'> {
  readonly icon: string
  readonly label: string
  readonly active?: boolean
  readonly tooltip?: boolean
}
