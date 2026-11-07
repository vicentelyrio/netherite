import { Drawer } from '@mantine/core'
import { layout } from '@netherite/tokens'
import { drawerClasses } from './Drawer.classes'

const overlayOpacity = 0.4

export const drawerTheme = Drawer.extend({
  classNames: drawerClasses,
  defaultProps: {
    position: 'right',
    size: layout.drawer.text,
    overlayProps: { backgroundOpacity: overlayOpacity },
  },
})
