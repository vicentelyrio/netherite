import { Avatar, Rail, type RailItem } from '@netherite/ui'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useHealth, useInbox, waitingCount } from '@/infrastructure/query'
import {
  type ActionId,
  formatShortcut,
  useActionShortcuts,
  useResolvedShortcuts,
} from '@/infrastructure/shortcuts'
import { actionOf, activeFor, railItems } from '../rail'

const avatarSize = 32

export function AppRail({ onSearch }: { readonly onSearch: () => void }) {
  const { LL } = useI18nContext()
  const api = useApi()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const health = useHealth(api)
  const inbox = useInbox(api)
  const waiting = inbox.data ? waitingCount(inbox.data) : 0
  const resolved = useResolvedShortcuts()

  const select = (id: string) => {
    if (id === 'search') return onSearch()
    const to = railItems.find((i) => i.id === id)?.to
    if (to !== undefined) void navigate({ to })
  }
  useActionShortcuts(
    Object.fromEntries(railItems.map((i) => [actionOf(i.id), () => select(i.id)])) as Partial<
      Record<ActionId, () => void>
    >,
  )

  const labels: Record<string, string> = {
    search: LL.navigation.search(),
    inbox: LL.navigation.inbox(),
    goals: LL.navigation.goals(),
    projects: LL.navigation.projects(),
    knowledge: LL.navigation.knowledge(),
    stats: LL.navigation.stats(),
    tags: LL.navigation.tags(),
    timeline: LL.navigation.timeline(),
    graph: LL.navigation.graph(),
    settings: LL.navigation.settings(),
  }
  const items: RailItem[] = railItems.map(({ to: _to, ...item }) => {
    const { keys } = resolved[actionOf(item.id)]
    return {
      ...item,
      label: labels[item.id] ?? item.id,
      ...(keys === null ? {} : { hint: formatShortcut(keys) }),
      ...(item.id === 'inbox' ? { badge: waiting } : {}),
    }
  })

  return (
    <Rail
      label={LL.navigation.main()}
      items={items}
      active={activeFor(pathname)}
      onSelect={select}
      footer={
        health.data?.user ? (
          <Avatar name={health.data.user} size={avatarSize} color="warning" />
        ) : null
      }
    />
  )
}
