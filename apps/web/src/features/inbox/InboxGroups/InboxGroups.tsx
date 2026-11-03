import { EmptyState } from '@netherite/ui'
import { FreshnessCell, GroupCard } from '@/components'
import { ago } from '@/infrastructure/datetime'
import { InboxItemRow } from '../InboxItemRow'
import { useInboxState } from '../InboxProvider'
import '../shared.css'
import './InboxGroups.css'

/** What waits for you and what changed, in a group each; "All clear" when there is nothing. */
export function InboxGroups() {
  const { inbox, waiting, changed, all, showAll } = useInboxState()
  if (waiting === 0 && changed === 0 && inbox.orphans.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="All clear"
        description="No decisions to make, no stale docs, no lint errors and nothing blocked. Changes by agents and in your working tree show up here."
      />
    )
  }
  return (
    <div className="ib-groups">
      <GroupCard
        className="ib-group"
        title="Decisions to make"
        icon="gavel"
        count={inbox.proposed.length}
      >
        {inbox.proposed.map((a) => (
          <InboxItemRow
            key={a.id}
            id={a.id}
            title={a.title}
            type="adr"
            meta={
              <span className="ib-chip" data-s="proposed">
                Proposed
              </span>
            }
          />
        ))}
      </GroupCard>
      <GroupCard
        className="ib-group"
        title="Docs gone stale"
        icon="warning"
        count={inbox.freshness.length}
      >
        {inbox.freshness.map((f) => (
          <InboxItemRow
            key={f.id}
            id={f.id}
            title={f.title}
            meta={<FreshnessCell freshness={f.state} commits={f.commits} />}
          />
        ))}
      </GroupCard>
      <GroupCard className="ib-group" title="Lint errors" icon="error" count={inbox.errors.length}>
        {inbox.errors.map((d) => (
          <div key={`${d.path}:${d.line}:${d.rule}`} className="ib-row">
            <code className="kn-mono">
              {d.path}:{d.line}
            </code>
            <span className="ib-title">{d.message}</span>
            <span className="kn-spacer" />
            <span className="app-muted">{d.rule}</span>
          </div>
        ))}
      </GroupCard>
      <GroupCard
        className="ib-group"
        title="Blocked tasks"
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
      <GroupCard className="ib-group" title="Orphans" icon="link_off" count={inbox.orphans.length}>
        {inbox.orphans.map((o) => (
          <InboxItemRow key={o.id} id={o.id} title={o.title} type={o.type} />
        ))}
      </GroupCard>
      <GroupCard
        className="ib-group"
        title="Agent activity"
        icon="smart_toy"
        count={inbox.activity.length}
      >
        {(all ? inbox.activity : inbox.activity.slice(0, 8)).map((a) => (
          <InboxItemRow
            key={a.id}
            id={a.id}
            title={a.deleted ? 'Deleted' : `${a.count} ${a.count === 1 ? 'change' : 'changes'}`}
            note={a.tools.join(', ')}
            meta={<span className="app-muted">{ago(a.last)}</span>}
          />
        ))}
      </GroupCard>
      <GroupCard
        className="ib-group"
        title="Uncommitted changes"
        icon="difference"
        count={inbox.changes.length}
      >
        {(all ? inbox.changes : inbox.changes.slice(0, 8)).map((c) =>
          c.id ? (
            <InboxItemRow
              key={c.path}
              id={c.id}
              title={c.title ?? c.id}
              type={c.type}
              meta={<span className="ib-chip">{c.change}</span>}
            />
          ) : (
            <div key={c.path} className="ib-row">
              <code className="kn-mono">{c.path}</code>
              <span className="kn-spacer" />
              <span className="ib-chip">{c.change}</span>
            </div>
          ),
        )}
      </GroupCard>
      {!all && (inbox.activity.length > 8 || inbox.changes.length > 8) && (
        <button type="button" className="ib-more" onClick={showAll}>
          Show all {inbox.activity.length + inbox.changes.length} changes
        </button>
      )}
    </div>
  )
}
