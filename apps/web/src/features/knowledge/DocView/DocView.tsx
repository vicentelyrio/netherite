import type { ItemDetail } from '@netherite/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { SourceEditor } from '@/features/editor'
import { useApi } from '@/infrastructure/api'
import {
  itemHistoryQuery,
  keys,
  previewQuery,
  useHealth,
  useWrite,
  viewQuery,
} from '@/infrastructure/query'
import { DocHeader } from '../DocHeader'
import { DocMain } from '../DocMain'
import { DocPanel } from '../DocPanel'
import './DocView.css'

/**
 * A doc, ADR, context or runbook, as designed (DocView.dc.html): a header with where the file is,
 * the file beside its rendered text with what is special about its type above, a panel of what it
 * is connected to, and a status bar.
 */
export function DocView({
  item,
  mode: start,
}: {
  readonly item: ItemDetail
  /** `split` opens with the file beside the text. */
  readonly mode?: 'split'
}) {
  const api = useApi()
  const client = useQueryClient()
  const health = useHealth(api)
  const view = useQuery(viewQuery(api, item.id))
  const preview = useQuery(previewQuery(api, item.id))
  const history = useQuery({ ...itemHistoryQuery(api, item.id), enabled: item.type === 'adr' })
  const [mode, setMode] = useState<'split' | 'text'>(start ?? 'text')
  const [changedLines, setChangedLines] = useState(0)

  const reload = () => void client.invalidateQueries({ queryKey: keys.item(item.id) })
  const markReviewed = useWrite(
    api,
    (a, hash: string) =>
      a.call((c) => c.items.markReviewed({ params: { id: item.id }, payload: { baseHash: hash } })),
    { reload },
  )
  const review = { pending: markReviewed.isPending, run: () => markReviewed.mutate(item.hash) }

  const fresh = item.freshness
  const stale = fresh !== null && (fresh.state === 'stale' || fresh.state === 'drifting')
  const steps =
    history.data?.transitions
      .filter((t) => t.field === 'status' && t.kind !== 'seen')
      .map((t) => ({
        status: typeof t.to === 'string' ? t.to : '',
        date: t.date,
        sha: t.hash.slice(0, 7),
      })) ?? []

  return (
    <div className="kf-frame" data-hash={item.hash}>
      <div className="kf-backdrop" />
      <article className="kf-sheet" aria-label={item.title} data-hash={item.hash}>
        <DocHeader item={item} stale={stale} changedLines={changedLines} review={review} />
        <div className="kf-body">
          <SourceEditor
            id={item.id}
            variant="drawer"
            preview={
              <div className="kf-split">
                <DocMain item={item} data={view.data} stale={stale} steps={steps} review={review} />
                <DocPanel item={item} data={view.data} preview={preview.data} stale={stale} />
              </div>
            }
            mode={mode}
            onModeChange={(m) => setMode(m as 'split' | 'text')}
            onStats={(stats) => setChangedLines(stats.changedLines)}
            branch={health.data?.branch}
          />
        </div>
      </article>
    </div>
  )
}
