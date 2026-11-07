import { actionIconClasses } from '../components/ActionIcon/ActionIcon.classes'
import { avatarClasses } from '../components/Avatar/Avatar.classes'
import { buttonClasses } from '../components/Button/Button.classes'
import { cardClasses } from '../components/Card/Card.classes'
import { chipClasses } from '../components/Chip/Chip.classes'
import { drawerClasses } from '../components/Drawer/Drawer.classes'
import { menuClasses } from '../components/Menu/Menu.classes'
import { modalClasses } from '../components/Modal/Modal.classes'
import { progressClasses } from '../components/Progress/Progress.classes'
import { selectClasses } from '../components/SearchSelect/SearchSelect.classes'
import { segmentedClasses } from '../components/SegmentedControl/SegmentedControl.classes'
import { switchClasses } from '../components/Switch/Switch.classes'
import { tabsClasses } from '../components/Tabs/Tabs.classes'
import { tooltipClasses } from '../components/Tooltip/Tooltip.classes'

export const classNames = {
  button: buttonClasses,
  actionIcon: actionIconClasses,
  chip: chipClasses,
  avatar: avatarClasses,
  card: cardClasses,
  progress: progressClasses,
  segmented: segmentedClasses,
  tabs: tabsClasses,
  switch: switchClasses,
  select: selectClasses,
  tooltip: tooltipClasses,
  menu: menuClasses,
  modal: modalClasses,
  drawer: drawerClasses,
} as const
