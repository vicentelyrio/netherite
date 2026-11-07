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
import { useI18nContext } from '@/infrastructure/i18n'
import { CoChangedFile } from '../CoChangedFile'
import { DocCovers } from '../DocCovers'
import { DocLinkAction, DocUnlink } from '../DocLinkAction'
import { NoLinks } from '../NoLinks'
import { PanelSection } from '../PanelSection'
import { SupersessionChain } from '../SupersessionChain'
import './DocPanel.css'

const statusesFor = (type: string) =>
  type === 'adr'
    ? (['proposed', 'accepted', 'deprecated'] as const)
    : (['active', 'deprecated'] as const)
const statusIcon = {
  proposed: 'pending',
  accepted: 'check_circle',
  active: 'check_circle',
  deprecated: 'block',
} as const

const stringsOf = (value: unknown): ReadonlyArray<string> =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

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
  readonly status?: { readonly pending: boolean; readonly set: (status: string) => void }
}) {
  const { LL } = useI18nContext()
  const switchName = useId()
  const type = item.type as ItemTypeName
  const fresh = item.freshness
  const current = item.status ?? (type === 'adr' ? undefined : 'active')
  const linkable = type === 'doc' || type === 'runbook'
  const front = (item.frontmatter ?? {}) as Record<string, unknown>
  const explained = stringsOf(front.explains)
  const owner = [front.owner, front.created_by].find((v) => typeof v === 'string' && v !== '')
  const source = typeof front.source === 'string' && front.source !== '' ? front.source : undefined
  const importedAt = typeof front.imported_at === 'string' ? front.imported_at : undefined
  return (
    <aside className="kf-panel" aria-label={LL.knowledge.doc.panel.label()}>
      <PanelSection title={LL.knowledge.doc.panel.typeStatus()}>
        <div className="kf-status-row">
          <TypeBadge type={type} />
          {item.status !== undefined &&
            item.status !== 'active' &&
            (status === undefined || item.status === 'superseded') && (
              <AdrStatusPill status={item.status as AdrStatus} />
            )}
          {item.orphan && <OrphanTag />}
        </div>
        {status !== undefined && current !== 'superseded' && (
          <div className="kf-switch" role="radiogroup" aria-label={LL.knowledge.doc.changeStatus()}>
            {statusesFor(type).map((s) => (
              <label key={s} data-status={s} data-on={current === s || undefined}>
                <input
                  type="radio"
                  className="nt-visually-hidden"
                  name={switchName}
                  checked={current === s}
                  disabled={status.pending}
                  onChange={() => s !== current && status.set(s)}
                />
                <Icon
                  name={statusIcon[s]}
                  size={15}
                  filled={current === s}
                  className="kf-switch-icon"
                />
                {LL.decisions.status[s]()}
              </label>
            ))}
          </div>
        )}
        {typeof owner === 'string' && (
          <p className="kf-owner">{LL.knowledge.doc.panel.owner({ name: owner })}</p>
        )}
      </PanelSection>
      {source !== undefined && (
        <PanelSection title={LL.knowledge.doc.panel.source()}>
          <p className="kf-source">{LL.knowledge.doc.panel.importedFrom({ source })}</p>
          {importedAt !== undefined && (
            <p className="app-muted">{LL.knowledge.doc.panel.importedOn({ date: importedAt })}</p>
          )}
        </PanelSection>
      )}
      {type === 'adr' && data && <SupersessionChain id={item.id} chain={data.chain} />}
      {!stale && type !== 'adr' && fresh !== null && fresh.state === 'fresh' && (
        <PanelSection title={LL.knowledge.doc.panel.freshness()}>
          <span className="app-muted">
            {fresh.commits === 0
              ? LL.knowledge.doc.panel.upToDate()
              : LL.knowledge.doc.panel.sinceReview({ count: fresh.commits })}
          </span>
        </PanelSection>
      )}
      {stale && type !== 'adr' && fresh !== null && data?.changes && (
        <PanelSection title={LL.knowledge.doc.panel.freshness()}>
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
        </PanelSection>
      )}
      <PanelSection title={LL.knowledge.doc.panel.linkedFrom({ count: item.backlinks.length })}>
        {item.backlinks.map((l) => (
          <LinkRow key={`${l.kind}:${l.path}`} link={l} />
        ))}
        {item.backlinks.length === 0 && (
          <p className="app-muted">{LL.knowledge.doc.panel.noBacklinks()}</p>
        )}
      </PanelSection>
      <PanelSection title={LL.knowledge.doc.panel.linksTo({ count: item.links.length })}>
        {item.links.map((l) => (
          <LinkRow
            key={`${l.kind}:${l.path}`}
            link={l}
            action={
              linkable &&
              l.kind === 'explains' &&
              l.id !== undefined &&
              explained.includes(l.id) ? (
                <DocUnlink item={item} to={l.id} />
              ) : undefined
            }
          />
        ))}
        {item.links.length === 0 &&
          (linkable ? (
            <NoLinks>{LL.knowledge.doc.panel.notLinked()}</NoLinks>
          ) : (
            <p className="app-muted">{LL.knowledge.doc.panel.noLinks()}</p>
          ))}
        {linkable && <DocLinkAction item={item} />}
      </PanelSection>
      {type !== 'adr' && <DocCovers item={item} covers={stringsOf(front.covers)} />}
      <PanelSection
        title={
          <>
            <Icon name="commit" size={15} /> {LL.knowledge.doc.panel.changesWith()}
          </>
        }
      >
        {preview?.coChanged === null ? (
          <p className="app-muted">{LL.knowledge.doc.panel.needsGit()}</p>
        ) : (
          preview?.coChanged?.files.map((f) => <CoChangedFile key={f.path} file={f} />)
        )}
        {preview?.coChanged?.files.length === 0 && (
          <p className="app-muted">{LL.knowledge.doc.panel.noCoChanged()}</p>
        )}
      </PanelSection>
    </aside>
  )
}
