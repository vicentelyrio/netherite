import { createTheme, type MantineThemeOverride } from '@mantine/core'
import { mantineTheme } from '@netherite/tokens'
import { actionIconTheme } from '../components/ActionIcon/ActionIcon.theme'
import { avatarTheme } from '../components/Avatar/Avatar.theme'
import { buttonTheme } from '../components/Button/Button.theme'
import { cardTheme } from '../components/Card/Card.theme'
import { chipTheme } from '../components/Chip/Chip.theme'
import { drawerTheme } from '../components/Drawer/Drawer.theme'
import { gridTheme } from '../components/Grid/Grid.theme'
import { menuTheme } from '../components/Menu/Menu.theme'
import { modalTheme } from '../components/Modal/Modal.theme'
import { progressTheme } from '../components/Progress/Progress.theme'
import { selectTheme } from '../components/SearchSelect/SearchSelect.theme'
import { segmentedControlTheme } from '../components/SegmentedControl/SegmentedControl.theme'
import { switchTheme } from '../components/Switch/Switch.theme'
import { tabsTheme } from '../components/Tabs/Tabs.theme'
import { tooltipTheme } from '../components/Tooltip/Tooltip.theme'

export const theme: MantineThemeOverride = createTheme({
  ...(mantineTheme as unknown as MantineThemeOverride),
  components: {
    Grid: gridTheme,
    Button: buttonTheme,
    ActionIcon: actionIconTheme,
    Chip: chipTheme,
    Avatar: avatarTheme,
    Card: cardTheme,
    Progress: progressTheme,
    SegmentedControl: segmentedControlTheme,
    Tabs: tabsTheme,
    Select: selectTheme,
    Switch: switchTheme,
    Tooltip: tooltipTheme,
    Menu: menuTheme,
    Modal: modalTheme,
    Drawer: drawerTheme,
  },
})
