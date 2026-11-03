import type { RailItem } from '@netherite/ui'
import type { ActionId } from '@/infrastructure/shortcuts'

/** The rail's items and where each goes (Rail.dc.html). Command-K opens search instead of a page. */
export const railItems: ReadonlyArray<
  Omit<RailItem, 'shortcut' | 'aliases'> & { readonly to?: string }
> = [
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox', group: 'inbox', to: '/inbox' },
  {
    id: 'goals',
    label: 'Goals',
    icon: 'track_changes',
    group: 'work',
    to: '/goals',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'task_alt',
    group: 'work',
    to: '/projects',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: 'stacks',
    group: 'work',
    to: '/knowledge',
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: 'bar_chart',
    group: 'insight',
    to: '/stats',
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: 'sell',
    group: 'insight',
    to: '/tags',
  },
  {
    id: 'graph',
    label: 'Graph',
    icon: 'hub',
    group: 'insight',
    to: '/graph',
  },
]

/** The keyboard action behind a rail item: search opens the palette, the rest go to a page. */
export const actionOf = (id: string): ActionId =>
  id === 'search' ? 'search.open' : (`go.${id}` as ActionId)

/** Which rail item a path belongs to. An item page belongs to Knowledge. */
export const activeFor = (pathname: string) => {
  const first = pathname.split('/')[1] ?? ''
  if (first === 'items') return 'knowledge'
  return railItems.some((i) => i.id === first) ? first : ''
}
