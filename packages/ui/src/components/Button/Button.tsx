import { Button as MantineButton } from '@mantine/core'
import { forwardRef } from 'react'
import { Icon } from '../Icon'
import { buttonLook } from './Button.constants'
import type { ButtonProps } from './Button.types'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', icon, children, ...rest },
  ref,
) {
  return (
    <MantineButton
      ref={ref}
      {...buttonLook[variant]}
      {...(icon === undefined ? {} : { leftSection: <Icon name={icon} size="inline" /> })}
      {...rest}
    >
      {children}
    </MantineButton>
  )
})
