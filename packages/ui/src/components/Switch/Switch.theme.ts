import { Switch } from '@mantine/core'
import { switchClasses } from './Switch.classes'

export const switchTheme = Switch.extend({
  classNames: switchClasses,
  defaultProps: { size: 'sm' },
})
