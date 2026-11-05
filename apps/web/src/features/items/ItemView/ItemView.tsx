import { type ItemDetail, NotFound } from '@netherite/api'
import { Banner, Progress } from '@netherite/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { Markdown } from '@/components'
import { SourceEditor } from '@/features/editor'
import { useApi } from '@/infrastructure/api'
import { useI18nContext } from '@/infrastructure/i18n'
import { itemQuery, keys, useWrite } from '@/infrastructure/query'
import { ItemHeader } from '../ItemHeader'
import { ItemLinks } from '../ItemLinks'
import './ItemView.css'

/**
 * One item, read: its fields, its text rendered with the shared Markdown plugins, and what links
 * to it and from it. `special` can take over an item it knows how to show better (the knowledge
 * screens do), by returning what to show instead.
 */
export function ItemView({
  id,
  special,
}: {
  readonly id: string
  readonly special?: (item: ItemDetail) => ReactNode | undefined
}) {
  const { LL } = useI18nContext()
  const api = useApi()
  const client = useQueryClient()
  const query = useQuery(itemQuery(api, id))
  const reload = () => void client.invalidateQueries({ queryKey: keys.item(id) })
  const [editing, setEditing] = useState(false)
  const review = useWrite(
    api,
    (a, hash: string) =>
      a.call((c) => c.items.markReviewed({ params: { id }, payload: { baseHash: hash } })),
    { reload },
  )

  if (query.isPending) return <div className="app-page app-muted">{LL.common.loading()}</div>
  if (query.isError) {
    const missing = query.error instanceof NotFound
    return (
      <div className="app-page">
        <Banner
          variant={missing ? 'warning' : 'danger'}
          title={missing ? LL.items.none({ id }) : LL.items.loadError()}
        >
          {missing ? LL.items.noneText() : String((query.error as Error).message ?? query.error)}
        </Banner>
      </div>
    )
  }

  const item = query.data
  const taken = special?.(item)
  if (taken !== undefined) return <>{taken}</>

  return (
    <article
      className={`app-page app-item${editing ? ' app-item--editing' : ''}`}
      aria-labelledby="item-title"
      data-hash={item.hash}
    >
      <ItemHeader
        item={item}
        editing={editing}
        onToggleEditing={() => setEditing(!editing)}
        reviewing={review.isPending}
        onReview={() => review.mutate(item.hash)}
      />

      {item.progress !== null && item.progress.total > 0 && (
        <div className="app-progress">
          <Progress
            done={item.progress.done}
            total={item.progress.total}
            label={LL.items.checklist()}
          />
          <span className="app-muted">
            {item.progress.done}/{item.progress.total}
          </span>
        </div>
      )}

      {editing ? <SourceEditor id={id} /> : <Markdown source={item.body} />}

      <ItemLinks links={item.links} backlinks={item.backlinks} />
    </article>
  )
}
