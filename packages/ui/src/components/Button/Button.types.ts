import type { ButtonProps as MantineButtonProps } from '@mantine/core'
import type { ComponentPropsWithoutRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger'

export interface ButtonProps
  extends Omit<MantineButtonProps, 'variant' | 'color' | 'leftSection' | 'rightSection'>,
    Omit<ComponentPropsWithoutRef<'button'>, keyof MantineButtonProps> {
  readonly variant?: ButtonVariant
  readonly icon?: string
}
