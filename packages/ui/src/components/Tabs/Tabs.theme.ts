import { Tabs } from '@mantine/core'
import { tabsClasses } from './Tabs.classes'

export const tabsTheme = Tabs.extend({
  classNames: tabsClasses,
  defaultProps: { variant: 'default', keepMounted: false },
})
