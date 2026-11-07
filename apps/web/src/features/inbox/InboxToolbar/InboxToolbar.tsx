import { FilterTabs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
import { useActionShortcuts } from '@/infrastructure/shortcuts'
import { useInboxState } from '../InboxProvider'
import type { Tab } from '../triage'

const tabs = [
  'all',
  'captured',
  'review',
  'commits',
  'changes',
] as const satisfies ReadonlyArray<Tab>

export function InboxToolbar() {
  const { LL } = useI18nContext()
  const { tab, setTab, countOf, inbox, selected, move, archive, snooze } = useInboxState()
  useActionShortcuts(
    {
      'inbox.next': () => move(1),
      'inbox.previous': () => move(-1),
      'inbox.archive': () => selected && archive(selected),
      'inbox.snooze': () => selected && snooze(selected),
    },
    { enabled: tab !== 'changes' },
  )
  return (
    <FilterTabs
      label={LL.inbox.tabs.label()}
      options={tabs.map((value) => ({
        value,
        label: LL.inbox.tabs[value](),
        count: value === 'changes' ? inbox.activity.length + inbox.changes.length : countOf(value),
      }))}
      value={tab}
      onChange={setTab}
    />
  )
}
