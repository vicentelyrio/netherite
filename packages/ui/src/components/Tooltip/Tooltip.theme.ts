import { Tooltip } from '@mantine/core'
import { tooltipClasses } from './Tooltip.classes'

const openDelay = 300
const offset = 6

export const tooltipTheme = Tooltip.extend({
  classNames: tooltipClasses,
  defaultProps: { openDelay, closeDelay: 0, withArrow: false, position: 'right', offset },
})
