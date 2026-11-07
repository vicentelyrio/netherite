import { settingDefaults } from '@netherite/schema'
import { EmptyState } from '@netherite/ui'
import { GroupCard } from '@/components'
import { ago } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { InboxItemRow } from '../InboxItemRow'
import { useInboxState } from '../InboxProvider'
import { InboxRow, InboxRowTitle } from '../InboxRow'
import './InboxGroups.css'

const { changesShown } = settingDefaults.inbox

export function InboxGroups() {
  const { LL } = useI18nContext()
  const { inbox, changed, all, showAll } = useInboxState()
  if (inbox.errors.length === 0 && inbox.blocked.length === 0 && changed === 0) {
    return (
      <EmptyState
        icon="inbox"
        title={LL.inbox.allClear.title()}
        description={LL.inbox.allClear.text()}
      />
    )
  }
  return (
    <div className="ib-groups">
      <GroupCard
        className="ib-group"
        headClassName="ib-group-head"
        title={LL.inbox.groups.lint()}
        icon="error"
        count={inbox.errors.length}
      >
        {inbox.errors.map((d) => (
          <InboxRow key={`${d.path}:${d.line}:${d.rule}`}>
            <code className="kn-mono">
              {d.path}:{d.line}
            </code>
            <InboxRowTitle>{d.message}</InboxRowTitle>
            <span className="kn-spacer" />
            <span className="app-muted">{d.rule}</span>
          </InboxRow>
        ))}
      </GroupCard>
      <GroupCard
        className="ib-group"
        headClassName="ib-group-head"
        title={LL.inbox.groups.blocked()}
        icon="pause_circle"
        count={inbox.blocked.length}
      >
        {inbox.blocked.map((t) => (
          <InboxItemRow
            key={t.id}
            id={t.id}
            title={t.title}
            type="task"
            meta={<span className="app-muted">{t.project}</span>}
          />
        ))}
      </GroupCard>
      <GroupCard
        className="ib-group"
        headClassName="ib-group-head"
        title={LL.inbox.groups.activity()}
        icon="smart_toy"
        count={inbox.activity.length}
      >
        {(all ? inbox.activity : inbox.activity.slice(0, changesShown)).map((a) => (
          <InboxItemRow
            key={a.id}
            id={a.id}
            title={a.deleted ? LL.inbox.deleted() : LL.inbox.changeCount({ count: a.count })}
            note={a.tools.join(', ')}
            meta={<span className="app-muted">{ago(a.last)}</span>}
          />
        ))}
      </GroupCard>
      <GroupCard
        className="ib-group"
        headClassName="ib-group-head"
        title={LL.inbox.groups.changes()}
        icon="difference"
        count={inbox.changes.length}
      >
        {(all ? inbox.changes : inbox.changes.slice(0, changesShown)).map((c) =>
          c.id ? (
            <InboxItemRow
              key={c.path}
              id={c.id}
              title={c.title ?? c.id}
              type={c.type}
              meta={<span className="ib-chip">{c.change}</span>}
            />
          ) : (
            <InboxRow key={c.path}>
              <code className="kn-mono">{c.path}</code>
              <span className="kn-spacer" />
              <span className="ib-chip">{c.change}</span>
            </InboxRow>
          ),
        )}
      </GroupCard>
      {!all && (inbox.activity.length > changesShown || inbox.changes.length > changesShown) && (
        <button type="button" className="ib-more" onClick={showAll}>
          {LL.inbox.showAll({ count: inbox.activity.length + inbox.changes.length })}
        </button>
      )}
    </div>
  )
}
