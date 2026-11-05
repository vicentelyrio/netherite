import { useEffect } from 'react'
import { FilterTabs } from '@/components'
import { useI18nContext } from '@/infrastructure/i18n'
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable)
      if (typing || e.metaKey || e.ctrlKey || e.altKey || tab === 'changes') return
      const key = e.key.toLowerCase()
      if (key === 'j') move(1)
      else if (key === 'k') move(-1)
      else if (key === 'e' && selected) archive(selected)
      else if (key === 'h' && selected) snooze(selected)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, move, selected, archive, snooze])
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
