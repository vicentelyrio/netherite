import type { RailItem } from '@netherite/ui'
import type { ActionId } from '@/infrastructure/shortcuts'

export const railItems: ReadonlyArray<Omit<RailItem, 'label' | 'hint'> & { readonly to?: string }> =
  [
    { id: 'search', icon: 'search' },
    { id: 'inbox', icon: 'inbox', group: 'inbox', to: '/inbox' },
    {
      id: 'goals',
      icon: 'track_changes',
      group: 'work',
      to: '/goals',
    },
    {
      id: 'projects',
      icon: 'task_alt',
      group: 'work',
      to: '/projects',
    },
    {
      id: 'knowledge',
      icon: 'stacks',
      group: 'work',
      to: '/knowledge',
    },
    {
      id: 'graph',
      icon: 'hub',
      group: 'insight',
      to: '/graph',
    },
    {
      id: 'timeline',
      icon: 'timeline',
      group: 'insight',
      to: '/timeline',
    },
    {
      id: 'tags',
      icon: 'sell',
      group: 'insight',
      to: '/tags',
    },
    {
      id: 'stats',
      icon: 'bar_chart',
      group: 'insight',
      to: '/stats',
    },
    { id: 'settings', icon: 'settings', group: 'settings', to: '/settings' },
  ]

export const actionOf = (id: string): ActionId =>
  id === 'search' ? 'search.open' : (`go.${id}` as ActionId)

export const activeFor = (pathname: string) => {
  const first = pathname.split('/')[1] ?? ''
  if (first === 'items') return 'knowledge'
  return railItems.some((i) => i.id === first) ? first : ''
}
