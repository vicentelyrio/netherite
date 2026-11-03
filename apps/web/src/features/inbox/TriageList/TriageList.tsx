import { EmptyState } from '@netherite/ui'
import { useI18nContext } from '@/infrastructure/i18n'
import { useInboxState } from '../InboxProvider'
import './TriageList.css'

/** What the repo raises on this tab, one row each; the picked row opens in the panel beside it. */
export function TriageList() {
  const { LL } = useI18nContext()
  const { shown, selected, select, snoozed, tab } = useInboxState()
  if (shown.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title={LL.inbox.zero.title()}
        description={
          snoozed > 0
            ? LL.inbox.zero.snoozed({ count: snoozed })
            : tab === 'commits'
              ? LL.inbox.zero.commits()
              : LL.inbox.zero.text()
        }
      />
    )
  }
  return (
    <ul className="tri-list" aria-label={LL.inbox.tabs[tab]()}>
      {shown.map((r) => (
        <li key={r.key}>
          <button
            type="button"
            className="tri-row"
            aria-current={selected?.key === r.key || undefined}
            onClick={() => select(r.key)}
          >
            <span className="tri-rule" data-rule={r.rule}>
              {LL.inbox.rules[r.rule]()}
            </span>
            <span className="tri-title">{r.title}</span>
            <span className="tri-detail">{r.detail}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
