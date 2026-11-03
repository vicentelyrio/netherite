import type { ItemDetail, KnowledgePreview, KnowledgeView } from '@netherite/api'
import {
  type AdrStatus,
  AdrStatusPill,
  Icon,
  type ItemTypeName,
  OrphanTag,
  TypeBadge,
} from '@netherite/ui'
import { LinkRow } from '@/components'
import { isoDay } from '@/infrastructure/datetime'
import { SupersessionChain } from '../SupersessionChain'
import '../shared.css'
import './DocPanel.css'

/** What the item is connected to: its type and status, freshness, links both ways, co-changes. */
export function DocPanel({
  item,
  data,
  preview,
  stale,
}: {
  readonly item: ItemDetail
  readonly data: KnowledgeView | undefined
  readonly preview: KnowledgePreview | undefined
  readonly stale: boolean
}) {
  const type = item.type as ItemTypeName
  const fresh = item.freshness
  return (
    <aside className="kf-panel" aria-label="Related">
      <section className="kf-section">
        <h2 className="kf-h">Type &amp; status</h2>
        <div className="kf-status-row">
          <TypeBadge type={type} />
          {type === 'adr' && item.status !== undefined && (
            <AdrStatusPill status={item.status as AdrStatus} />
          )}
          {item.orphan && <OrphanTag />}
        </div>
      </section>
      {type === 'adr' && data && <SupersessionChain id={item.id} chain={data.chain} />}
      {stale && type !== 'adr' && fresh !== null && data?.changes && (
        <section className="kf-section">
          <h2 className="kf-h">Freshness</h2>
          <span className="kf-stale-line">
            <Icon name="warning" size={15} filled /> {fresh.commits} commits since review
          </span>
          {data.changes.commits.slice(0, 3).map((c) => (
            <div key={c.hash} className="kf-commit">
              <code>{c.hash.slice(0, 7)}</code>
              <span>{c.subject}</span>
              <span className="app-muted">{isoDay(c.date)}</span>
            </div>
          ))}
        </section>
      )}
      <section className="kf-section">
        <h2 className="kf-h">Linked from · {item.backlinks.length}</h2>
        {item.backlinks.map((l) => (
          <LinkRow key={`${l.kind}:${l.path}`} link={l} />
        ))}
        {item.backlinks.length === 0 && (
          <div className="kn-none">
            <Icon name="link_off" size={15} /> Orphan: nothing links here
          </div>
        )}
      </section>
      <section className="kf-section">
        <h2 className="kf-h">Links to · {item.links.length}</h2>
        {item.links.map((l) => (
          <LinkRow key={`${l.kind}:${l.path}`} link={l} />
        ))}
        {item.links.length === 0 && <p className="app-muted">No outgoing links</p>}
      </section>
      <section className="kf-section">
        <h2 className="kf-h">
          <Icon name="commit" size={15} /> Changes with
        </h2>
        {preview?.coChanged === null ? (
          <p className="app-muted">Needs git history.</p>
        ) : (
          preview?.coChanged?.files.map((f) => (
            <div key={f.path} className="kn-file-row">
              <span className="kn-mono">{f.path}</span>
              <span className="kn-bar-mini">
                <span style={{ width: `${Math.round(f.share * 100)}%` }} />
              </span>
              <span className="app-muted">{f.commits}</span>
            </div>
          ))
        )}
        {preview?.coChanged?.files.length === 0 && (
          <p className="app-muted">No files change with it yet</p>
        )}
      </section>
    </aside>
  )
}
