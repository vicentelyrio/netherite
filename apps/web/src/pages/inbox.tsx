import { Banner, Button, EmptyState, type ItemTypeName, TypeBadge } from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Breadcrumbs, GroupCard } from '@/components'
import { useApi } from '@/infrastructure/api'
import { inboxQuery, keys } from '@/infrastructure/query'
import { ago } from './knowledge'

const seenKey = 'netherite:inbox-seen'

/** When the Inbox was last marked as seen, kept in this browser. */
export const lastSeen = (): string | undefined => {
  try {
    return localStorage.getItem(seenKey) ?? undefined
  } catch {
    return undefined
  }
}

const markSeen = (at: string) => {
  try {
    localStorage.setItem(seenKey, at)
  } catch {
    // Private windows forget it.
  }
}

/** What waits for a person, as the Inbox counts it (and the rail badge, by the same rule). */
export const waitingCount = (inbox: {
  readonly proposed: ReadonlyArray<unknown>
  readonly freshness: ReadonlyArray<unknown>
  readonly errors: ReadonlyArray<unknown>
  readonly blocked: ReadonlyArray<unknown>
}) => inbox.proposed.length + inbox.freshness.length + inbox.errors.length + inbox.blocked.length

function ItemRow({
  id,
  title,
  type,
  note,
  meta,
}: {
  readonly id: string
  readonly title: string
  readonly type?: string | undefined
  readonly note?: string
  readonly meta?: React.ReactNode
}) {
  return (
    <Link to="/items/$id" params={{ id }} className="ib-row">
      {type && <TypeBadge type={type as ItemTypeName} />}
      <code className="kn-id">{id}</code>
      <span className="ib-title">{title}</span>
      {note && <span className="app-muted">{note}</span>}
      <span className="kn-spacer" />
      {meta}
    </Link>
  )
}

/**
 * The Inbox: what changed since you last looked (agent activity and uncommitted changes), and what
 * waits for you (decisions, stale docs, orphans, lint errors, blocked work).
 */
export function InboxPage() {
  const api = useApi()
  const client = useQueryClient()
  const [since, setSince] = useState(lastSeen)
  const [all, setAll] = useState(false)
  const query = useQuery(inboxQuery(api, since))

  if (query.isPending) return <div className="app-page app-muted">Loading…</div>
  if (query.isError) {
    return (
      <div className="app-page app-page--wide">
        <Banner variant="danger" title="Could not load the inbox">
          Check that `netherite serve` is still running.
        </Banner>
      </div>
    )
  }
  const inbox = query.data
  const waiting = waitingCount(inbox)
  const changed = inbox.activity.length + inbox.changes.length
  const seen = () => {
    const now = new Date().toISOString()
    markSeen(now)
    setSince(now)
    void client.invalidateQueries({ queryKey: keys.inbox })
  }

  return (
    <div className="app-page app-page--wide ib-page">
      <header className="kn-head">
        <div>
          <Breadcrumbs icon="inbox">
            <strong>Inbox</strong>
          </Breadcrumbs>
          <h1 className="app-title kn-h1">Inbox</h1>
          <p className="kn-sub">
            {waiting === 0
              ? 'Nothing needs you'
              : `${waiting} ${waiting === 1 ? 'thing needs' : 'things need'} you`}
            {' · '}
            {since ? `changes since ${ago(since)}` : 'changes since the beginning'}
          </p>
        </div>
        <div className="kn-head-actions">
          <Button icon="done_all" onClick={seen} disabled={changed === 0}>
            Mark as seen
          </Button>
        </div>
      </header>

      {waiting === 0 && changed === 0 && inbox.orphans.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="All clear"
          description="No decisions to make, no stale docs, no lint errors and nothing blocked. Changes by agents and in your working tree show up here."
        />
      ) : (
        <div className="ib-groups">
          <GroupCard
            className="ib-group"
            title="Decisions to make"
            icon="gavel"
            count={inbox.proposed.length}
          >
            {inbox.proposed.map((a) => (
              <ItemRow
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
              <ItemRow
                key={f.id}
                id={f.id}
                title={f.title}
                meta={
                  <span className="kn-fresh kn-fresh--stale">
                    {f.state === 'stale'
                      ? `Stale · ${f.commits} commits`
                      : `${f.commits} commits behind`}
                  </span>
                }
              />
            ))}
          </GroupCard>
          <GroupCard
            className="ib-group"
            title="Lint errors"
            icon="error"
            count={inbox.errors.length}
          >
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
              <ItemRow
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
            title="Orphans"
            icon="link_off"
            count={inbox.orphans.length}
          >
            {inbox.orphans.map((o) => (
              <ItemRow key={o.id} id={o.id} title={o.title} type={o.type} />
            ))}
          </GroupCard>
          <GroupCard
            className="ib-group"
            title="Agent activity"
            icon="smart_toy"
            count={inbox.activity.length}
          >
            {(all ? inbox.activity : inbox.activity.slice(0, 8)).map((a) => (
              <ItemRow
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
                <ItemRow
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
            <button type="button" className="ib-more" onClick={() => setAll(true)}>
              Show all {inbox.activity.length + inbox.changes.length} changes
            </button>
          )}
        </div>
      )}
    </div>
  )
}
