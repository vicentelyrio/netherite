import type { ItemDetail, KnowledgePreview, KnowledgeView } from '@netherite/api'
import {
  type AdrStatus,
  AdrStatusPill,
  Icon,
  type ItemTypeName,
  OrphanTag,
  TypeBadge,
} from '@netherite/ui'
import { useId } from 'react'
import { LinkRow } from '@/components'
import { isoDay } from '@/infrastructure/datetime'
import { SupersessionChain } from '../SupersessionChain'
import '../shared.css'
import { useI18nContext } from '@/infrastructure/i18n'
import './DocPanel.css'

const adrStatuses = ['proposed', 'accepted', 'deprecated'] as const
const adrIcon = { proposed: 'pending', accepted: 'check_circle', deprecated: 'block' } as const

/** What the item is connected to: its type and status, freshness, links both ways, co-changes. */
export function DocPanel({
  item,
  data,
  preview,
  stale,
  status,
}: {
  readonly item: ItemDetail
  readonly data: KnowledgeView | undefined
  readonly preview: KnowledgePreview | undefined
  readonly stale: boolean
  /** Changes an ADR's status; superseding is done by the new decision, not from here. */
  readonly status?: { readonly pending: boolean; readonly set: (status: string) => void }
}) {
  const { LL } = useI18nContext()
  const switchName = useId()
  const type = item.type as ItemTypeName
  const fresh = item.freshness
  const front = (item.frontmatter ?? {}) as Record<string, unknown>
  const owner = [front.owner, front.created_by].find((v) => typeof v === 'string' && v !== '')
  return (
    <aside className="kf-panel" aria-label={LL.knowledge.doc.panel.label()}>
      <section className="kf-section">
        <h2 className="kf-h">{LL.knowledge.doc.panel.typeStatus()}</h2>
        <div className="kf-status-row">
          <TypeBadge type={type} />
          {type === 'adr' &&
            item.status !== undefined &&
            (status === undefined || item.status === 'superseded') && (
              <AdrStatusPill status={item.status as AdrStatus} />
            )}
          {item.orphan && <OrphanTag />}
        </div>
        {type === 'adr' && status !== undefined && item.status !== 'superseded' && (
          <div className="kf-switch" role="radiogroup" aria-label={LL.knowledge.doc.changeStatus()}>
            {adrStatuses.map((s) => (
              <label key={s} data-status={s} data-on={item.status === s || undefined}>
                <input
                  type="radio"
                  className="nt-visually-hidden"
                  name={switchName}
                  checked={item.status === s}
                  disabled={status.pending}
                  onChange={() => s !== item.status && status.set(s)}
                />
                <Icon name={adrIcon[s]} size={15} filled={item.status === s} />
                {LL.decisions.status[s]()}
              </label>
            ))}
          </div>
        )}
        {typeof owner === 'string' && (
          <p className="kf-owner">{LL.knowledge.doc.panel.owner({ name: owner })}</p>
        )}
      </section>
      {type === 'adr' && data && <SupersessionChain id={item.id} chain={data.chain} />}
      {!stale && type !== 'adr' && fresh !== null && fresh.state === 'fresh' && (
        <section className="kf-section">
          <h2 className="kf-h">{LL.knowledge.doc.panel.freshness()}</h2>
          <span className="app-muted">
            {fresh.commits === 0
              ? LL.knowledge.doc.panel.upToDate()
              : LL.knowledge.doc.panel.sinceReview({ count: fresh.commits })}
          </span>
        </section>
      )}
      {stale && type !== 'adr' && fresh !== null && data?.changes && (
        <section className="kf-section">
          <h2 className="kf-h">{LL.knowledge.doc.panel.freshness()}</h2>
          <span className="kf-stale-line">
            <Icon name="warning" size={15} filled />{' '}
            {LL.knowledge.doc.panel.sinceReview({ count: fresh.commits })}
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
        <h2 className="kf-h">
          {LL.knowledge.doc.panel.linkedFrom({ count: item.backlinks.length })}
        </h2>
        {item.backlinks.map((l) => (
          <LinkRow key={`${l.kind}:${l.path}`} link={l} />
        ))}
        {item.backlinks.length === 0 && (
          <div className="kn-none">
            <Icon name="link_off" size={15} /> {LL.knowledge.doc.panel.orphan()}
          </div>
        )}
      </section>
      <section className="kf-section">
        <h2 className="kf-h">{LL.knowledge.doc.panel.linksTo({ count: item.links.length })}</h2>
        {item.links.map((l) => (
          <LinkRow key={`${l.kind}:${l.path}`} link={l} />
        ))}
        {item.links.length === 0 && <p className="app-muted">{LL.knowledge.doc.panel.noLinks()}</p>}
      </section>
      <section className="kf-section">
        <h2 className="kf-h">
          <Icon name="commit" size={15} /> {LL.knowledge.doc.panel.changesWith()}
        </h2>
        {preview?.coChanged === null ? (
          <p className="app-muted">{LL.knowledge.doc.panel.needsGit()}</p>
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
          <p className="app-muted">{LL.knowledge.doc.panel.noCoChanged()}</p>
        )}
      </section>
    </aside>
  )
}
