import { Modal } from '@mantine/core'
import { colorVar } from '@netherite/tokens'
import { modalClasses } from './Modal.classes'

const overlayOpacity = 0.55

export const modalTheme = Modal.extend({
  classNames: modalClasses,
  defaultProps: {
    centered: true,
    radius: 'lg',
    overlayProps: { backgroundOpacity: overlayOpacity, color: colorVar.bg.stage },
  },
})
