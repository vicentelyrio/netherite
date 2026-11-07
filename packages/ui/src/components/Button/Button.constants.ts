import type { ButtonProps as MantineButtonProps } from '@mantine/core'
import type { ButtonVariant } from './Button.types'

export const buttonLook: Record<ButtonVariant, Pick<MantineButtonProps, 'variant' | 'color'>> = {
  primary: { variant: 'filled', color: 'lavender' },
  secondary: { variant: 'default' },
  subtle: { variant: 'subtle', color: 'gray' },
  danger: { variant: 'filled', color: 'danger' },
}
