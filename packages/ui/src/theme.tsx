import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Chip,
  createTheme,
  Drawer,
  type MantineThemeOverride,
  Menu,
  Modal,
  Progress,
  RingProgress,
  SegmentedControl,
  Switch,
  Tabs,
  Tooltip,
} from '@mantine/core'
import { color, layout, mantineTheme } from '@netherite/tokens'

/**
 * The class names the theme gives each component's parts, styled in `components.css`. Keeping
 * them in one place lets a test check that every one has a rule.
 */
export const classNames = {
  button: { root: 'nt-button', label: 'nt-button-label', section: 'nt-button-section' },
  actionIcon: { root: 'nt-action-icon' },
  chip: { label: 'nt-chip', iconWrapper: 'nt-chip-icon' },
  avatar: { root: 'nt-avatar', placeholder: 'nt-avatar-placeholder' },
  card: { root: 'nt-card' },
  progress: { root: 'nt-progress', section: 'nt-progress-section' },
  ring: { root: 'nt-ring', label: 'nt-ring-label' },
  segmented: {
    root: 'nt-segmented',
    indicator: 'nt-segmented-indicator',
    label: 'nt-segmented-label',
  },
  tabs: { list: 'nt-tabs-list', tab: 'nt-tab', panel: 'nt-tab-panel' },
  switch: { track: 'nt-switch-track', thumb: 'nt-switch-thumb', label: 'nt-switch-label' },
  tooltip: { tooltip: 'nt-tooltip' },
  menu: {
    dropdown: 'nt-menu',
    item: 'nt-menu-item',
    label: 'nt-menu-label',
    divider: 'nt-menu-divider',
  },
  modal: {
    content: 'nt-modal',
    header: 'nt-modal-header',
    title: 'nt-modal-title',
    body: 'nt-modal-body',
  },
  drawer: {
    content: 'nt-drawer',
    header: 'nt-drawer-header',
    title: 'nt-drawer-title',
    body: 'nt-drawer-body',
  },
} as const

/**
 * The tokens' theme with each component's defaults and classes: sizes are dense, corners are
 * small, tooltips wait a moment, and modals and drawers use the design's widths.
 */
export const theme: MantineThemeOverride = createTheme({
  ...(mantineTheme as unknown as MantineThemeOverride),
  components: {
    Button: Button.extend({
      classNames: classNames.button,
      defaultProps: { size: 'sm', radius: 'sm' },
    }),
    ActionIcon: ActionIcon.extend({
      classNames: classNames.actionIcon,
      defaultProps: { variant: 'subtle', color: 'gray', size: 'lg', radius: 'sm' },
    }),
    Chip: Chip.extend({
      classNames: classNames.chip,
      defaultProps: { size: 'sm', variant: 'outline' },
    }),
    Avatar: Avatar.extend({
      classNames: classNames.avatar,
      defaultProps: { size: 32, radius: 'xl' },
    }),
    Card: Card.extend({
      classNames: classNames.card,
      defaultProps: { padding: 0, radius: 'md', withBorder: true },
    }),
    Progress: Progress.extend({
      classNames: classNames.progress,
      defaultProps: { size: 32, radius: 'xl' },
    }),
    RingProgress: RingProgress.extend({
      classNames: classNames.ring,
      defaultProps: { size: 56, thickness: 5, roundCaps: true },
    }),
    SegmentedControl: SegmentedControl.extend({
      classNames: classNames.segmented,
      defaultProps: { size: 'sm', radius: 'sm' },
    }),
    Tabs: Tabs.extend({
      classNames: classNames.tabs,
      defaultProps: { variant: 'default', keepMounted: false },
    }),
    Switch: Switch.extend({ classNames: classNames.switch, defaultProps: { size: 'sm' } }),
    Tooltip: Tooltip.extend({
      classNames: classNames.tooltip,
      defaultProps: {
        openDelay: 300,
        closeDelay: 0,
        withArrow: false,
        position: 'right',
        offset: 6,
      },
    }),
    Menu: Menu.extend({
      classNames: classNames.menu,
      defaultProps: { radius: 'md', withinPortal: true, position: 'bottom-start' },
    }),
    Modal: Modal.extend({
      classNames: classNames.modal,
      defaultProps: {
        centered: true,
        radius: 'lg',
        overlayProps: { backgroundOpacity: 0.55, color: color.bg.overlay },
      },
    }),
    Drawer: Drawer.extend({
      classNames: classNames.drawer,
      defaultProps: {
        position: 'right',
        size: layout.drawer.text,
        overlayProps: { backgroundOpacity: 0.4 },
      },
    }),
  },
})
