import { Select } from '@mantine/core'
import { selectClasses } from './SearchSelect.classes'

export const selectTheme = Select.extend({
  classNames: selectClasses,
  defaultProps: { size: 'sm', radius: 'sm', withCheckIcon: false },
})
