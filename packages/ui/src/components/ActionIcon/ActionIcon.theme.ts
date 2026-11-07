import { ActionIcon } from '@mantine/core'
import { actionIconClasses } from './ActionIcon.classes'

export const actionIconTheme = ActionIcon.extend({
  classNames: actionIconClasses,
  defaultProps: { variant: 'subtle', color: 'gray', size: 'lg', radius: 'sm' },
})
