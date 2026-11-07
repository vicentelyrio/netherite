import { Button } from '@mantine/core'
import { buttonClasses } from './Button.classes'

export const buttonTheme = Button.extend({
  classNames: buttonClasses,
  defaultProps: { size: 'sm', radius: 'sm' },
})
