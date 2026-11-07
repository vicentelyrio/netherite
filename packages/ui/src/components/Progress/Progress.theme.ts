import { Progress } from '@mantine/core'
import { progressClasses } from './Progress.classes'

const defaultSize = 32

export const progressTheme = Progress.extend({
  classNames: progressClasses,
  defaultProps: { size: defaultSize, radius: 'xl' },
})
