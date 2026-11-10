import type { ItemDetail } from '@netherite/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { SourceEditor } from '@/features/editor'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { useNotices } from '@/infrastructure/notices'
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
import { DocSheet } from '../DocSheet'
import { fillSelection } from './fill'
import './DocView.css'

export function DocView({
  item,
  mode: start,
  fill = false,
}: {
  readonly item: ItemDetail
  readonly mode?: 'split'
  readonly fill?: boolean
}) {
  const { LL } = useI18nContext()
  const notices = useNotices()
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
  const review = {
    pending: markReviewed.isPending,
    run: () =>
      markReviewed.mutate(item.hash, {
        onSuccess: () =>
          void notices.notify({
            variant: 'success',
            title: LL.knowledge.doc.main.markedReviewed({ name: item.title }),
          }),
      }),
  }
  const setStatus = useWrite(
    api,
    (a, state: string) =>
      a.call((c) => c.items.setState({ params: { id: item.id }, payload: { state } })),
    { reload: () => void client.invalidateQueries() },
  )

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
    <DocSheet label={item.title} hash={item.hash}>
      <DocHeader item={item} stale={stale} changedLines={changedLines} review={review} />
      <div className="kf-body">
        <SourceEditor
          id={item.id}
          variant="drawer"
          preview={
            <div className="kf-split">
              <DocMain item={item} data={view.data} stale={stale} steps={steps} review={review} />
              <DocPanel
                item={item}
                data={view.data}
                preview={preview.data}
                stale={stale}
                status={{ pending: setStatus.isPending, set: (s) => setStatus.mutate(s) }}
              />
            </div>
          }
          mode={mode}
          onModeChange={(m) => setMode(m as 'split' | 'text')}
          onStats={(stats) => setChangedLines(stats.changedLines)}
          {...(fill
            ? {
                onReady: (editor) => {
                  editor.dispatch({ selection: fillSelection(editor.state.doc.toString()) })
                  editor.focus()
                },
              }
            : {})}
          branch={health.data?.branch}
        />
      </div>
    </DocSheet>
  )
}
