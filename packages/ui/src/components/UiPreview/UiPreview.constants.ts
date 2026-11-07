import type { StateCategory } from '@netherite/tokens'
import type { RailItem } from '../Rail'

export const railItems: ReadonlyArray<RailItem> = [
  { id: 'search', label: 'Search', icon: 'search', shortcut: 'mod+k' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', shortcut: 'mod+i', badge: 3, group: 'inbox' },
  { id: 'goals', label: 'Goals', icon: 'track_changes', shortcut: 'mod+g', group: 'work' },
  { id: 'projects', label: 'Projects', icon: 'task_alt', shortcut: 'mod+p', group: 'work' },
  { id: 'knowledge', label: 'Knowledge', icon: 'stacks', shortcut: 'mod+l', group: 'work' },
  { id: 'stats', label: 'Stats', icon: 'bar_chart', shortcut: 'mod+d', group: 'insight' },
  { id: 'tags', label: 'Tags', icon: 'sell', shortcut: 'mod+t', group: 'insight' },
  { id: 'graph', label: 'Graph', icon: 'hub', shortcut: 'mod+shift+g', group: 'insight' },
]

export const states: ReadonlyArray<readonly [string, StateCategory]> = [
  ['backlog', 'todo'],
  ['in progress', 'active'],
  ['on hold', 'blocked'],
  ['done', 'done'],
]

export const previewUser = 'vicentelyrio'
export const defaultActive = 'goals'
export const avatarSize = 32
export const progressMaxWidth = 320
export const bigRingSize = 56
export const cardBodyGap = 6
