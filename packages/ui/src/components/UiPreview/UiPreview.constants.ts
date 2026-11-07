import type { StateCategory } from '@netherite/tokens'
import type { RailItem } from '../Rail'

export const railItems: ReadonlyArray<RailItem> = [
  { id: 'search', label: 'Search', icon: 'search', hint: '⌘K' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', hint: '⌘I', badge: 3, group: 'inbox' },
  { id: 'goals', label: 'Goals', icon: 'track_changes', hint: '⌘G', group: 'work' },
  { id: 'projects', label: 'Projects', icon: 'task_alt', hint: '⌘P', group: 'work' },
  { id: 'knowledge', label: 'Knowledge', icon: 'stacks', hint: '⌘L', group: 'work' },
  { id: 'stats', label: 'Stats', icon: 'bar_chart', hint: '⌘D', group: 'insight' },
  { id: 'tags', label: 'Tags', icon: 'sell', hint: '⌘T', group: 'insight' },
  { id: 'graph', label: 'Graph', icon: 'hub', hint: '⇧⌘G', group: 'insight' },
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
