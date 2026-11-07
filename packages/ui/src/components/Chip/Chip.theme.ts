import { Chip } from '@mantine/core'
import { chipClasses } from './Chip.classes'

export const chipTheme = Chip.extend({
  classNames: chipClasses,
  defaultProps: { size: 'sm', variant: 'outline' },
})
