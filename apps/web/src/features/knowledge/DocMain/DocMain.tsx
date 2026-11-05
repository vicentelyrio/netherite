import type { ItemDetail, KnowledgeView } from '@netherite/api'
import type { ItemTypeName } from '@netherite/ui'
import { useState } from 'react'
import { Markdown } from '@/components/Markdown'
import { isoDay } from '@/infrastructure/datetime'
import { useI18nContext } from '@/infrastructure/i18n'
import { AdrBody } from '../AdrBody'
import { AdrLifecycle } from '../AdrLifecycle'
import { ContextCard } from '../ContextCard'
import { StaleWarning } from '../StaleWarning'
import { SupersededBanner } from '../SupersededBanner'
import './DocMain.css'

export interface ReviewAction {
  readonly pending: boolean
  readonly run: () => void
}

/**
 * The middle of the doc view: what is special about the type (a stale doc's warning and the
 * commits behind it, a superseded ADR's banner and lifecycle, a context item's switch) above the
 * rendered text.
 */
export function DocMain({
  item,
  data,
  stale,
  steps,
  review,
}: {
  readonly item: ItemDetail
  readonly data: KnowledgeView | undefined
  readonly stale: boolean
  readonly steps: ReadonlyArray<{ status: string; date?: string; sha?: string }>
  readonly review: ReviewAction
}) {
  const { LL } = useI18nContext()
  const [showChanges, setShowChanges] = useState(false)
  const type = item.type as ItemTypeName
  const fresh = item.freshness
  const newer = item.backlinks.find((l) => l.kind === 'supersedes' && l.id !== undefined)
  return (
    <div className="kf-main">
      {stale && type !== 'adr' && fresh !== null && (
        <StaleWarning
          title={LL.knowledge.doc.main.staleTitle({ count: fresh.commits })}
          detail={LL.knowledge.doc.main.reviewed({
            date: fresh.since ?? LL.knowledge.doc.main.never(),
          })}
          actions={
            <div className="kf-warning-actions">
              <button
                type="button"
                className="kf-amber"
                onClick={() => setShowChanges(!showChanges)}
              >
                {showChanges
                  ? LL.knowledge.doc.main.hideChanges()
                  : LL.knowledge.doc.main.reviewChanges()}
              </button>
              <button
                type="button"
                className="kf-amber-ghost"
                disabled={review.pending}
                onClick={review.run}
              >
                {LL.knowledge.doc.main.markReviewed()}
              </button>
            </div>
          }
        />
      )}
      {showChanges && data?.changes && (
        <ul className="kn-commits" aria-label={LL.knowledge.doc.main.commits()}>
          {data.changes.commits.map((c) => (
            <li key={c.hash}>
              <code>{c.hash.slice(0, 7)}</code> {c.subject}{' '}
              <span className="app-muted">
                {c.author}, {isoDay(c.date)}
              </span>
            </li>
          ))}
          {data.changes.commits.length === 0 && (
            <li className="app-muted">{LL.knowledge.doc.main.onlyUncommitted()}</li>
          )}
        </ul>
      )}
      {type === 'adr' && item.status === 'superseded' && <SupersededBanner newer={newer} />}
      {type === 'adr' && item.status !== undefined && (
        <AdrLifecycle status={item.status} steps={steps} />
      )}
      {type === 'context' && data?.context && <ContextCard item={item} context={data.context} />}
      {!/^\s*#\s/.test(item.body) && <h1 className="kf-title">{item.title}</h1>}
      {type === 'adr' ? <AdrBody source={item.body} /> : <Markdown source={item.body} />}
    </div>
  )
}
