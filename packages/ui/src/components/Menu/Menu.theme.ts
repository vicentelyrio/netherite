import { Menu } from '@mantine/core'
import { menuClasses } from './Menu.classes'

export const menuTheme = Menu.extend({
  classNames: menuClasses,
  defaultProps: { radius: 'md', withinPortal: true, position: 'bottom-start' },
})
