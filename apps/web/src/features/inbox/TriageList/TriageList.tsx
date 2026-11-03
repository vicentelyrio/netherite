import { EmptyState, Icon } from '@netherite/ui'
import { ago } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { useInboxState } from '../InboxProvider'
import { groups, ruleLook, tabOf } from '../triage'
import './TriageList.css'

/** What the repo raises, a card per group with a row each; the picked row opens in the panel beside it. */
export function TriageList() {
  const { LL } = useI18nContext()
  const { shown, selected, select, snoozed, tab } = useInboxState()
  if (shown.length === 0) {
    return (
      <EmptyState
        icon="done_all"
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
    <div className="tri-groups">
      {groups
        .filter((g) => tab === 'all' || tab === g)
        .map((g) => {
          const rows = shown.filter((r) => tabOf(r.rule) === g)
          return rows.length === 0 ? null : (
            <section key={g} className="tri-card">
              <header className="tri-card-head">
                <h2>{LL.inbox.tabs[g]()}</h2>
                <span className="tri-count">{rows.length}</span>
                <span className="tri-src">{LL.inbox.sources[g]()}</span>
              </header>
              <ul className="tri-list" aria-label={LL.inbox.tabs[g]()}>
                {rows.map((r) => {
                  const look = ruleLook[r.rule]
                  return (
                    <li key={r.key}>
                      <button
                        type="button"
                        className="tri-row"
                        style={{ '--tri-tone': look.tone } as React.CSSProperties}
                        aria-current={selected?.key === r.key || undefined}
                        onClick={() => select(r.key)}
                      >
                        <span className="tri-icon" aria-hidden="true">
                          <Icon name={look.icon} size={18} filled={r.rule === 'stale-doc'} />
                        </span>
                        <span className="tri-text">
                          <span className="tri-title">{r.title}</span>
                          <span className="tri-detail">
                            {r.detail || LL.inbox.sources.captured()}
                          </span>
                        </span>
                        {r.rule !== 'capture' && (
                          <span className="tri-chip" data-rule={r.rule}>
                            {LL.inbox.chips[r.rule]()}
                          </span>
                        )}
                        <span className="tri-age">{r.date === undefined ? '' : ago(r.date)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
    </div>
  )
}
