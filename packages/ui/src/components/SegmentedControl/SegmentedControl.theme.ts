import { SegmentedControl } from '@mantine/core'
import { segmentedClasses } from './SegmentedControl.classes'

export const segmentedControlTheme = SegmentedControl.extend({
  classNames: segmentedClasses,
  defaultProps: { size: 'sm', radius: 'sm' },
})
