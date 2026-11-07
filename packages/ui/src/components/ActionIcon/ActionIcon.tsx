import { ActionIcon as MantineActionIcon } from '@mantine/core'
import { forwardRef } from 'react'
import { Icon } from '../Icon'
import { Tooltip } from '../Tooltip'
import type { ActionIconProps } from './ActionIcon.types'

export const ActionIcon = forwardRef<HTMLButtonElement, ActionIconProps>(function ActionIcon(
  { icon, label, active, tooltip = true, ...rest },
  ref,
) {
  const button = (
    <MantineActionIcon
      ref={ref}
      aria-label={label}
      {...(active === undefined
        ? {}
        : { 'aria-pressed': active, 'data-active': active || undefined })}
      {...rest}
    >
      <Icon name={icon} size="switcher" />
    </MantineActionIcon>
  )
  return tooltip ? <Tooltip label={label}>{button}</Tooltip> : button
})
